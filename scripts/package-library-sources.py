#!/usr/bin/env python3
"""为公开分发收集已核版本的 HEIC preferred source；不编译、不上传，也不属于普通 npm 构建前置。"""
import argparse
import hashlib
import json
from pathlib import Path, PurePosixPath
import subprocess
import sys
import tarfile
import time
import urllib.request

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / 'vendor-sources/heic'
LOCK_PATH = ROOT / 'library-sources.lock.json'
CONNECT_TIMEOUT = 20
READ_TIMEOUT = 20
TOTAL_TIMEOUT = 120
MAX_ARCHIVE_BYTES = 40 * 1024 * 1024
MAX_UNPACKED_BYTES = 200 * 1024 * 1024
SOURCES = [
    {'id': 'heic-to', 'version': '1.6.6', 'repository': 'https://github.com/hoppergee/heic-to', 'commit': '4045b8d7607e326c2b479cc424c7a60519b42dae', 'url': 'https://codeload.github.com/hoppergee/heic-to/tar.gz/4045b8d7607e326c2b479cc424c7a60519b42dae', 'file': 'heic-to-1.6.6.tar.gz', 'required': ['package.json', 'package-lock.json', 'yarn.lock', '.tool-versions', 'esbuild.mjs', 'README.md', 'LICENSE', 'src/index.js', 'src/worker.js', 'src/lib/libheif.js', 'src/lib/libheif-without-unsafe-eval.js', 'dist/heic-to.js'], 'licenses': ['LICENSE'], 'materials': ['README.md', 'esbuild.mjs', '.tool-versions']},
    {'id': 'libheif', 'version': '1.23.6', 'repository': 'https://github.com/strukturag/libheif', 'commit': 'f81f28ac014b1c28dee483ac45b72c6b05bc421a', 'url': 'https://codeload.github.com/strukturag/libheif/tar.gz/f81f28ac014b1c28dee483ac45b72c6b05bc421a', 'file': 'libheif-1.23.6.tar.gz', 'required': ['CMakeLists.txt', 'libheif/CMakeLists.txt', 'libheif/api/libheif/heif_emscripten.h', 'post.js', 'build-emscripten.sh', 'COPYING'], 'licenses': ['COPYING'], 'materials': ['build-emscripten.sh', 'post.js', '.github/workflows/emscripten.yml']},
    {'id': 'libde265', 'version': '1.0.16', 'repository': 'https://github.com/strukturag/libde265', 'commit': '7ba65889d3d6d8a0d99b5360b028243ba843be3a', 'url': 'https://github.com/strukturag/libde265/releases/download/v1.0.16/libde265-1.0.16.tar.gz', 'file': 'libde265-1.0.16.tar.gz', 'required': ['configure', 'configure.ac', 'CMakeLists.txt', 'COPYING', 'libde265/COPYING'], 'licenses': ['COPYING', 'libde265/COPYING'], 'materials': []}
]
WRAPPER = {'archive_path': 'dist/heic-to.js', 'bytes': 3152244, 'sha256': '122fd24dbb031605a11dd0908010adb09128d8d803f34987c72162f762e4708c', 'evidence': 'Installed heic-to@1.6.6 default export matches the same file at its official gitHead and v1.6.6 tag. CSP variant is not the current toolbox import.'}


def digest_file(path):
    """流式核对实际存储字节，不把大源码包整体读入内存。"""
    digest = hashlib.sha256()
    count = 0
    with path.open('rb') as file:
        while data := file.read(1024 * 1024): digest.update(data); count += len(data)
    return {'sha256': digest.hexdigest(), 'bytes': count}


def io_worker(index):
    """单包网络子进程：urllib 设置连接/读超时，并限制总字节；不重试、不替换有效缓存。"""
    source = SOURCES[index]
    part = OUTPUT / (source['file'] + '.partial')
    if part.exists(): raise RuntimeError('Refusing to overwrite task-owned partial file: ' + part.name)
    start = time.monotonic()
    request = urllib.request.Request(source['url'], headers={'User-Agent': 'ParallelLines-preferred-source-collector'})
    # urlopen 的 socket timeout 同时约束连接与单次读取；外层进程提供持续慢速传输的硬总截止。
    with urllib.request.urlopen(request, timeout=min(CONNECT_TIMEOUT, READ_TIMEOUT)) as response, part.open('xb') as file:
        count = 0
        while chunk := response.read1(64 * 1024):
            if time.monotonic() - start > TOTAL_TIMEOUT: raise TimeoutError('Source download exceeded total limit')
            count += len(chunk)
            if count > MAX_ARCHIVE_BYTES: raise RuntimeError('Source archive exceeds size limit')
            file.write(chunk)


def obtain(index):
    """只下载缺失的固定源码，超时仅停止本任务子进程；失败的 partial 保留供明确诊断，不会发布。"""
    target = OUTPUT / SOURCES[index]['file']
    if target.exists(): return target
    try:
        subprocess.run([sys.executable, str(Path(__file__).resolve()), '--_download-one', str(index)], check=True, timeout=TOTAL_TIMEOUT, capture_output=True, text=True)
    except subprocess.TimeoutExpired as error:
        raise RuntimeError('Source download hard total timeout: ' + target.name) from error
    except subprocess.CalledProcessError as error:
        raise RuntimeError('Source download failed without retry: ' + target.name + '\n' + error.stderr) from error
    part = OUTPUT / (target.name + '.partial')
    # 固定目标均位于本任务输出目录；不删除、移动或替换其他工作区文件。
    assert part.resolve().is_relative_to(OUTPUT.resolve()) and not target.exists()
    part.rename(target)
    return target


def inspect_archive(source, archive):
    """检查真实 tar、源码文件和原始许可；只抽取必要文本到内存，不全量解包或运行第三方代码。"""
    wanted = set(source['required'] + source['licenses'] + source['materials'])
    captured = {}
    files = set()
    unpacked = 0
    native_sources = 0
    with tarfile.open(archive, 'r:gz') as package:
        for item in package:
            parts = PurePosixPath(item.name).parts
            if not parts or item.name.startswith('/') or '..' in parts or '\\' in item.name: raise RuntimeError('Unsafe source archive member')
            relative = '/'.join(parts[1:])
            if not item.isfile(): continue
            unpacked += item.size
            if unpacked > MAX_UNPACKED_BYTES: raise RuntimeError('Source archive exceeds unpacked size limit')
            if relative in files: raise RuntimeError('Duplicate source archive path: ' + relative)
            files.add(relative)
            if relative.endswith(('.c', '.cc', '.cpp')): native_sources += 1
            if relative in wanted:
                if item.size > 8 * 1024 * 1024: raise RuntimeError('Source material exceeds read limit')
                captured[relative] = package.extractfile(item).read()
    missing = wanted - files
    if missing: raise RuntimeError(source['id'] + ' missing required source/license files: ' + str(sorted(missing)))
    if source['id'] != 'heic-to' and native_sources < 10: raise RuntimeError('Native preferred source is incomplete')
    if source['id'] == 'heic-to':
        wrapper = captured[WRAPPER['archive_path']]
        assert len(wrapper) == WRAPPER['bytes'] and hashlib.sha256(wrapper).hexdigest() == WRAPPER['sha256'], 'Default JS source correspondence mismatch'
        assert captured['src/lib/libheif.js'].startswith(b'// Build from libheif 1.23.6 with LIBDE265_VERSION=1.0.16')
    return captured, {'files': len(files), 'unpackedBytes': unpacked, 'nativeSourceFiles': native_sources, 'requiredSourceFiles': sorted(wanted)}


def load_frozen_lock():
    """正式收集只接受已提交的输入身份/实际 hash，不从下载结果静默更新锁。"""
    lock = json.loads(LOCK_PATH.read_text(encoding='utf-8'))
    assert lock['schema'] == 1 and len(lock['sources']) == len(SOURCES)
    for expected, entry in zip(SOURCES, lock['sources']):
        for field in ('id', 'version', 'repository', 'commit', 'url', 'file'):
            assert entry[field] == expected[field], 'Source identity mismatch: ' + field
        assert len(entry['sha256']) == 64 and all(c in '0123456789abcdef' for c in entry['sha256'])
        assert 0 < entry['bytes'] <= MAX_ARCHIVE_BYTES
    assert lock['defaultWrapper'] == WRAPPER
    return lock


def collect(initialize=False):
    """收集三份原包、原文许可和构建材料；初始化锁仅在首次显式授权且锁不存在时允许。"""
    if initialize and LOCK_PATH.exists(): raise RuntimeError('Refusing to overwrite an existing source lock')
    project_lock = json.loads((ROOT / 'package-lock.json').read_text(encoding='utf-8'))
    assert project_lock['packages']['node_modules/heic-to']['version'] == SOURCES[0]['version'], 'HEIC runtime dependency changed; corresponding-source lock requires review'
    frozen = None if initialize else load_frozen_lock()
    assert OUTPUT.resolve().is_relative_to(ROOT.resolve()), 'Source output escapes project'
    OUTPUT.mkdir(parents=True, exist_ok=True)
    records = []
    notices = ['HEIC original licensing texts and preferred-source inventory', 'These are original sources for heic-to 1.6.6, libheif 1.23.6 and libde265 1.0.16.', 'Default toolbox import: heic-to -> dist/heic-to.js (not the CSP variant).', 'Full source archives are alongside manifest.json; no runtime external download is added.', '']
    for index, source in enumerate(SOURCES):
        archive = obtain(index)
        actual = digest_file(archive)
        if frozen and actual != {key: frozen['sources'][index][key] for key in ('sha256', 'bytes')}: raise RuntimeError('Source hash/size mismatch; no retry: ' + archive.name)
        captured, inventory = inspect_archive(source, archive)
        record = {key: source[key] for key in ('id', 'version', 'repository', 'commit', 'url', 'file')}
        record.update(actual)
        record['inventory'] = inventory
        record['originalLicenses'] = []
        for name in source['licenses']:
            filename = source['id'] + '-' + name.replace('/', '-') + '.txt'
            output = OUTPUT / 'licenses' / filename
            output.parent.mkdir(exist_ok=True)
            output.write_bytes(captured[name])
            descriptor = {'archivePath': name, 'file': 'licenses/' + filename, **digest_file(output)}
            record['originalLicenses'].append(descriptor)
            if initialize: (ROOT / 'licenses' / 'heic' / filename).write_bytes(captured[name])
            notices += ['\n' + '=' * 72, source['id'] + '@' + source['version'] + ' ' + source['commit'], 'Original source archive path: ' + name, '=' * 72, captured[name].decode('utf-8')]
        for name in source['materials']:
            path = OUTPUT / 'build-materials' / (source['id'] + '-' + name.replace('/', '-'))
            path.parent.mkdir(exist_ok=True)
            path.write_bytes(captured[name])
        records.append(record)
    if initialize:
        local = ROOT / 'node_modules' / 'heic-to' / WRAPPER['archive_path']
        assert digest_file(local) == {key: WRAPPER[key] for key in ('sha256', 'bytes')}, 'Installed default HEIC artifact changed before source lock initialization'
        lock = {'schema': 1, 'defaultWrapper': WRAPPER, 'sources': records, 'boundary': 'Declared upstream source correspondence with fixed tags and original build materials; no claim of bit-for-bit reproduction or unknown publisher SDK identity.'}
        LOCK_PATH.write_text(json.dumps(lock, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    else: lock = frozen
    # 普通发布读取已安装包时也检查版本/字节；此检查可选，不把 node_modules 变成资料收集的隐含前置。
    local = ROOT / 'node_modules' / 'heic-to' / WRAPPER['archive_path']
    if local.exists() and digest_file(local) != {key: WRAPPER[key] for key in ('sha256', 'bytes')}: raise RuntimeError('Installed default HEIC artifact no longer matches the frozen source proof')
    (OUTPUT / 'manifest.json').write_text(json.dumps({'schema': 1, 'defaultWrapper': WRAPPER, 'sources': records, 'sourceLock': {'file': LOCK_PATH.name, **digest_file(LOCK_PATH)}, 'boundary': lock['boundary']}, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    (OUTPUT / 'HEIC-NOTICES.txt').write_text('\n'.join(notices), encoding='utf-8')
    (OUTPUT / 'BUILD-NOTES.md').write_bytes((ROOT / 'docs' / 'HEIC-SOURCE.md').read_bytes())
    print('HEIC_SOURCE_BUNDLE_READY:', OUTPUT)
    print('ARCHIVE_BYTES:', sum(record['bytes'] for record in records))


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--initialize-lock', action='store_true')
    parser.add_argument('--_download-one', type=int, choices=range(len(SOURCES)), help=argparse.SUPPRESS)
    args = parser.parse_args()
    if args._download_one is not None: io_worker(args._download_one)
    else: collect(args.initialize_lock)


if __name__ == '__main__': main()
