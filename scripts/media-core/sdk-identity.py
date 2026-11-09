#!/usr/bin/env python3
"""在固定 SDK 容器内进行低成本身份预检；只输出编译器身份，不读取或打印环境变量。"""
import argparse
import json
from pathlib import Path
import re
import subprocess
import sys


def official_version(raw):
    """按 Emscripten 3.1.40 tools/shared.py 的 set_version_globals 正规解析（文件可能带双引号）。"""
    version = raw.strip().strip('"')
    parts = [int(x) for x in version.split('-')[0].split('.')]
    if len(parts) != 3: raise ValueError('Invalid Emscripten semantic version')
    return version, parts


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--lock', type=Path, default=Path('/input-lock.json'))
    args = parser.parse_args()
    lock = json.loads(args.lock.read_text(encoding='utf-8'))
    root = Path('/emsdk/upstream/emscripten')
    raw = (root / 'emscripten-version.txt').read_text(encoding='utf-8')
    compiler = subprocess.run(['emcc', '--version'], capture_output=True, text=True, timeout=30)
    record = {'schema': 1, 'sdk_image': lock['sdk']['image'], 'version_file_repr': repr(raw), 'version_file_raw': raw, 'emcc_version': compiler.stdout, 'emcc_returncode': compiler.returncode, 'parser': 'Emscripten 3.1.40 tools/shared.py:set_version_globals', 'validated': False}
    try:
        version, parts = official_version(raw)
        record['parsed_version'] = version
        record['semantic_version'] = '.'.join(str(x) for x in parts)
        expected = lock['sdk']['version']
        first_line = compiler.stdout.splitlines()[0] if compiler.stdout else ''
        if parts != [int(x) for x in expected.split('.')]: raise ValueError('SDK semantic version does not match pinned input')
        if compiler.returncode != 0 or not re.search(r'\b' + re.escape(expected) + r'\b', first_line): raise ValueError('Compiler version does not match pinned SDK')
        record['validated'] = True
    finally:
        # 即使预检不通过，也先留下实际 repr/编译器原文；绝不等到长构建末尾才猜版本字符串。
        print(json.dumps(record, indent=2))
    if not record['validated']: raise RuntimeError('SDK identity verification failed')


if __name__ == '__main__': main()
