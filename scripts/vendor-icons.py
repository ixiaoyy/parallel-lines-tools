"""按固定上游提交选取源码中的图标；仅开发时联网，不在浏览器加载远程图标。"""
import concurrent.futures
import json
from pathlib import Path
import re
import urllib.request

COMMIT = '3eb33380c7dbc256d098ada3f5a5863ec4b145dc'
NON_ICON_PREFIXES = {'translation', 'image', 'converters', 'string', 'pdf', 'audio', 'video', 'list', 'csv', 'xml', 'json', 'time', 'number', 'blob', 'dtb', 'hh'}
sets = {}
for file in Path('src').rglob('*'):
    if file.suffix not in ('.ts', '.tsx') or '.test.' in file.name:
        continue
    for prefix, icon in re.findall(r'''['"]([a-z][a-z0-9-]*):([a-z0-9-]+)['"]''', file.read_text(encoding='utf-8')):
        if prefix not in NON_ICON_PREFIXES:
            sets.setdefault(prefix, set()).add(icon)


def fetch(item):
    """下载单个图标集，保留所需图标/别名及完整归属元数据；找不到即失败。"""
    prefix, names = item
    url = f'https://raw.githubusercontent.com/iconify/icon-sets/{COMMIT}/json/{prefix}.json'
    with urllib.request.urlopen(url, timeout=30) as response:
        data = json.load(response)
    icons, aliases = {}, {}

    def add(name):
        if name in data['icons']:
            icons[name] = data['icons'][name]
        elif name in data.get('aliases', {}):
            aliases[name] = data['aliases'][name]
            add(aliases[name]['parent'])
        else:
            raise ValueError(f'Missing icon: {prefix}:{name}')

    for name in sorted(names):
        add(name)
    info = data.get('info', {})
    if not info.get('license'):
        raise ValueError(f'Missing icon license: {prefix}')
    return ({'prefix': prefix, 'width': data.get('width', 16), 'height': data.get('height', 16), 'icons': icons, 'aliases': aliases},
            {'prefix': prefix, 'commit': COMMIT, 'source': url, 'info': info})


with concurrent.futures.ThreadPoolExecutor(max_workers=3) as pool:
    results = list(pool.map(fetch, sorted(sets.items())))
Path('src/assets/local-icons.json').write_text(json.dumps([r[0] for r in results], separators=(',', ':')), encoding='utf-8')
Path('src/assets/local-icon-licenses.json').write_text(json.dumps([r[1] for r in results], ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
print(f'Vendored {sum(len(r[0]["icons"]) for r in results)} icons from {len(results)} sets at {COMMIT}')
