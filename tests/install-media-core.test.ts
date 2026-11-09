// @vitest-environment node
import { afterEach, describe, expect, it } from 'vitest';
import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

const base = path.resolve('.deployment/installer-unit');
const sandboxes: string[] = [];
const sha = (bytes: Buffer) => createHash('sha256').update(bytes).digest('hex');

/** 仅生成非敏感小样本；网络被子进程入口 mock，不把这些字节当可执行媒体核心。 */
async function sandbox(status = 'passed', badHash = false, badUrl = false): Promise<string> {
  await fs.mkdir(base, { recursive: true });
  const root = await fs.mkdtemp(path.join(base, 'fixture-')); sandboxes.push(root);
  await fs.mkdir(path.join(root, 'scripts'));
  await fs.copyFile('scripts/install-media-core.mjs', path.join(root, 'scripts/install-media-core.mjs'));
  const prefix = 'https://github.com/ixiaoyy/parallel-lines-tools/releases/download/media-core-test/';
  const data: Record<string, Buffer> = { 'ffmpeg-core.js': Buffer.from('sample-js'), 'ffmpeg-core.wasm': Buffer.from('sample-not-real-wasm'), 'media-core-NOTICES.txt': Buffer.from('sample notices') };
  const item = (file: string) => ({ file, sha256: sha(data[file]), bytes: data[file].length, url: prefix + file });
  const source = { file: 'media-core-source.tar.gz', url: prefix + 'media-core-source.tar.gz', sha256: 'a'.repeat(64), bytes: 42 };
  data['core-receipt.json'] = Buffer.from(JSON.stringify({ version: 'media-core-test', validation: { status }, source, binaries: { js: item('ffmpeg-core.js'), wasm: item('ffmpeg-core.wasm') }, notices: item('media-core-NOTICES.txt') }));
  const assets = Object.fromEntries(Object.keys(data).map((name) => [name, item(name)]));
  if (badHash) assets['ffmpeg-core.wasm'].sha256 = 'b'.repeat(64);
  if (badUrl) assets['ffmpeg-core.js'].url = 'https://example.com/unapproved.js';
  await fs.writeFile(path.join(root, 'media-core.lock.json'), JSON.stringify({ schema: 1, version: 'media-core-test', source, assets }));
  await fs.writeFile(path.join(root, 'fixtures.json'), JSON.stringify(Object.fromEntries(Object.entries(data).map(([name, bytes]) => [name, bytes.toString('base64')]))));
  await fs.writeFile(path.join(root, 'mock.mjs'), `import fs from 'node:fs';\nconst bodies=JSON.parse(fs.readFileSync(new URL('./fixtures.json',import.meta.url),'utf8'));\nglobalThis.fetch=async(url)=>{ if(process.env.FAIL_ON_FETCH==='1')throw new Error('Unexpected fetch for cached asset'); const name=new URL(url).pathname.split('/').pop();return new Response(Buffer.from(bodies[name],'base64'),{status:200}); };\n`);
  return root;
}

function run(root: string, cached = false, options: string[] = [], prepared = false) {
  return spawnSync(process.execPath, ['--import', pathToFileURL(path.join(root, 'mock.mjs')).href, path.join(root, 'scripts/install-media-core.mjs'), ...options], { cwd: root, env: { ...process.env, FAIL_ON_FETCH: cached ? '1' : '0', ...(prepared ? { TOOLBOX_MEDIA_CORE_DIR: 'prepared-core' } : {}) }, encoding: 'utf8', timeout: 20000 });
}

afterEach(async () => {
  for (const directory of sandboxes.splice(0)) {
    // 只清理由本测试在固定诊断父目录排他创建的目录，不跟随工作区外路径。
    if (!path.resolve(directory).startsWith(base + path.sep)) throw new Error('Unsafe test cleanup path');
    await fs.rm(directory, { recursive: true, force: true });
  }
});

describe('locked media installation', () => {
  it('optional prebuild preserves bootstrap builds without a selected core lock', async () => {
    const root = await sandbox(); await fs.unlink(path.join(root, 'media-core.lock.json'));
    const result = run(root, true, ['--if-locked']); expect(result.status, result.stderr).toBe(0);
    await expect(fs.stat(path.join(root, '.media-core'))).rejects.toMatchObject({ code: 'ENOENT' });
  });
  it('optional prebuild does not replace an explicitly prepared new-core QA input', async () => {
    const result = run(await sandbox('awaiting-real-browser-verification'), true, ['--if-locked'], true);
    expect(result.status, result.stderr).toBe(0);
  });
  it('verifies all assets and reuses a correct cache without downloading again', async () => {
    const root = await sandbox(); const first = run(root);
    expect(first.status, first.stderr).toBe(0); expect(JSON.parse(first.stdout).verifiedAssets).toBe(4);
    expect(run(root, true).status).toBe(0);
  });
  it('rejects hash mismatches without installing a corrupt binary or using the npm core', async () => {
    const root = await sandbox('passed', true); const result = run(root);
    expect(result.status).not.toBe(0); expect(result.stderr).toContain('integrity mismatch');
    await expect(fs.stat(path.join(root, '.media-core/runtime/ffmpeg-core.wasm'))).rejects.toMatchObject({ code: 'ENOENT' });
  });
  it('retries a transient 504 once and still verifies the same locked bytes', async () => {
    const root = await sandbox();
    await fs.appendFile(
      path.join(root, 'mock.mjs'),
      `const successful=globalThis.fetch; const calls=[]; globalThis.fetch=async(url)=>{ calls.push(new URL(url).pathname.split('/').pop()); if(calls.length===1)return new Response('temporary',{status:504}); return successful(url); }; process.on('exit',()=>fs.writeFileSync(new URL('./calls.json',import.meta.url),JSON.stringify(calls)));\n`
    );
    const result = run(root);
    expect(result.status, result.stderr).toBe(0);
    expect(JSON.parse(result.stdout).verifiedAssets).toBe(4);
    expect(result.stderr).toContain('core-receipt.json');
    expect(
      JSON.parse(await fs.readFile(path.join(root, 'calls.json'), 'utf8'))
    ).toEqual([
      'core-receipt.json',
      'core-receipt.json',
      'ffmpeg-core.js',
      'ffmpeg-core.wasm',
      'media-core-NOTICES.txt'
    ]);
  }, 15000);
  it('rejects a core not verified by the real browser job', async () => {
    const result = run(await sandbox('awaiting-real-browser-verification'));
    expect(result.status).not.toBe(0); expect(result.stderr).toContain('verified source release');
  });
  it('rejects an unapproved asset host before any download', async () => {
    const result = run(await sandbox('passed', false, true), true);
    expect(result.status).not.toBe(0); expect(result.stderr).toContain('Invalid media release URL');
  });
});
