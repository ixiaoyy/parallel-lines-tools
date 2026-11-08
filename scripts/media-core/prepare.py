#!/usr/bin/env python3
"""准备固定媒体核心源码及离线编译上下文；不会运行 Docker 或发布任何内容。"""
import argparse
import configparser
import hashlib
import json
import os
from pathlib import Path
import re
import shutil
import subprocess
import urllib.request
import zipfile

ROOT = Path(__file__).resolve().parents[2]
EXPECTED = {'x264', 'x265', 'libvpx', 'lame', 'ogg', 'theora', 'opus', 'vorbis', 'zlib', 'libwebp', 'freetype2', 'fribidi', 'harfbuzz', 'libass', 'zimg', 'ffmpeg'}


def load_lock():
    """校验只允许固定 GitHub commit 与固定镜像，避免把移动 ref 当作构建身份。"""
    lock = json.loads((ROOT / 'core-build.lock.json').read_text(encoding='utf-8'))
    assert {x['name'] for x in lock['dependencies']} == EXPECTED, 'Codec source inventory changed'
    assert lock['parallelism'] == 2
    for key in ('frontend', 'builder'):
        assert re.fullmatch(r'[a-z0-9/.:_-]+@sha256:[0-9a-f]{64}', lock[key]), key
    assert re.fullmatch(r'[a-z0-9/.:_-]+@sha256:[0-9a-f]{64}', lock['sdk']['image'])
    def check(entry):
        assert re.fullmatch(r'https://github.com/[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+', entry['repository'])
        assert re.fullmatch(r'[0-9a-f]{40}', entry['commit'])
        for child in entry.get('submodules', []):
            parts = Path(child['path']).parts
            assert not Path(child['path']).is_absolute() and '..' not in parts
            check(child)
    check(lock['upstream'])
    for entry in lock['dependencies']: check(entry)
    for port in lock['ports']:
        assert port['name'] == 'sdl2' and re.fullmatch(r'[0-9a-f]{128}', port['sha512'])
        assert port['url'].startswith('https://github.com/libsdl-org/SDL/archive/')
    return lock


def run(args, cwd=None):
    """以参数数组运行有总时限的 Git 准备动作；不执行下载源码中的脚本。"""
    env = {**os.environ, 'GIT_TERMINAL_PROMPT': '0', 'GIT_LFS_SKIP_SMUDGE': '1'}
    subprocess.run(args, cwd=cwd, env=env, check=True, timeout=240)


def checkout(entry, destination, receipts):
    """取得指定 commit 并检查子模块清单，保留 Git 元信息供原版版本脚本使用。"""
    if entry.get('disposition') == 'excluded-not-a-core-build-input': return
    destination.mkdir(parents=True, exist_ok=False)
    run(['git', '-c', 'init.templateDir=', 'init', '--quiet', str(destination)])
    run(['git', 'remote', 'add', 'origin', entry['repository'] + '.git'], destination)
    run(['git', '-c', 'protocol.file.allow=never', 'fetch', '--quiet', '--depth=1', 'origin', entry['commit']], destination)
    run(['git', '-c', 'advice.detachedHead=false', 'checkout', '--quiet', '--detach', 'FETCH_HEAD'], destination)
    head = subprocess.check_output(['git', 'rev-parse', 'HEAD'], cwd=destination, text=True, timeout=30).strip()
    assert head == entry['commit'], 'Source commit mismatch'
    # .gitmodules 必须与锁中清单一致；不让 git 自动追随源码提供的 URL 或嵌套 ref。
    config = configparser.ConfigParser()
    module_file = destination / '.gitmodules'
    if module_file.is_file(): config.read(module_file, encoding='utf-8')
    actual = {config[s]['path']: config[s]['url'].removesuffix('.git') for s in config.sections()}
    expected = {s['path']: s['repository'] for s in entry.get('submodules', [])}
    assert actual == expected, f'Unrecorded submodules in {entry["repository"]}: {actual}'
    receipts.append({'repository': entry['repository'], 'commit': head, 'directory': str(destination.name)})
    for child in entry.get('submodules', []):
        if child.get('disposition') == 'excluded-not-a-core-build-input': continue
        target = destination / child['path']
        assert target.resolve().is_relative_to(destination.resolve())
        # Git checkout 会为 gitlink 留下空目录；仅允许移除确认空的那个目录。
        if target.exists(): target.rmdir()
        checkout(child, target, receipts)


def sdl_port(port, output):
    """校验 Emscripten 3.1.40 官方 SHA512 后填充本地 port，编译阶段不再取网络。"""
    archive = output / 'archives' / 'sdl2.zip'
    archive.parent.mkdir(parents=True, exist_ok=True)
    digest = hashlib.sha512()
    count = 0
    request = urllib.request.Request(port['url'], headers={'User-Agent': 'ParallelLines-media-core'})
    with urllib.request.urlopen(request, timeout=60) as response, archive.open('wb') as file:
        while chunk := response.read(1024 * 1024):
            count += len(chunk)
            if count > 50 * 1024 * 1024: raise RuntimeError('SDL source archive exceeds 50 MB')
            digest.update(chunk)
            file.write(chunk)
    assert digest.hexdigest() == port['sha512'], 'SDL port source hash mismatch'
    target = output / 'ports' / port['name']
    target.mkdir(parents=True, exist_ok=False)
    with zipfile.ZipFile(archive) as source:
        assert sum(i.file_size for i in source.infolist()) < 512 * 1024 * 1024
        for item in source.infolist():
            destination = target / item.filename
            assert destination.resolve().is_relative_to(target.resolve()), 'Unsafe SDL archive path'
        source.extractall(target)
    assert (target / port['subdirectory'] / 'src').is_dir()
    (target / '.emscripten_url').write_text(port['url'] + '\n', encoding='utf-8')


def recipe(lock, source):
    """保留全部上游编解码器，限制并发并移除盲目吞错；所有编译 RUN 均禁止网络。"""
    upstream = source / 'upstream'
    modifications = []
    for path in (upstream / 'build').glob('*.sh'):
        original = path.read_text(encoding='utf-8')
        changed = re.sub(r'(?<!\S)-j(?:\d+|\$\(nproc\))?(?=\s|$)', '-j2', original)
        if path.name == 'zlib.sh':
            # 锁定 zlib 的 CMake 同时生成同名 zlib/zlibstatic；CI 已出现并行归档/ranlib 竞态，仅该库串行。
            changed, count = re.subn(r'(?m)^(emmake make (?:clean|install))(?: -j[12])?$', r'\1 -j1', changed)
            if count != 2: raise RuntimeError('Pinned zlib clean/install recipe changed; refusing an unverified patch')
        if path.name == 'fribidi.sh':
            changed = changed.replace('emmake make install -j2 || true', 'emmake make install -j2')
            changed = changed.replace('# A hacky to fix "Too many symbolic links" error', '# 安装错误必须明确失败，不能用上游旧 workaround 掩盖缺失的库或头文件。')
        if changed != original:
            path.write_text(changed, encoding='utf-8', newline='\n')
            modifications.append(str(path.relative_to(source)))
    repositories = {d['repository'].lower(): d['name'] for d in lock['dependencies']}
    lines = []
    vendor_count = 0
    for line in (upstream / 'Dockerfile').read_text(encoding='utf-8').splitlines():
        if line.startswith('# syntax='): lines.append('# syntax=' + lock['frontend']); continue
        if line.startswith('FROM emscripten/emsdk:'):
            lines.extend(['FROM ' + lock['sdk']['image'] + ' AS emsdk-base', 'WORKDIR /src', 'ENV EMCC_CORES=2 CMAKE_BUILD_PARALLEL_LEVEL=2 MAKEFLAGS=-j2 EM_PORTS=/media-source/ports', 'COPY ports/ /media-source/ports/'])
            continue
        match = re.match(r'ADD (https://github.com/[^#]+)\.git#[^ ]+ /src', line)
        if match:
            name = repositories[match[1].lower()]
            lines.append('COPY vendor/' + name + '/ /src/')
            vendor_count += 1
            continue
        if line.startswith('RUN git clone --recursive '):
            assert 'sekrit-twc/zimg.git' in line
            lines.append('COPY vendor/zimg/ /src/')
            vendor_count += 1
            continue
        if line.startswith('COPY build/') or line.startswith('COPY src/'):
            line = re.sub(r'(?<!\S)(build/|src/)', r'upstream/\1', line)
        # apt 仅用于系统构建工具；所有实际源码/port 编译均无网络，不允许隐藏下载或 CDN fallback。
        if line.startswith('RUN ') and 'apt-get' not in line: line = line.replace('RUN ', 'RUN --network=none ', 1)
        if line == 'FROM scratch AS exportor':
            lines.extend([
                'RUN --network=none mkdir -p /build-records /toolchain && dpkg-query -W > /build-records/os-packages.tsv && emcc --version > /build-records/emcc-version.txt && python3 -c "import pathlib; assert pathlib.Path(\'/emsdk/upstream/emscripten/emscripten-version.txt\').read_text().strip() in (\'3.1.40\', \'3.1.40-git\')" && tar --exclude=./cache --exclude=./.git -czf /toolchain/emscripten-source.tar.gz -C /emsdk/upstream/emscripten .',
                line,
                'COPY --from=ffmpeg-wasm-builder /build-records /build-records',
                'COPY --from=ffmpeg-wasm-builder /toolchain /toolchain'
            ])
            continue
        lines.append(line)
    assert vendor_count == 16, f'Expected 16 vendored source inputs, got {vendor_count}'
    result = '\n'.join(lines) + '\n'
    assert 'ADD https://' not in result and 'git clone' not in result
    assert result.count('--enable-lib') == (upstream / 'Dockerfile').read_text().count('--enable-lib')
    (source / 'Dockerfile').write_text(result, encoding='utf-8', newline='\n')
    (source / '.dockerignore').write_text('archives/\ntoolchain/\n*.tar.gz\n', encoding='utf-8')
    (source / 'MODIFICATIONS.json').write_text(json.dumps({'build_jobs': 2, 'library_jobs': {'zlib': 1}, 'zlib': {'reason': 'Both zlib and zlibstatic map to libz.a under the Emscripten CMake configuration; parallel install produced an llvm-ranlib missing archive failure. Only this library is serialized; no target or codec is removed.', 'failure_evidence': 'https://github.com/ixiaoyy/parallel-lines-tools/actions/runs/42508247233'}, 'patched_scripts': modifications, 'fribidi': 'Removed blind install || true; actual installation failures stop the build and require diagnosis.', 'dockerfile': 'pinned tools; COPY vendored commits and verified SDL port; network disabled for compile; source/export records; no codec removed'}, indent=2) + '\n', encoding='utf-8')


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--validate-lock', action='store_true')
    parser.add_argument('--output', type=Path, default=ROOT / '.media-core')
    args = parser.parse_args()
    lock = load_lock()
    if args.validate_lock:
        print('LOCK_OK: 16 pinned codec repositories, pinned nested sources/SDK/frontend/builder/SDL port')
        return
    source = args.output.resolve() / 'source'
    if source.exists(): raise RuntimeError('Refusing to overwrite an existing source preparation')
    source.mkdir(parents=True)
    receipts = []
    checkout(lock['upstream'], source / 'upstream', receipts)
    for dependency in lock['dependencies']: checkout(dependency, source / 'vendor' / dependency['name'], receipts)
    for port in lock['ports']: sdl_port(port, source)
    recipe(lock, source)
    shutil.copy2(ROOT / 'core-build.lock.json', source / 'core-build.lock.json')
    shutil.copytree(ROOT / 'scripts' / 'media-core', source / 'recipe')
    shutil.copytree(ROOT / 'licenses' / 'media-core', source / 'licensing')
    (source / 'source-receipt.json').write_text(json.dumps(receipts, indent=2) + '\n', encoding='utf-8')
    print('SOURCE_READY:', source)


if __name__ == '__main__': main()
