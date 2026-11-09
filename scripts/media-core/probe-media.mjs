import { createServer } from 'node:http';
import { createReadStream } from 'node:fs';
import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { chromium } from 'playwright';

// 只提供本次核心与既有 FFmpeg 浏览器包装；临时环回服务器不进入站点或发布目录。
const root = process.cwd();
const options = process.argv.slice(2);
if (options.length && (options.length !== 1 || !['--diagnostic-npm', '--diagnostic-npm-hevc'].includes(options[0]))) throw new Error('Unknown media probe option');
const diagnostic = options.length === 1;
const hevcDiagnostic = options[0] === '--diagnostic-npm-hevc';
const base = path.join(root, '.media-core', ...(diagnostic ? [hevcDiagnostic ? 'diagnostic-npm-hevc' : 'diagnostic-npm-ui'] : []));
const runtime = path.join(base, 'runtime');
if (diagnostic) {
  // 独立诊断目录只放现有 npm core，不覆盖或冒充自建核心；该结果不得用于发布验收。
  await fs.mkdir(runtime, { recursive: true });
  await fs.mkdir(path.join(base, 'release'), { recursive: true });
  const binaries = {};
  for (const [role, file] of [['js', 'ffmpeg-core.js'], ['wasm', 'ffmpeg-core.wasm']]) {
    const bytes = await fs.readFile(path.join(root, 'node_modules/@ffmpeg/core/dist/esm', file));
    await fs.writeFile(path.join(runtime, file), bytes);
    binaries[role] = { file, bytes: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex') };
  }
  await fs.writeFile(path.join(runtime, 'core-receipt.json'), JSON.stringify({ version: 'diagnostic-npm-core', diagnostic: true, binaries }));
}
const receipt = JSON.parse(await fs.readFile(path.join(runtime, 'core-receipt.json'), 'utf8'));
for (const info of Object.values(receipt.binaries)) {
  const data = await fs.readFile(path.join(runtime, info.file));
  if (data.length !== info.bytes || createHash('sha256').update(data).digest('hex') !== info.sha256) throw new Error('Probe core does not match the binary receipt');
}
const wrapper = path.join(root, 'node_modules/@ffmpeg/ffmpeg/dist/esm');
const server = createServer(async (request, response) => {
  const url = new URL(request.url || '/', 'http://127.0.0.1');
  if (url.pathname === '/') { response.setHeader('Content-Type', 'text/html'); response.end('<!doctype html><meta charset="utf-8"><title>Local media core probe</title>'); return; }
  if (url.pathname === '/favicon.ico') { response.statusCode = 204; response.end(); return; }
  let file;
  if (url.pathname.startsWith('/ffmpeg/')) {
    const name = url.pathname.slice('/ffmpeg/'.length);
    if (!/^[a-zA-Z0-9_.-]+\.js$/.test(name)) { response.statusCode = 404; response.end(); return; }
    file = path.join(wrapper, name);
  } else if (['/core/ffmpeg-core.js', '/core/ffmpeg-core.wasm'].includes(url.pathname)) file = path.join(runtime, path.basename(url.pathname));
  else { response.statusCode = 404; response.end(); return; }
  try {
    const stat = await fs.stat(file);
    response.setHeader('Content-Type', file.endsWith('.wasm') ? 'application/wasm' : 'text/javascript');
    response.setHeader('Content-Length', stat.size);
    createReadStream(file).pipe(response);
  } catch { response.statusCode = 404; response.end(); }
});
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const address = server.address();
if (!address || typeof address === 'string') throw new Error('Probe server has no loopback address');
const origin = `http://127.0.0.1:${address.port}`;
let browser;
let timer;
try {
  console.log('[media-probe] start ' + JSON.stringify({ diagnostic, runtime }));
  browser = await chromium.launch({ headless: true, ...(diagnostic ? { channel: 'chrome' } : {}) });
  const page = await browser.newPage();
  await page.exposeFunction('__probeStage', (event) => console.log('[media-probe] ' + JSON.stringify(event)));
  page.on('pageerror', (error) => console.error('[media-probe] pageerror ' + error.message));
  page.on('console', (message) => { if (message.type() === 'error') console.error('[media-probe] console ' + message.text()); });
  page.on('requestfailed', (request) => console.error('[media-probe] requestfailed ' + new URL(request.url()).pathname + ' ' + request.failure()?.errorText));
  await page.addInitScript(() => {
    // 仅为此私有测试页面观察原生 Worker 错误，不修改用户站点或原生 prototype。
    const NativeWorker = window.Worker;
    window.Worker = class ObservedWorker extends NativeWorker {
      constructor(url, options) {
        super(url, options);
        this.addEventListener('error', (event) => { void window.__probeStage({ phase: 'worker.error', message: event.message, file: event.filename, line: event.lineno }); });
        this.addEventListener('messageerror', () => { void window.__probeStage({ phase: 'worker.messageerror' }); });
      }
    };
  });
  const externalRequests = [];
  page.on('request', (request) => {
    const url = new URL(request.url());
    if (['http:', 'https:'].includes(url.protocol) && url.origin !== origin) externalRequests.push(url.origin + url.pathname);
  });
  await page.goto(origin, { waitUntil: 'load', timeout: 10000 });
  const operation = page.evaluate(async ({ origin, hevcDiagnostic }) => {
    const { FFmpeg } = await import(origin + '/ffmpeg/index.js');
    const engine = new FFmpeg();
    const mark = (phase, detail = {}) => window.__probeStage({ phase, ...detail });
    const logs = [];
    engine.on('log', ({ message }) => { logs.push(message); if (logs.length > 100) logs.shift(); void mark('core.log', { message }); });
    const probes = [];
    const samples = [];
    let loadTimer;
    const bounded = async (work, phase, milliseconds) => {
      let timer;
      await mark(phase + '.start');
      try {
        const result = await Promise.race([work, new Promise((_, reject) => { timer = setTimeout(() => { reject(new Error(phase + ' host deadline exceeded')); engine.terminate(); }, milliseconds); })]);
        await mark(phase + '.done', { returnCode: typeof result === 'number' ? result : undefined });
        return result;
      } finally { clearTimeout(timer); }
    };
    const write = (name, data) => bounded(engine.writeFile(name, data), 'fs.write.' + name, 10000);
    const read = (name) => bounded(engine.readFile(name), 'fs.read.' + name, 10000);
    const remove = (name) => bounded(engine.deleteFile(name), 'fs.delete.' + name, 10000);
    const execute = async (args) => {
      // @ffmpeg/ffmpeg 的 Worker 每次 exec 后调用 core.reset()；这里必须核返回码，不能复用旧 ret。
      await mark('exec.args', { args });
      const code = await bounded(engine.exec(['-filter_threads', '1', '-filter_complex_threads', '1', ...args], 30000), 'exec.' + args[args.length - 1], 35000);
      if (code !== 0) throw new Error('Real media command failed: ' + code + ' ' + args.join(' '));
      return code;
    };
    try {
      await Promise.race([
        bounded(engine.load({ coreURL: origin + '/core/ffmpeg-core.js', wasmURL: origin + '/core/ffmpeg-core.wasm' }), 'core.load', 45000),
        new Promise((_, reject) => { loadTimer = setTimeout(() => reject(new Error('Core load exceeded 45 seconds')), 45000); })
      ]);
      clearTimeout(loadTimer);
      if (hevcDiagnostic) {
      for (const depth of [8, 10, 12]) {
        const format = depth === 8 ? 'yuv420p' : `yuv420p${depth}le`;
        const pixelsPerFrame = 64 * 64 * 3 / 2;
        const input = new Uint8Array(pixelsPerFrame * 2 * (depth === 8 ? 1 : 2));
        const view = new DataView(input.buffer);
        for (let index = 0; index < pixelsPerFrame * 2; index++) {
          const value = (24 + ((index * 13 + Math.floor(index / pixelsPerFrame) * 37) % 200)) << (depth - 8);
          if (depth === 8) input[index] = value;
          else view.setUint16(index * 2, value, true);
        }
        const inputName = `input-${depth}.yuv`, encodedName = `probe-hevc-${depth}.hevc`, decodedName = `decoded-${depth}.yuv`;
        await write(inputName, input);
        const encode = await execute(['-f', 'rawvideo', '-pixel_format', format, '-video_size', '64x64', '-framerate', '2', '-i', inputName, '-frames:v', '2', '-an', '-threads:v', '1', '-c:v', 'libx265', '-pix_fmt', format, '-preset', 'ultrafast', '-tune', 'zerolatency', '-x265-params', 'pools=none:frame-threads=1:wpp=0:lossless=1:repeat-headers=1:log-level=info', '-f', 'hevc', encodedName]);
        const encoded = await read(encodedName);
        if (!(encoded instanceof Uint8Array) || !encoded.length) throw new Error('HEVC output is empty');
        const nal = new Set();
        for (let i = 0; i + 5 < encoded.length; i++) {
          if (encoded[i] === 0 && encoded[i + 1] === 0) {
            const start = encoded[i + 2] === 1 ? i + 3 : encoded[i + 2] === 0 && encoded[i + 3] === 1 ? i + 4 : 0;
            if (start) nal.add((encoded[start] >> 1) & 63);
          }
        }
        if (!nal.has(33) || !nal.has(34)) throw new Error('HEVC output lacks SPS/PPS');
        const decode = await execute(['-f', 'hevc', '-i', encodedName, '-frames:v', '2', '-pix_fmt', format, '-f', 'rawvideo', decodedName]);
        const decoded = await read(decodedName);
        // writeFile 转移输入 ArrayBuffer；按同一公式检查完整解码数据，不能比较已被转移的旧缓冲区。
        const expectedBytes = pixelsPerFrame * 2 * (depth === 8 ? 1 : 2);
        if (!(decoded instanceof Uint8Array) || decoded.length !== expectedBytes) throw new Error('HEVC decoded size is incorrect');
        const resultView = new DataView(decoded.buffer, decoded.byteOffset, decoded.byteLength);
        for (let index = 0; index < pixelsPerFrame * 2; index++) {
          const expected = (24 + ((index * 13 + Math.floor(index / pixelsPerFrame) * 37) % 200)) << (depth - 8);
          const value = depth === 8 ? decoded[index] : resultView.getUint16(index * 2, true);
          if (value !== expected) throw new Error('HEVC lossless pixel mismatch at ' + index + ' depth ' + depth);
        }
        probes.push({ id: `hevc-${depth}`, encoder: 'libx265', depth, frames: 2, width: 64, height: 64, encodeReturnCode: encode, decodeReturnCode: decode, encodedBytes: encoded.length, decodedBytes: decoded.length, losslessPixelsMatch: true, status: 'passed' });
        samples.push({ file: encodedName, data: Array.from(encoded) });
        for (const name of [inputName, encodedName, decodedName]) await remove(name);
      }
      } else {
        // 活动 UI 使用的是 libx264；这是有损编码质量检查，不称为 HEVC 支持或无损往返。
        const expectedBytes = 64 * 64 * 3 / 2 * 2;
        const input = new Uint8Array(expectedBytes);
        for (let i = 0; i < expectedBytes; i++) input[i] = 24 + ((i * 13 + Math.floor(i / (64 * 64 * 3 / 2)) * 37) % 200);
        await write('input-h264.yuv', input);
        const encode = await execute(['-f', 'rawvideo', '-pixel_format', 'yuv420p', '-video_size', '64x64', '-framerate', '2', '-i', 'input-h264.yuv', '-frames:v', '2', '-an', '-threads:v', '1', '-c:v', 'libx264', '-preset', 'ultrafast', '-tune', 'zerolatency', '-crf', '18', '-pix_fmt', 'yuv420p', '-f', 'h264', 'probe-h264.h264']);
        const encoded = await read('probe-h264.h264');
        if (!(encoded instanceof Uint8Array) || !encoded.length) throw new Error('H264 output is empty');
        const decode = await execute(['-f', 'h264', '-i', 'probe-h264.h264', '-frames:v', '2', '-pix_fmt', 'yuv420p', '-f', 'rawvideo', 'decoded-h264.yuv']);
        const decoded = await read('decoded-h264.yuv');
        if (!(decoded instanceof Uint8Array) || decoded.length !== expectedBytes) throw new Error('H264 frame count/dimensions are incorrect');
        let absolute = 0, squared = 0;
        for (let i = 0; i < expectedBytes; i++) {
          const original = 24 + ((i * 13 + Math.floor(i / (64 * 64 * 3 / 2)) * 37) % 200);
          const error = decoded[i] - original;
          absolute += Math.abs(error); squared += error * error;
        }
        const meanAbsoluteError = absolute / expectedBytes, mse = squared / expectedBytes;
        const psnrDb = mse === 0 ? 99 : 10 * Math.log10(255 * 255 / mse);
        if (meanAbsoluteError > 8 || psnrDb < 30) throw new Error('H264 lossy quality is outside the declared MAE<=8 / PSNR>=30dB threshold');
        probes.push({ id: 'h264', encoder: 'libx264', frames: 2, width: 64, height: 64, encodeReturnCode: encode, decodeReturnCode: decode, encodedBytes: encoded.length, decodedBytes: decoded.length, lossless: false, meanAbsoluteError, mse, psnrDb, status: 'passed' });
        samples.push({ file: 'probe-h264.h264', data: Array.from(encoded) });
        for (const name of ['input-h264.yuv', 'probe-h264.h264', 'decoded-h264.yuv']) await remove(name);
      }
      for (const codec of [{ id: 'mp3', encoder: 'libmp3lame', muxer: 'mp3' }, { id: 'aac', encoder: 'aac', muxer: 'adts' }]) {
        const count = 4410, rate = 44100;
        const data = new Uint8Array(44 + count * 2), wave = new DataView(data.buffer);
        const text = (offset, value) => data.set(new TextEncoder().encode(value), offset);
        text(0, 'RIFF'); wave.setUint32(4, data.length - 8, true); text(8, 'WAVEfmt '); wave.setUint32(16, 16, true); wave.setUint16(20, 1, true); wave.setUint16(22, 1, true); wave.setUint32(24, rate, true); wave.setUint32(28, rate * 2, true); wave.setUint16(32, 2, true); wave.setUint16(34, 16, true); text(36, 'data'); wave.setUint32(40, count * 2, true);
        for (let i = 0; i < count; i++) wave.setInt16(44 + i * 2, Math.round(Math.sin(i * 2 * Math.PI * 440 / rate) * 4000), true);
        await write('tone.wav', data);
        const name = `probe-${codec.id}.${codec.id}`;
        const encode = await execute(['-i', 'tone.wav', '-c:a', codec.encoder, '-b:a', '64k', '-f', codec.muxer, name]);
        const encoded = await read(name);
        if (!(encoded instanceof Uint8Array) || encoded.length < 10) throw new Error(codec.id + ' output is invalid');
        const decode = await execute(['-i', name, '-ac', '1', '-ar', String(rate), '-f', 's16le', 'decoded.pcm']);
        const pcm = await read('decoded.pcm');
        if (!(pcm instanceof Uint8Array) || pcm.length < 1000 || pcm.length % 2) throw new Error(codec.id + ' decoded PCM is invalid');
        const view = new DataView(pcm.buffer, pcm.byteOffset, pcm.byteLength);
        let energy = 0;
        for (let i = 0; i < pcm.length; i += 2) energy += view.getInt16(i, true) ** 2;
        const rms = Math.sqrt(energy / (pcm.length / 2));
        if (rms <= 100) throw new Error(codec.id + ' decoded tone is silent');
        probes.push({ id: codec.id, encoder: codec.encoder, encodeReturnCode: encode, decodeReturnCode: decode, encodedBytes: encoded.length, decodedBytes: pcm.length, decodedRms: rms, status: 'passed' });
        samples.push({ file: name, data: Array.from(encoded) });
        for (const file of ['tone.wav', name, 'decoded.pcm']) await remove(file);
      }
      return { status: 'passed', probes, samples };
    } catch (error) {
      throw new Error(String(error) + '\nRecent compiler/runtime log:\n' + logs.slice(-30).join('\n'));
    } finally { clearTimeout(loadTimer); engine.terminate(); }
  }, { origin, hevcDiagnostic });
  const result = await Promise.race([operation, new Promise((_, reject) => { timer = setTimeout(() => reject(new Error('Media probe total limit reached')), 180000); })]);
  if (externalRequests.length) throw new Error('Media probe made external requests: ' + externalRequests.join(', '));
  const sampleDir = path.join(base, 'release');
  for (const sample of result.samples) await fs.writeFile(path.join(sampleDir, sample.file), new Uint8Array(sample.data));
  const report = { schema: 1, diagnostic, status: result.status, browser: 'chromium', core_binaries: receipt.binaries, externalRequests, probes: result.probes, knownLimitations: [{ id: 'hevc-single-thread-encoding', status: 'unsupported', evidence: 'Existing npm single-thread core reproducibly hangs at x265 FrameEncoder initialization; fixed source requires pthread_create but the ST SDK stub returns EAGAIN. Current UI does not select libx265. The codec remains compiled; no HEVC success is claimed.' }], scope: hevcDiagnostic ? 'Explicit diagnostic of the known HEVC-ST failure; never a publication acceptance result.' : 'Active-UI H264/libx264 two-frame lossy encode/decode (MAE<=8, PSNR>=30dB), plus real MP3/AAC encoding and non-silent PCM decoding. Not all compiled codecs are supported or individually exercised.' };
  await fs.writeFile(path.join(base, 'codec-probes.json'), JSON.stringify(report, null, 2) + '\n');
  await fs.copyFile(path.join(base, 'codec-probes.json'), path.join(sampleDir, 'media-core-codec-probes.json'));
  console.log(JSON.stringify(report));
} finally {
  clearTimeout(timer);
  if (browser) await browser.close();
  server.closeAllConnections();
  await new Promise((resolve) => server.close(resolve));
}
