import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import JSZip from 'jszip';

const root = fileURLToPath(new URL('../', import.meta.url));
const destination = path.join(root, 'dist/toolbox-source-local-20261109.zip');
const MAX_FILES = 10_000;
const MAX_SOURCE_BYTES = 150 * 1024 * 1024;
const rootFiles = [
  'package.json',
  'package-lock.json',
  'upstream-base.json',
  'core-build.lock.json',
  'media-core.lock.json',
  'index.html',
  'vite.config.ts',
  'tsconfig.json',
  'tailwind.config.mjs',
  'postcss.config.mjs',
  'Dockerfile',
  '.dockerignore',
  '.gitignore',
  '.env.example',
  '.eslintrc',
  '.prettierrc',
  '.editorconfig',
  'playwright.config.ts',
  'commitlint.config.js',
  'LICENSE',
  'README.md',
  'NOTICE.md'
];
const buildScripts = new Set([
  'scripts/package-source.mjs',
  'scripts/release-policy.ts',
  'scripts/media-core-info.ts',
  'scripts/install-media-core.mjs',
  'scripts/vendor-icons.py',
  'scripts/create-tool.mjs'
]);
const deliveryDocs = new Set([
  'docs/SOURCE-DELIVERY.md',
  'docs/DEPLOYMENT.md',
  'docs/ffmpeg-source-obligations.md'
]);
const required = [
  'package.json',
  'package-lock.json',
  'upstream-base.json',
  'index.html',
  'vite.config.ts',
  'tsconfig.json',
  'src/index.tsx',
  '@types/i18n.d.ts',
  '.vitest/setup.ts',
  'scripts/release-policy.ts',
  'scripts/media-core-info.ts',
  'scripts/package-source.mjs',
  'deploy/nginx/default.conf',
  'licenses/icons/manifest.json',
  'LICENSE',
  'NOTICE.md',
  'docs/SOURCE-DELIVERY.md',
  'docs/ffmpeg-source-obligations.md'
];

/** 读发行延期表，返回应排除的整个工具目录；元信息不能把路径引出 src/pages/tools。 */
async function excludedDirectories() {
  const deferred = JSON.parse(
    await fs.readFile(path.join(root, 'src/config/deferred-tools.json'), 'utf8')
  );
  if (!Array.isArray(deferred)) throw new Error('Invalid deferred-tools.json');
  return [
    'src/lib/ghostscript',
    ...deferred.map((tool) => {
      if (
        typeof tool.meta !== 'string' ||
        !/^src\/pages\/tools\/[a-z0-9/-]+\/meta\.ts$/.test(tool.meta)
      )
        throw new Error('Invalid deferred tool source path');
      return path.posix.dirname(tool.meta);
    })
  ];
}

/** 以实际静态发行资源白名单选择 public 文件，避免把旧引擎占位、字体或品牌副本交付。 */
function publishablePublic(file) {
  return (
    /^public\/locales\/[^/]+\/[^/]+\.json$/.test(file) ||
    [
      'public/toolbox.svg',
      'public/robots.txt',
      'public/assets/background.svg',
      'public/assets/background-dark.png'
    ].includes(file)
  );
}

/** 按工作区的授权范围收集可重建源码；不跟随符号链接，不收集运行数据或诊断产物。 */
async function collect(excluded) {
  const files = [];
  let bytes = 0;
  const add = async (relative) => {
    const absolute = path.join(root, ...relative.split('/'));
    const stat = await fs.lstat(absolute);
    if (stat.isSymbolicLink())
      throw new Error(`Source symlinks are not packaged: ${relative}`);
    if (!stat.isFile()) throw new Error(`Expected source file: ${relative}`);
    bytes += stat.size;
    if (files.length >= MAX_FILES || bytes > MAX_SOURCE_BYTES)
      throw new Error('Source package exceeds its 10,000 file / 150 MiB limit');
    files.push({ path: relative, bytes: stat.size, modified: stat.mtimeMs });
  };
  const walk = async (relative) => {
    if (
      excluded.some(
        (directory) =>
          relative === directory || relative.startsWith(`${directory}/`)
      )
    )
      return;
    if (
      relative
        .split('/')
        .some((part) =>
          [
            '.git',
            'node_modules',
            'fixtures',
            'test-results',
            'playwright-report',
            'coverage'
          ].includes(part)
        )
    )
      return;
    for (const entry of (
      await fs.readdir(path.join(root, ...relative.split('/')), {
        withFileTypes: true
      })
    ).sort((a, b) => a.name.localeCompare(b.name))) {
      const name = `${relative}/${entry.name}`;
      // scripts/docs 中的历史诊断报告可能包含本机路径，只收录精确白名单，不递归兜底。
      if (relative === 'scripts' && !buildScripts.has(name)) continue;
      if (relative === 'docs' && !deliveryDocs.has(name)) continue;
      if (entry.isSymbolicLink())
        throw new Error(`Source symlinks are not packaged: ${name}`);
      if (entry.isDirectory()) await walk(name);
      else if (entry.isFile()) {
        if (
          /\.(log|tmp|zip|pdf|docx)$/i.test(entry.name) ||
          (entry.name.startsWith('.env') && entry.name !== '.env.example')
        )
          continue;
        if (name.startsWith('scripts/') && !buildScripts.has(name)) continue;
        if (name.startsWith('public/') && !publishablePublic(name)) continue;
        if (name.startsWith('docs/') && !deliveryDocs.has(name)) continue;
        await add(name);
      }
    }
  };
  for (const name of rootFiles) {
    try {
      await add(name);
    } catch (error) {
      if (error.code === 'ENOENT' && !required.includes(name)) continue;
      throw error;
    }
  }
  for (const directory of [
    'src',
    '@types',
    '.vitest',
    'public',
    'licenses',
    'deploy',
    'scripts',
    'docs'
  ])
    await walk(directory);
  return files.sort((a, b) => a.path.localeCompare(b.path));
}

/** 核对许可清单覆盖的实际图标，避免重新选取图标后沿用过期的归属快照。 */
async function verifyIconNotices() {
  const manifest = JSON.parse(
    await fs.readFile(path.join(root, 'licenses/icons/manifest.json'), 'utf8')
  );
  const icons = JSON.parse(
    await fs.readFile(path.join(root, 'src/assets/local-icons.json'), 'utf8')
  );
  if (manifest.collections.length !== icons.length)
    throw new Error('Icon collections changed; refresh icon notices first.');
  for (const collection of icons) {
    const notice = manifest.collections.find(
      (item) => item.prefix === collection.prefix
    );
    const expected = [
      ...new Set([
        ...Object.keys(collection.icons),
        ...Object.keys(collection.aliases ?? {})
      ])
    ].sort();
    if (!notice || JSON.stringify(expected) !== JSON.stringify(notice.icons))
      throw new Error(
        `Icon selection changed without matching attribution: ${collection.prefix}`
      );
    if (
      !notice.author?.name ||
      !notice.license?.spdx ||
      !/^[a-f0-9]{40}$/.test(notice.iconifyCommit)
    )
      throw new Error(`Incomplete icon provenance: ${collection.prefix}`);
    for (const source of [notice.standard, notice.original].filter(Boolean)) {
      if (
        !/^[a-zA-Z0-9._-]+\.txt$/.test(source.file) ||
        !/^[a-f0-9]{40}$/.test(source.commit)
      )
        throw new Error(
          `Invalid icon license path/revision: ${collection.prefix}`
        );
      if (
        !(
          await fs.readFile(
            path.join(root, 'licenses/icons', source.file),
            'utf8'
          )
        ).trim()
      )
        throw new Error(`Empty icon license: ${collection.prefix}`);
    }
  }
}

/** 生成当前修改版的可重建工具箱源码包；该 ZIP 不声称包含 FFmpeg/codec 完整对应源码。 */
async function packageSource() {
  await verifyIconNotices();
  const excluded = await excludedDirectories();
  const files = await collect(excluded);
  const names = new Set(files.map((file) => file.path));
  for (const name of required)
    if (!names.has(name))
      throw new Error(`Missing build/source delivery file: ${name}`);
  const zip = new JSZip();
  for (const file of files)
    zip.file(
      file.path,
      await fs.readFile(path.join(root, ...file.path.split('/'))),
      { date: new Date(file.modified) }
    );
  // 读取过程中若有协作者变更源码，明确停止，不能把不同输入状态混成一个发行快照。
  const after = await collect(excluded);
  if (JSON.stringify(files) !== JSON.stringify(after))
    throw new Error('Source changed during packaging; finish edits and retry.');
  const manifest = {
    kind: 'modified-toolbox-application-source',
    generatedAt: new Date().toISOString(),
    upstream: JSON.parse(
      await fs.readFile(path.join(root, 'upstream-base.json'), 'utf8')
    ),
    includedFileCount: files.length,
    includedBytes: files.reduce((total, file) => total + file.bytes, 0),
    excludedDirectories: excluded,
    engineSourceBoundary:
      'This archive does not contain complete corresponding source for the FFmpeg/codec binary. See docs/ffmpeg-source-obligations.md before public distribution.',
    files: files.map(({ path: file, bytes }) => ({ path: file, bytes }))
  };
  zip.file('SOURCE-MANIFEST.json', JSON.stringify(manifest, null, 2) + '\n');
  const buffer = await zip.generateAsync({
    type: 'nodebuffer',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 }
  });
  await fs.mkdir(path.dirname(destination), { recursive: true });
  await fs.writeFile(`${destination}.tmp`, buffer);
  await fs.rename(`${destination}.tmp`, destination);
  console.log(
    JSON.stringify(
      {
        archive: destination,
        files: files.length + 1,
        archiveBytes: buffer.length,
        sourceBytes: manifest.includedBytes,
        excludedDirectories: excluded
      },
      null,
      2
    )
  );
}

await packageSource();
