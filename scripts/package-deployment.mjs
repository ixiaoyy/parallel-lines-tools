import fs from 'node:fs/promises';
import { createReadStream } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createHash } from 'node:crypto';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const run = promisify(execFile);
const repositoryRoot = fileURLToPath(new URL('../', import.meta.url));
const BUNDLE_NAME = 'toolbox-dist.tar.gz';
const EXPECTED_TITLE = '平行线工具箱';
const MAX_FILES = 10_000;
const MAX_BYTES = 512 * 1024 * 1024;
const DEPLOY_FILES = [
  'deploy/Dockerfile.prebuilt',
  'deploy/Dockerfile.prebuilt.dockerignore',
  'deploy/nginx/default.conf',
  'deploy/compose.yaml'
];
const REQUIRED_DIST = [
  'dist/index.html',
  'dist/THIRD_PARTY_NOTICES.txt',
  'dist/release-components.json',
  'dist/media-core-receipt.json'
];

/** 将正式打包的显式参数收敛为固定公开回执；不从 Git、Dockerfile 或 latest 猜版本。 */
export function validateDeploymentInputs(applicationRevision, nginxImage) {
  if (!/^[a-f0-9]{40}$/.test(applicationRevision ?? ''))
    throw new Error(
      'APPLICATION_REVISION must be an explicit 40-character lowercase Git SHA.'
    );
  if (
    !/^(?:docker\.io\/library\/)?nginx@sha256:[a-f0-9]{64}$/.test(
      nginxImage ?? ''
    )
  )
    throw new Error(
      'NGINX_IMAGE must be an explicit official nginx@sha256 digest, not a mutable tag.'
    );
}

/** 检查当前构建采用的媒体核心及已通过的验证回执，拒绝开发用默认核心进入正式发布包。 */
function validatedCore(receipt) {
  if (receipt?.validation?.status !== 'passed')
    throw new Error(
      'dist/media-core-receipt.json validation.status must be passed.'
    );
  if (
    typeof receipt.version !== 'string' ||
    !receipt.version.trim() ||
    receipt.version.length > 128 ||
    /[\p{Cc}]/u.test(receipt.version)
  )
    throw new Error('Media core version is missing or invalid.');
  let source;
  try {
    source = new URL(receipt.source?.url);
  } catch {
    throw new Error('Media core source URL is missing or invalid.');
  }
  if (
    source.protocol !== 'https:' ||
    source.hostname !== 'github.com' ||
    source.username ||
    source.password ||
    source.search ||
    source.hash ||
    !/^\/[\w.-]+\/[\w.-]+\/releases\/download\/[^/]+\/[^/]+$/.test(
      source.pathname
    )
  )
    throw new Error(
      'Media core source must use a public HTTPS GitHub release URL without credentials or query parameters.'
    );
  return { coreVersion: receipt.version, coreSourceURL: source.href };
}

/** 仅允许相对、无控制字符的归档路径；发现敏感或诊断文件时失败，不悄悄忽略污染的 dist。 */
function validateRelativePath(relative) {
  const segments = relative.split('/');
  if (
    !relative ||
    relative.includes('\\') ||
    relative.includes(':') ||
    relative.startsWith('/') ||
    /[\p{Cc}]/u.test(relative) ||
    segments.some((part) => !part || part === '.' || part === '..')
  )
    throw new Error(
      `Unsafe deployment archive path: ${JSON.stringify(relative)}`
    );
  // 应用源码 ZIP 已退役；旧构建残留必须显式失败，不能再次随站点静态包分发。
  if (/^toolbox-source.*\.zip$/i.test(segments.at(-1)))
    throw new Error(`Retired application source ZIP is not publishable: ${relative}`);
  if (
    segments.some(
      (part) =>
        /^\.env(?:\.|$)/i.test(part) ||
        [
          '.git',
          'node_modules',
          'fixtures',
          'test-results',
          'playwright-report',
          'coverage',
          'evidence',
          '.DS_Store'
        ].includes(part)
    ) ||
    /\.(?:log|tmp|pem|key|pfx|p12)$/i.test(relative) ||
    segments.some((part) =>
      /^(?:id_rsa|id_ed25519|credentials|secrets)$/i.test(part)
    )
  )
    throw new Error(
      `Sensitive or diagnostic file is not publishable: ${relative}`
    );
  if (!relative.startsWith('dist/') && !DEPLOY_FILES.includes(relative))
    throw new Error(
      `File is outside the static delivery allowlist: ${relative}`
    );
}

/** 收集 dist 与精确部署白名单；拒绝符号链接及超量输入，所有文件名供系统 tar 直接读取。 */
async function collectFiles(root) {
  const files = [];
  let totalBytes = 0;
  const realRoot = await fs.realpath(root);
  const add = async (relative) => {
    validateRelativePath(relative);
    const absolute = path.join(root, ...relative.split('/'));
    const stat = await fs.lstat(absolute);
    if (stat.isSymbolicLink() || !stat.isFile())
      throw new Error(`Expected a regular deployment file: ${relative}`);
    if (
      (await fs.realpath(absolute)) !==
      path.join(realRoot, ...relative.split('/'))
    )
      throw new Error(
        `Deployment files cannot traverse a symlinked directory: ${relative}`
      );
    totalBytes += stat.size;
    if (files.length >= MAX_FILES || totalBytes > MAX_BYTES)
      throw new Error('Deployment inputs exceed 10,000 files or 512 MiB.');
    files.push({ path: relative, bytes: stat.size, modified: stat.mtimeMs });
  };
  const walk = async (relative) => {
    const directory = path.join(root, ...relative.split('/'));
    const stat = await fs.lstat(directory);
    if (stat.isSymbolicLink() || !stat.isDirectory())
      throw new Error(`Expected a regular deployment directory: ${relative}`);
    for (const entry of (
      await fs.readdir(directory, { withFileTypes: true })
    ).sort((a, b) => a.name.localeCompare(b.name))) {
      const child = `${relative}/${entry.name}`;
      validateRelativePath(child);
      if (entry.isSymbolicLink())
        throw new Error(`Deployment symlinks are not allowed: ${child}`);
      if (entry.isDirectory()) await walk(child);
      else if (entry.isFile()) await add(child);
      else throw new Error(`Unsupported deployment filesystem entry: ${child}`);
    }
  };
  await walk('dist');
  for (const file of DEPLOY_FILES) await add(file);
  files.sort((a, b) => a.path.localeCompare(b.path));
  for (const required of [...REQUIRED_DIST, ...DEPLOY_FILES]) {
    const found = files.find((file) => file.path === required);
    if (!found || !found.bytes)
      throw new Error(`Missing or empty deployment file: ${required}`);
  }
  if (
    !files.some(
      (file) => /^dist\/assets\/.+\.(?:js|mjs)$/.test(file.path) && file.bytes
    ) ||
    !files.some(
      (file) => /^dist\/assets\/.+\.wasm$/.test(file.path) && file.bytes
    )
  )
    throw new Error(
      'The built dist must include non-empty local JavaScript and WASM assets.'
    );
  return files;
}

/** 对最终压缩包流式计算发布下载的完整性值，不把大型二进制整份读入内存。 */
async function digest(file) {
  const hash = createHash('sha256');
  for await (const chunk of createReadStream(file)) hash.update(chunk);
  return hash.digest('hex');
}

/** 选用系统 tar，不借助 npm 包、shell 拼接、Docker daemon 或远程执行。 */
function systemTar() {
  if (process.platform !== 'win32') return '/usr/bin/tar';
  if (!process.env.SystemRoot)
    throw new Error('SystemRoot is missing; system tar.exe cannot be located.');
  return path.join(process.env.SystemRoot, 'System32', 'tar.exe');
}

/**
 * 封装已构建、媒体验证通过的静态交付包，并生成固定 GitHub release URL 的回执。
 * root 仅供隔离 fixture 调用；CLI 始终使用本脚本所在仓库，不接受任意输入/输出目录。
 */
export async function packageDeployment({
  root = repositoryRoot,
  applicationRevision,
  nginxImage
}) {
  validateDeploymentInputs(applicationRevision, nginxImage);
  root = path.resolve(root);
  const files = await collectFiles(root);
  const core = validatedCore(
    JSON.parse(
      await fs.readFile(path.join(root, 'dist/media-core-receipt.json'), 'utf8')
    )
  );
  const title = await fs.readFile(path.join(root, 'dist/index.html'), 'utf8');
  if (!/<title>\s*平行线工具箱\s*<\/title>/u.test(title))
    throw new Error(
      'dist/index.html does not have the expected application title.'
    );
  const components = JSON.parse(
    await fs.readFile(path.join(root, 'dist/release-components.json'), 'utf8')
  );
  if (
    !Array.isArray(components) ||
    !components.some(
      (item) =>
        item?.name === '@parallellines/media-core' &&
        item.version === core.coreVersion
    )
  )
    throw new Error(
      'release-components.json does not record the validated media core version.'
    );

  const output = path.join(root, '.deployment');
  await fs.mkdir(output, { recursive: true });
  const outputStat = await fs.lstat(output);
  if (outputStat.isSymbolicLink() || !outputStat.isDirectory())
    throw new Error(
      '.deployment must be a regular directory inside the repository.'
    );
  const lockPath = path.join(output, '.package.lock');
  const lock = await fs.open(lockPath, 'wx').catch((error) => {
    if (error.code === 'EEXIST')
      throw new Error(
        'Deployment packaging is already locked. Check the previous process before removing a stale lock.'
      );
    throw error;
  });
  const listPath = path.join(output, `.bundle-files-${process.pid}.txt`);
  const archivePath = path.join(output, BUNDLE_NAME);
  const temporaryArchive = `${archivePath}.${process.pid}.tmp`;
  const temporaryReceipt = path.join(output, `.receipt-${process.pid}.tmp`);
  try {
    await lock.writeFile(`${process.pid}\n`, 'utf8');
    await fs.writeFile(
      listPath,
      files.map((file) => file.path).join('\n') + '\n',
      'utf8'
    );
    const tar = systemTar();
    const version = await run(tar, ['--version'], {
      timeout: 5000,
      maxBuffer: 1024 * 1024
    });
    let ownership;
    if (/bsdtar/i.test(version.stdout))
      ownership = [
        '--uid',
        '0',
        '--gid',
        '0',
        '--uname',
        'root',
        '--gname',
        'root'
      ];
    else if (/GNU tar/i.test(version.stdout))
      ownership = ['--owner=0', '--group=0', '--numeric-owner'];
    else throw new Error('The system packager must be GNU tar or bsdtar.');
    await run(
      tar,
      [
        '--format',
        'pax',
        ...ownership,
        '-czf',
        temporaryArchive,
        '--no-recursion',
        '-T',
        listPath
      ],
      { cwd: root, timeout: 180_000, maxBuffer: 4 * 1024 * 1024 }
    );
    const after = await collectFiles(root);
    if (JSON.stringify(after) !== JSON.stringify(files))
      throw new Error(
        'Deployment inputs changed during packaging; finish the build and retry.'
      );
    const archiveStat = await fs.stat(temporaryArchive);
    if (!archiveStat.size || archiveStat.size > MAX_BYTES)
      throw new Error('Deployment archive is empty or exceeds 512 MiB.');
    const receipt = {
      schema: 1,
      applicationRevision,
      ...core,
      nginxImage,
      bundle: {
        file: BUNDLE_NAME,
        url: `https://github.com/ixiaoyy/parallel-lines-tools/releases/download/site-${applicationRevision}/${BUNDLE_NAME}`,
        sha256: await digest(temporaryArchive),
        bytes: archiveStat.size
      },
      expectedTitle: EXPECTED_TITLE
    };
    await fs.writeFile(
      temporaryReceipt,
      JSON.stringify(receipt, null, 2) + '\n',
      'utf8'
    );
    await fs.rename(temporaryArchive, archivePath);
    await fs.rename(
      temporaryReceipt,
      path.join(output, 'deployment-receipt.json')
    );
    return receipt;
  } finally {
    await lock.close();
    // 只清理本次确切生成的临时文件；不递归删除输出目录或旧的有效发行包。
    for (const file of [
      listPath,
      temporaryArchive,
      temporaryReceipt,
      lockPath
    ]) {
      await fs.unlink(file).catch((error) => {
        if (error.code !== 'ENOENT') throw error;
      });
    }
  }
}

/** 读取显式 CLI 或同名环境变量；未知参数和缺失参数值必须失败。 */
function cliOptions(args, environment) {
  const options = {
    applicationRevision: environment.APPLICATION_REVISION,
    nginxImage: environment.NGINX_IMAGE
  };
  for (let index = 0; index < args.length; index += 2) {
    let key;
    if (args[index] === '--application-revision') key = 'applicationRevision';
    else if (args[index] === '--nginx-image') key = 'nginxImage';
    else throw new Error(`Unknown deployment packaging option: ${args[index]}`);
    if (!args[index + 1] || args[index + 1].startsWith('--'))
      throw new Error(`Missing value for ${args[index]}`);
    options[key] = args[index + 1];
  }
  return options;
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href
) {
  try {
    const receipt = await packageDeployment(
      cliOptions(process.argv.slice(2), process.env)
    );
    console.log(JSON.stringify(receipt, null, 2));
  } catch (error) {
    console.error(`Deployment packaging failed: ${error.message}`);
    process.exitCode = 1;
  }
}
