import { createServer } from 'node:http';
import { createReadStream } from 'node:fs';
import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { chromium } from 'playwright';

// 只提供本次核心与既有 FFmpeg 浏览器包装；临时环回服务器不进入站点或发布目录。
const root = process.cwd();
const base = path.join(root, '.media-core');
const runtime = path.join(base, 'runtime');
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
  browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const externalRequests = [];
  page.on('request', (request) => {
    const url = new URL(request.url());
    if (['http:', 'https:'].includes(url.protocol) && url.origin !== origin) externalRequests.push(url.origin + url.pathname);
  });
  await page.goto(origin, { waitUntil: 'load', timeout: 10000 });
  const operation = page.evaluate(async (origin) => {
    const { FFmpeg } = await import(origin + '/ffmpeg/index.js');
    const engine = new FFmpeg();
    const logs = [];
    engine.on('log', ({ message }) => { logs.push(message); if (logs.length > 100) logs.shift(); });
    const probes = [];
    const samples = [];
    let loadTimer;
    const execute = async (args) => {
      // @ffmpeg/ffmpeg 的 Worker 每次 exec 后调用 core.reset()；这里必须核返回码，不能复用旧 ret。
      const code = await engine.exec(args, 30000);
      if (code !== 0) throw new Error('Real media command failed: ' + code + ' ' + args.join(' '));
      return code;
    };
    try {
      await Promise.race([
        engine.load({ coreURL: origin + '/core/ffmpeg-core.js', wasmURL: origin + '/core/ffmpeg-core.wasm' }),
        new Promise((_, reject) => { loadTimer = setTimeout(() => reject(new Error('Core load exceeded 45 seconds')), 45000); })
      ]);
      clearTimeout(loadTimer);
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
        await engine.writeFile(inputName, input);
        const encode = await execute(['-f', 'rawvideo', '-pixel_format', format, '-video_size', '64x64', '-framerate', '2', '-i', inputName, '-frames:v', '2', '-an', '-c:v', 'libx265', '-pix_fmt', format, '-preset', 'ultrafast', '-tune', 'zerolatency', '-x265-params', 'pools=none:frame-threads=1:wpp=0:lossless=1:repeat-headers=1:log-level=error', '-f', 'hevc', encodedName]);
        const encoded = await engine.readFile(encodedName);
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
        const decoded = await engine.readFile(decodedName);
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
        for (const name of [inputName, encodedName, decodedName]) await engine.deleteFile(name);
      }
      for (const codec of [{ id: 'mp3', encoder: 'libmp3lame', muxer: 'mp3' }, { id: 'aac', encoder: 'aac', muxer: 'adts' }]) {
        const count = 4410, rate = 44100;
        const data = new Uint8Array(44 + count * 2), wave = new DataView(data.buffer);
        const text = (offset, value) => data.set(new TextEncoder().encode(value), offset);
        text(0, 'RIFF'); wave.setUint32(4, data.length - 8, true); text(8, 'WAVEfmt '); wave.setUint32(16, 16, true); wave.setUint16(20, 1, true); wave.setUint16(22, 1, true); wave.setUint32(24, rate, true); wave.setUint32(28, rate * 2, true); wave.setUint16(32, 2, true); wave.setUint16(34, 16, true); text(36, 'data'); wave.setUint32(40, count * 2, true);
        for (let i = 0; i < count; i++) wave.setInt16(44 + i * 2, Math.round(Math.sin(i * 2 * Math.PI * 440 / rate) * 4000), true);
        await engine.writeFile('tone.wav', data);
        const name = `probe-${codec.id}.${codec.id}`;
        const encode = await execute(['-i', 'tone.wav', '-c:a', codec.encoder, '-b:a', '64k', '-f', codec.muxer, name]);
        const encoded = await engine.readFile(name);
        if (!(encoded instanceof Uint8Array) || encoded.length < 10) throw new Error(codec.id + ' output is invalid');
        const decode = await execute(['-i', name, '-ac', '1', '-ar', String(rate), '-f', 's16le', 'decoded.pcm']);
        const pcm = await engine.readFile('decoded.pcm');
        if (!(pcm instanceof Uint8Array) || pcm.length < 1000 || pcm.length % 2) throw new Error(codec.id + ' decoded PCM is invalid');
        const view = new DataView(pcm.buffer, pcm.byteOffset, pcm.byteLength);
        let energy = 0;
        for (let i = 0; i < pcm.length; i += 2) energy += view.getInt16(i, true) ** 2;
        const rms = Math.sqrt(energy / (pcm.length / 2));
        if (rms <= 100) throw new Error(codec.id + ' decoded tone is silent');
        probes.push({ id: codec.id, encoder: codec.encoder, encodeReturnCode: encode, decodeReturnCode: decode, encodedBytes: encoded.length, decodedBytes: pcm.length, decodedRms: rms, status: 'passed' });
        samples.push({ file: name, data: Array.from(encoded) });
        for (const file of ['tone.wav', name, 'decoded.pcm']) await engine.deleteFile(file);
      }
      return { status: 'passed', probes, samples };
    } catch (error) {
      throw new Error(String(error) + '\nRecent compiler/runtime log:\n' + logs.slice(-30).join('\n'));
    } finally { clearTimeout(loadTimer); engine.terminate(); }
  }, origin);
  const result = await Promise.race([operation, new Promise((_, reject) => { timer = setTimeout(() => reject(new Error('Media probe total limit reached')), 180000); })]);
  if (externalRequests.length) throw new Error('Media probe made external requests: ' + externalRequests.join(', '));
  const sampleDir = path.join(base, 'release');
  for (const sample of result.samples) await fs.writeFile(path.join(sampleDir, sample.file), new Uint8Array(sample.data));
  const report = { schema: 1, status: result.status, browser: 'chromium', core_binaries: receipt.binaries, externalRequests, probes: result.probes, scope: 'Synthetic HEVC 8/10/12-bit lossless encoding and exact decoding; real MP3/AAC encoding and non-silent PCM decoding; no claim that every FFmpeg codec was exercised.' };
  await fs.writeFile(path.join(base, 'codec-probes.json'), JSON.stringify(report, null, 2) + '\n');
  await fs.copyFile(path.join(base, 'codec-probes.json'), path.join(sampleDir, 'media-core-codec-probes.json'));
  console.log(JSON.stringify(report));
} finally {
  clearTimeout(timer);
  if (browser) await browser.close();
  server.closeAllConnections();
  await new Promise((resolve) => server.close(resolve));
}
