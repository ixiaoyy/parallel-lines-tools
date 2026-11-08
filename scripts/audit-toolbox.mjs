import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

// 只解析源码，不执行工具模块；清单中的静态可达不代表浏览器功能已验收。
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const relative = (file) => path.relative(root, file).replaceAll('\\', '/');
const read = (file) => fs.readFileSync(file, 'utf8');
const walk = (dir) => fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
  const file = path.join(dir, entry.name);
  return entry.isDirectory() ? walk(file) : [file];
});
const resolve = (from, spec) => {
  const aliases = { '@tools/': 'src/tools/', '@components/': 'src/components/', '@utils/': 'src/utils/', '@assets/': 'src/assets/' };
  const alias = Object.keys(aliases).find((prefix) => spec.startsWith(prefix));
  const base = spec.startsWith('.') ? path.resolve(path.dirname(from), spec)
    : path.join(root, alias ? aliases[alias] + spec.slice(alias.length) : `src/${spec}`);
  return [base, `${base}.ts`, `${base}.tsx`, `${base}.js`, path.join(base, 'index.ts'), path.join(base, 'index.tsx')]
    .find((file) => fs.existsSync(file) && fs.statSync(file).isFile());
};
const cache = new Map();
function source(file) {
  if (!cache.has(file)) cache.set(file, ts.createSourceFile(file, read(file), ts.ScriptTarget.Latest, true));
  return cache.get(file);
}
/** 从一个源码文件收集静态 import/export 和字面量动态 import，不执行模块。 */
function imports(file) {
  const result = [];
  const visit = (node) => {
    if ((ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) && node.moduleSpecifier && ts.isStringLiteral(node.moduleSpecifier)) result.push(node.moduleSpecifier.text);
    if (ts.isCallExpression(node) && node.expression.kind === ts.SyntaxKind.ImportKeyword && ts.isStringLiteral(node.arguments[0])) result.push(node.arguments[0].text);
    ts.forEachChild(node, visit);
  };
  visit(source(file));
  return result;
}
/** 从入口遍历本地依赖；includeLazy=false 时只核注册图，返回文件及直接包依赖集合。 */
function graph(start, includeLazy = true) {
  const seen = new Set();
  const deps = new Set();
  const visit = (file) => {
    if (seen.has(file) || !/\.[jt]sx?$/.test(file)) return;
    seen.add(file);
    // 注册图只走 index/meta；依赖图另走懒加载页面和本地适配模块。
    for (const spec of imports(file)) {
      const target = resolve(file, spec);
      if (includeLazy && target && (relative(target) === 'src/tools/index.ts' || (target.endsWith('meta.ts') && target !== start))) continue;
      if (target && (includeLazy || /(?:index|meta)\.ts$/.test(target))) visit(target);
      else if (!target && !spec.startsWith('.')) deps.add(spec.startsWith('@') ? spec.split('/').slice(0, 2).join('/') : spec.split('/')[0]);
    }
  };
  visit(start);
  return { files: [...seen], dependencies: [...deps].sort() };
}
/** 展平语言 JSON；保留完整点路径，供同命名空间下的中英键比较。 */
function flatten(value, prefix = '') {
  return Object.fromEntries(Object.entries(value).flatMap(([key, item]) => {
    const full = prefix ? `${prefix}.${key}` : key;
    return typeof item === 'object' && item !== null ? Object.entries(flatten(item, full)) : [[full, item]];
  }));
}
/** 读取指定语言的全部命名空间，返回 namespace:key 到实际文本的映射。 */
function locale(lang) {
  return Object.assign({}, ...walk(path.join(root, 'public/locales', lang)).filter((f) => f.endsWith('.json')).map((file) => {
    const ns = path.basename(file, '.json');
    return Object.fromEntries(Object.entries(flatten(JSON.parse(read(file)))).map(([key, value]) => [`${ns}:${key}`, value]));
  }));
}
const en = locale('en');
const zh = locale('zh');
const registered = new Set(graph(path.join(root, 'src/tools/index.ts'), false).files);
const rows = [];
const metaFiles = walk(path.join(root, 'src/pages/tools')).filter((f) => /meta\.ts$/.test(f));
for (const file of metaFiles) {
  let category, route, name;
  const visit = (node) => {
    if (ts.isCallExpression(node) && node.expression.getText(source(file)) === 'defineTool') {
      if (ts.isStringLiteral(node.arguments[0])) category = node.arguments[0].text;
      const props = node.arguments[1];
      if (ts.isObjectLiteralExpression(props)) {
        for (const prop of props.properties) {
          if (!ts.isPropertyAssignment(prop)) continue;
          const key = prop.name.getText(source(file));
          if (key === 'path' && ts.isStringLiteral(prop.initializer)) route = prop.initializer.text;
          if (key === 'i18n' && ts.isObjectLiteralExpression(prop.initializer)) {
            for (const p of prop.initializer.properties) if (ts.isPropertyAssignment(p) && p.name.getText(source(file)) === 'name' && ts.isStringLiteral(p.initializer)) name = p.initializer.text;
          }
        }
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(source(file));
  // 上游通用计算器由 data/index 的真实导入表展开，不能误算成一个工具或跳过。
  if (relative(file) === 'src/pages/tools/number/generic-calc/meta.ts') {
    const dataIndex = path.join(path.dirname(file), 'data/index.ts');
    for (const spec of imports(dataIndex)) {
      const dataFile = resolve(dataIndex, spec);
      const text = read(dataFile);
      const calcPath = text.match(/path:\s*'([^']+)'/)?.[1];
      const calcName = text.match(/name:\s*'(number:[^']+)'/)?.[1];
      if (!calcPath || !calcName) throw new Error(`Cannot expand calculator: ${relative(dataFile)}`);
      const id = `number/generic-calc/${calcPath}`;
      rows.push({ id, category: 'number', route: `/${id}`, name: en[calcName] ?? calcName, chinese: zh[calcName] ?? null, registered: registered.has(file), source: relative(dataFile), dependencies: graph(file).dependencies, runtime: '未逐项验证' });
    }
    continue;
  }
  if (!category || !route || !name) throw new Error(`Cannot parse metadata: ${relative(file)}`);
  const dependencies = graph(file).dependencies;
  rows.push({ id: `${category}/${route}`, category, route: `/${category}/${route}`, name: en[name] ?? name, chinese: zh[name] ?? null, registered: registered.has(file), source: relative(file), dependencies, runtime: '未逐项验证' });
}
rows.sort((a, b) => a.id.localeCompare(b.id));
if (new Set(rows.map((r) => r.id)).size !== rows.length) throw new Error('Duplicate tool route');
const missing = Object.keys(en).filter((key) => typeof zh[key] !== 'string' || !zh[key].trim());
const unchanged = Object.keys(en).filter((key) => zh[key] === en[key]);
fs.writeFileSync(path.join(root, 'docs/tool-inventory.json'), JSON.stringify(rows, null, 2) + '\n');
fs.writeFileSync(path.join(root, 'docs/evidence/translation-coverage.json'), JSON.stringify({ englishKeys: Object.keys(en).length, chineseKeys: Object.keys(zh).length, missing, unchanged, note: '键存在不代表翻译正确；unchanged 可能是术语，也可能未翻译，需人工核对。' }, null, 2) + '\n');
const cell = (s) => String(s).replaceAll('|', '\\|').replaceAll('\n', ' ');
fs.writeFileSync(path.join(root, 'docs/tool-inventory.md'), `# 工具源码清单\n\n由 \`node scripts/audit-toolbox.mjs\` 生成；${metaFiles.length} 个 meta 文件展开为 ${rows.length} 个工具（含 5 个通用计算器），${rows.filter((r) => r.registered).length} 个注册图可达。ID 使用上游稳定路由，不另造一套编号。\n\n中文列只核名称键；正常与否均未逐工具实测，禁止将此表当作可用性承诺。依赖来自静态/动态 import 的本地源码图，剔除全局工具目录及其他工具 meta 的回路，不包括包的传递依赖。\n\n| ID / 路径 | 分类 | 英文名 | 中文名称 | 注册 | 关键依赖 | 状态 / 源文件 |\n|---|---|---|---|---|---|---|\n` + rows.map((r) => `| ${cell(r.route)} | ${r.category} | ${cell(r.name)} | ${cell(r.chinese ?? '缺失')} | ${r.registered ? '可达' : '未注册'} | ${r.dependencies.join(', ')} | ${r.runtime}；${r.source} |`).join('\n') + '\n');
console.log(JSON.stringify({ tools: rows.length, registered: rows.filter((r) => r.registered).length, missingChineseKeys: missing.length, unchangedKeys: unchanged.length }));
