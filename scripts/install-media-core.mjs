import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const deadline = Date.now() + 8 * 60_000;
const names = [
  'core-receipt.json',
  'ffmpeg-core.js',
  'ffmpeg-core.wasm',
  'media-core-NOTICES.txt'
];
const transient = new Set([429, 500, 502, 503, 504]);
const digest = (bytes) => createHash('sha256').update(bytes).digest('hex');

/** 校验公开发行资产描述；下载目标不允许任意主机、认证信息或工作区外路径。 */
function asset(value, filename) {
  if (
    !value ||
    value.file !== filename ||
    !/^[a-f0-9]{64}$/.test(value.sha256) ||
    !Number.isSafeInteger(value.bytes) ||
    value.bytes <= 0 ||
    value.bytes > 128 * 1024 * 1024
  )
    throw new Error(`Invalid locked media asset: ${filename}`);
  const url = new URL(value.url);
  if (
    url.protocol !== 'https:' ||
    url.hostname !== 'github.com' ||
    url.username ||
    url.password ||
    !url.pathname.startsWith('/ixiaoyy/parallel-lines-tools/releases/download/')
  )
    throw new Error(`Invalid media release URL: ${filename}`);
  return value;
}

/** 创建本项目私有生成目录，拒绝符号链接，避免写到目录链以外的真实文件。 */
async function directory() {
  let current = root;
  for (const name of ['.media-core', 'runtime']) {
    current = path.join(current, name);
    try {
      const stat = await fs.lstat(current);
      if (!stat.isDirectory() || stat.isSymbolicLink())
        throw new Error('Media runtime directory must not be a symlink');
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
      await fs.mkdir(current);
    }
  }
  return current;
}

/** GET 资产有首响应15秒、响应空闲30秒及单次180秒上限；只重试一次可重试网络/HTTP错误。 */
async function download(info, target) {
  const temporary = `${target}.download-${process.pid}`;
  for (let attempt = 0; attempt < 2; attempt++) {
    if (Date.now() >= deadline)
      throw new Error('Media installation exceeded eight minutes');
    const controller = new AbortController();
    const total = setTimeout(
      () => controller.abort(new Error('Media total timeout')),
      Math.min(180000, deadline - Date.now())
    );
    let phase = setTimeout(
      () =>
        controller.abort(new Error('Media connection/response-header timeout')),
      15000
    );
    let file;
    try {
      const response = await fetch(info.url, {
        signal: controller.signal,
        redirect: 'follow'
      });
      clearTimeout(phase);
      if (!response.ok) {
        const error = new Error(`Media download HTTP ${response.status}`);
        error.retryable = transient.has(response.status);
        await response.body?.cancel();
        throw error;
      }
      file = await fs.open(temporary, 'wx');
      let count = 0;
      const hash = createHash('sha256');
      phase = setTimeout(
        () => controller.abort(new Error('Media response-body timeout')),
        30000
      );
      for await (const chunk of response.body) {
        clearTimeout(phase);
        count += chunk.length;
        if (count > info.bytes)
          throw new Error('Media asset exceeds locked size');
        hash.update(chunk);
        await file.writeFile(chunk);
        phase = setTimeout(
          () => controller.abort(new Error('Media response-body timeout')),
          30000
        );
      }
      if (count !== info.bytes || hash.digest('hex') !== info.sha256)
        throw new Error('Media asset integrity mismatch');
      await file.close();
      file = undefined;
      await fs.rename(temporary, target);
      return;
    } catch (error) {
      if (file) await file.close();
      await fs.unlink(temporary).catch((failure) => {
        if (failure.code !== 'ENOENT') throw failure;
      });
      const retryable =
        error.retryable ||
        [
          'ECONNRESET',
          'ETIMEDOUT',
          'UND_ERR_CONNECT_TIMEOUT',
          'UND_ERR_HEADERS_TIMEOUT',
          'UND_ERR_BODY_TIMEOUT'
        ].includes(error.cause?.code);
      if (!retryable || attempt === 1 || Date.now() + 3000 >= deadline)
        throw error;
      await new Promise((resolve) => setTimeout(resolve, 3000));
    } finally {
      clearTimeout(total);
      clearTimeout(phase);
    }
  }
}

/** 安装锁定的新自建核心，不以 npm/CDN 的旧二进制作为下载失败兜底。 */
async function install() {
  const lock = JSON.parse(
    await fs.readFile(path.join(root, 'media-core.lock.json'), 'utf8')
  );
  if (lock.schema !== 1 || typeof lock.version !== 'string')
    throw new Error('Invalid media-core.lock.json');
  const descriptors = names.map((name) => asset(lock.assets?.[name], name));
  const destination = await directory();
  for (const item of descriptors) {
    const target = path.join(destination, item.file);
    let cached = false;
    try {
      const stat = await fs.lstat(target);
      if (stat.isSymbolicLink() || !stat.isFile())
        throw new Error('Media cache asset must be a regular file');
      cached =
        stat.size === item.bytes &&
        digest(await fs.readFile(target)) === item.sha256;
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
    }
    if (!cached) await download(item, target);
  }
  const receipt = JSON.parse(
    await fs.readFile(path.join(destination, 'core-receipt.json'), 'utf8')
  );
  if (
    receipt.version !== lock.version ||
    receipt.validation?.status !== 'passed' ||
    receipt.source?.sha256 !== lock.source?.sha256 ||
    receipt.source?.url !== lock.source?.url
  )
    throw new Error('Media runtime does not match the verified source release');
  for (const role of ['js', 'wasm']) {
    const info = receipt.binaries?.[role];
    const expected = lock.assets?.[info?.file];
    if (
      !expected ||
      info.sha256 !== expected.sha256 ||
      info.bytes !== expected.bytes
    )
      throw new Error('Media binary receipt mismatch');
  }
  const notice = lock.assets['media-core-NOTICES.txt'];
  if (
    receipt.notices?.sha256 !== notice.sha256 ||
    receipt.notices?.bytes !== notice.bytes
  )
    throw new Error('Media notice receipt mismatch');
  console.log(
    JSON.stringify({
      mediaCore: lock.version,
      verifiedAssets: descriptors.length,
      source: receipt.source.url
    })
  );
}

const options = process.argv.slice(2);
if (options.length && (options.length !== 1 || options[0] !== '--if-locked'))
  throw new Error('Unsupported media installer arguments');
if (options[0] === '--if-locked') {
  let selected = true;
  try {
    await fs.access(path.join(root, 'media-core.lock.json'));
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
    selected = false;
  }
  // 核心自身的 CI 使用刚编译的显式目录；尚未选自建锁的旧本地版本保持原构建条件。
  if (process.env.TOOLBOX_MEDIA_CORE_DIR || !selected)
    console.log(
      'Media installer: explicit prepared core or bootstrap development build selected'
    );
  else await install();
} else await install();
