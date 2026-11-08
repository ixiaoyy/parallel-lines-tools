#!/usr/bin/env python3
"""关联自建二进制、完整源码归档与实际浏览器记录；不执行或上传发布。"""
import argparse
import hashlib
import json
import os
from pathlib import Path
import shutil
import tarfile

ROOT = Path(__file__).resolve().parents[2]


def original_notices(source, lock):
    """汇入实际源码内的原始许可正文；不按仓库链接猜许可类别，也不以链接代替正文。"""
    sections = []
    prefixes = ('COPYING', 'LICENSE', 'LICENCE', 'NOTICE', 'AUTHORS', 'COPYRIGHT', 'PATENTS')

    def append(label, path, data):
        try:
            text = data.decode('utf-8-sig')
            encoding = 'UTF-8'
        except UnicodeDecodeError:
            # 源码包仍保留原字节；Latin-1 一一映射字节，避免替换/丢弃非 UTF-8 的版权姓名。
            text = data.decode('latin-1')
            encoding = 'Latin-1 (lossless byte decoding; original file retained in source archive)'
        sections.extend(['', '=' * 72, label, 'Source archive path: ' + path, 'Text encoding: ' + encoding, '=' * 72, text])

    def component(label, folder, extras=()):
        files = [p for p in folder.iterdir() if p.is_file() and p.name.upper().startswith(prefixes)]
        files += [folder / name for name in extras if (folder / name).is_file()]
        if not files: raise RuntimeError('No original licensing text found for ' + label)
        for file in sorted(set(files)):
            append(label, str(file.relative_to(source)).replace('\\', '/'), file.read_bytes())

    component('ffmpeg.wasm wrapper/build scripts @ ' + lock['upstream']['commit'], source / 'upstream')
    for dependency in lock['dependencies']:
        extras = ('README', 'zlib.h') if dependency['name'] == 'zlib' else ('docs/FTL.TXT', 'docs/GPLv2.TXT') if dependency['name'] == 'freetype2' else ()
        folder = source / 'vendor' / dependency['name']
        component(dependency['name'] + ' @ ' + dependency['commit'], folder, extras)
        for child in dependency.get('submodules', []):
            component(dependency['name'] + '/' + child['path'] + ' @ ' + child['commit'], folder / child['path'])
    for port in lock['ports']:
        component(port['name'] + ' @ ' + port['version'] + ' (official SHA512 verified)', source / 'ports' / port['name'] / port['subdirectory'])
    # 实际 SDK 源码从本次编译镜像导出，不能用另一份下载的 SDK 许可冒充。
    sdk_archive = source / 'toolchain' / 'emscripten-source.tar.gz'
    found_sdk_license = False
    with tarfile.open(sdk_archive, 'r:gz') as package:
        for item in package:
            name = item.name.removeprefix('./')
            if item.isfile() and '/' not in name and name.upper().startswith(prefixes):
                append('Emscripten SDK ' + lock['sdk']['image'], 'toolchain/emscripten-source.tar.gz:' + name, package.extractfile(item).read())
                found_sdk_license = True
    if not found_sdk_license: raise RuntimeError('Actual SDK source archive has no licensing text')
    sections.extend(['', 'Additional original component notices and copyrights remain alongside their files in the complete source archive.'])
    return sections


def descriptor(path):
    """返回发布物的实际字节数与 SHA256，用于收据和部署时身份校验。"""
    return {'file': path.name, 'sha256': hashlib.sha256(path.read_bytes()).hexdigest(), 'bytes': path.stat().st_size}


def record_browser(base):
    """仅接受真实运行成功且未跳过的媒体浏览器结果；不能把构建成功写成转码验收。"""
    report_path = base / 'browser-results.json'
    report = json.loads(report_path.read_text(encoding='utf-8'))
    stats = report['stats']
    assert stats['expected'] >= 1 and stats['unexpected'] == 0 and stats.get('skipped', 0) == 0 and stats.get('flaky', 0) == 0, 'Actual media browser verification did not pass'
    receipt_path = base / 'runtime' / 'core-receipt.json'
    receipt = json.loads(receipt_path.read_text(encoding='utf-8'))
    receipt['validation'] = {'status': 'passed', 'browser': 'chromium', 'actual_media_tests': stats['expected'], 'report': descriptor(report_path), 'scope': 'Existing real-WAV FFmpeg browser case; not all codecs individually exercised.'}
    receipt_path.write_text(json.dumps(receipt, indent=2) + '\n', encoding='utf-8')
    shutil.copy2(receipt_path, base / 'release' / receipt_path.name)
    shutil.copy2(report_path, base / 'release' / 'media-core-browser-results.json')


def finalize(base):
    """将本次构建导出的实际 SDK 源码/工具记录并入 preferred source，再建立产物收据。"""
    lock = json.loads((ROOT / 'core-build.lock.json').read_text(encoding='utf-8'))
    source = base / 'source'
    output = base / 'output'
    runtime = base / 'runtime'
    release = base / 'release'
    runtime.mkdir(exist_ok=False)
    release.mkdir(exist_ok=False)
    for directory in ('toolchain', 'build-records'):
        shutil.copytree(output / directory, source / directory)
    for name in ('prepare.py', 'finalize.py', 'playwright.config.ts', 'buildkitd.toml'):
        shutil.copy2(ROOT / 'scripts' / 'media-core' / name, source / 'recipe' / name)
    shutil.copy2(ROOT / '.github' / 'workflows' / 'build-media-core.yml', source / 'recipe' / 'build-media-core.yml')
    shutil.copy2(base / 'build.log', source / 'build-records' / 'build.log')
    # 所有 vendored commit、子模块、port 原包/校验及 SDK 源码都和实际使用的补丁/配方共同归档。
    archive = release / 'media-core-source.tar.gz'
    with tarfile.open(archive, 'w:gz', compresslevel=6) as package:
        package.add(source, arcname='media-core-source')
    if archive.stat().st_size >= 2 * 1024**3: raise RuntimeError('Source asset exceeds GitHub per-asset limit')
    source_info = descriptor(archive)
    source_info['url'] = f'https://github.com/ixiaoyy/parallel-lines-tools/releases/download/{lock["release_tag"]}/{archive.name}'
    binaries = {}
    for role, name in (('js', 'ffmpeg-core.js'), ('wasm', 'ffmpeg-core.wasm')):
        file = output / 'dist' / 'esm' / name
        if not file.is_file() or file.stat().st_size == 0: raise RuntimeError('Missing compiled core: ' + name)
        if role == 'wasm' and file.read_bytes()[:4] != b'\0asm': raise RuntimeError('Invalid WASM header')
        shutil.copy2(file, runtime / name)
        shutil.copy2(file, release / name)
        binaries[role] = descriptor(file)
    notice = ['ParallelLines self-built single-thread FFmpeg media core', 'Version: ' + lock['release_tag'], 'Core licensing: GPL-2.0-or-later; linked libraries retain their own notices.', 'Preferred source: ' + source_info['url'], 'This build is NOT the original npm binary and does not claim its input provenance.', '', 'Full source, patches, build scripts and component notices are in media-core-source.tar.gz.', '']
    for entry in lock['dependencies']:
        notice.append(entry['name'] + ': ' + entry['repository'] + '/tree/' + entry['commit'])
    notice.extend(original_notices(source, lock))
    notices_path = runtime / 'media-core-NOTICES.txt'
    notices_path.write_text('\n'.join(notice), encoding='utf-8')
    shutil.copy2(notices_path, release / notices_path.name)
    input_info = descriptor(ROOT / 'core-build.lock.json')
    receipt = {'schema': 1, 'version': lock['release_tag'], 'license': 'GPL-2.0-or-later', 'binaries': binaries, 'source': source_info, 'notices': descriptor(notices_path), 'inputs': input_info, 'build': {'repository': os.environ.get('GITHUB_REPOSITORY', 'local-unpublished'), 'revision': os.environ.get('GITHUB_SHA', 'local-uncommitted'), 'run_url': f'https://github.com/{os.environ.get("GITHUB_REPOSITORY", "ixiaoyy/parallel-lines-tools")}/actions/runs/{os.environ.get("GITHUB_RUN_ID", "local")}', 'sdk': lock['sdk'], 'frontend': lock['frontend'], 'builder': lock['builder'], 'parallelism': 2, 'single_thread': True, 'compiler_flags': '-O3 -msimd128'}, 'validation': {'status': 'awaiting-real-browser-verification'}}
    (runtime / 'core-receipt.json').write_text(json.dumps(receipt, indent=2) + '\n', encoding='utf-8')
    shutil.copy2(runtime / 'core-receipt.json', release / 'core-receipt.json')
    shutil.copy2(ROOT / 'core-build.lock.json', release / 'core-build.lock.json')
    print('RUNTIME_READY:', runtime)


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--output', type=Path, default=ROOT / '.media-core')
    parser.add_argument('--record-browser', action='store_true')
    args = parser.parse_args()
    if args.record_browser: record_browser(args.output.resolve())
    else: finalize(args.output.resolve())
