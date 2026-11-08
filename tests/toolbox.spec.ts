import { test, expect, Page, Download } from '@playwright/test';
import JSZip from 'jszip';
import fs from 'node:fs/promises';
import mdLocale from '../public/locales/zh/converters.json';
import imageLocale from '../public/locales/zh/image.json';
import enLocale from '../public/locales/en/converters.json';
const md = mdLocale.markdownToDocx;
const image = imageLocale.compress;
let external: string[];
let errors: string[];
let sent: string[];

test.beforeEach(async ({ page }) => {
  external = []; errors = []; sent = [];
  page.on('request', (request) => {
    if (/^https?:/.test(request.url()) && new URL(request.url()).origin !== 'http://127.0.0.1:5180') external.push(new URL(request.url()).origin);
    if (!['GET', 'HEAD'].includes(request.method())) sent.push(request.method());
  });
  page.on('pageerror', (error) => errors.push(error.message));
});
test.afterEach(async ({}, info) => {
  await fs.writeFile(`docs/evidence/network-${info.testId.replace(/[^a-zA-Z0-9]/g, '_')}.json`, JSON.stringify({ test: info.title, externalOrigins: external, nonReadMethods: sent, pageErrors: errors }, null, 2));
  expect(external).toEqual([]);
  expect(sent).toEqual([]);
  expect(errors).toEqual([]);
});

/** 获取真实下载字节，不以下载事件或扩展名冒充文件内容验收。 */
async function bytes(download: Download): Promise<Buffer> {
  const file = await download.path();
  if (!file) throw new Error('Download has no local path');
  return fs.readFile(file);
}

/** 生成非敏感真实图片；PNG 含透明像素，供格式变化和透明度提示验收。 */
async function fixture(page: Page, mime: string): Promise<Buffer> {
  const encoded = await page.evaluate((type) => {
    const canvas = document.createElement('canvas'); canvas.width = 256; canvas.height = 128;
    const ctx = canvas.getContext('2d')!;
    const gradient = ctx.createLinearGradient(0, 0, 256, 128); gradient.addColorStop(0, '#2255aa'); gradient.addColorStop(1, '#ffcc66');
    ctx.fillStyle = gradient; ctx.fillRect(8, 8, 240, 112);
    return canvas.toDataURL(type, 0.9).split(',')[1];
  }, mime);
  return Buffer.from(encoded, 'base64');
}

/** 以浏览器真实解码下载产物，拒绝只有正确文件头却无法打开的伪样本。 */
async function decodeDimensions(page: Page, data: Buffer, mime: string): Promise<number[]> {
  return page.evaluate(async ({ encoded, type }) => {
    const binary = Uint8Array.from(atob(encoded), (character) => character.charCodeAt(0));
    const bitmap = await createImageBitmap(new Blob([binary], { type }));
    const result = [bitmap.width, bitmap.height]; bitmap.close(); return result;
  }, { encoded: data.toString('base64'), type: mime });
}

test('中文默认、搜索、深链接与英文切换', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle('平行线工具箱');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('平行线工具箱');
  await page.getByRole('combobox').last().fill('Markdown');
  await page.getByRole('option').filter({ hasText: md.title }).click();
  await expect(page).toHaveURL(/converters\/markdown-to-docx$/);
  await page.reload();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(md.title);
  await page.getByRole('combobox', { name: '语言' }).click();
  await page.getByRole('option', { name: 'English', exact: true }).click();
  await expect(page.getByRole('button', { name: enLocale.markdownToDocx.convert, exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('button', { name: enLocale.markdownToDocx.convert, exact: true })).toBeVisible();
});

test('Markdown 真实DOCX、远程图片隔离、设置变更使旧下载失效', async ({ page }) => {
  await page.goto('/converters/markdown-to-docx');
  await page.getByRole('button', { name: md.convert, exact: true }).click();
  await expect(page.getByText(md.errors.empty, { exact: true })).toBeVisible();
  const content = '# 中文报告\n\n| 项目 | 数量 |\n| --- | --- |\n| 样本 | 2 |\n\n```js\nconst a = 1;\n```\n\n$$\\frac{a+b}{c}$$\n\n![不可外发](https://example.com/private.png)\n<img src="https://example.com/private2.png">';
  await page.locator('input[type=file]').setInputFiles({ name: '中文报告.md', mimeType: 'text/markdown', buffer: Buffer.from(content) });
  await expect(page.getByTestId('markdown-input')).toHaveValue(content);
  await page.getByRole('button', { name: md.convert, exact: true }).click();
  const result = page.getByRole('link', { name: md.download, exact: true });
  await expect(result).toBeVisible();
  const downloaded = page.waitForEvent('download'); await result.click();
  const download = await downloaded;
  expect(download.suggestedFilename()).toBe('中文报告.docx');
  const data = await bytes(download); const zip = await JSZip.loadAsync(data);
  const xml = await zip.file('word/document.xml')!.async('string');
  expect(xml).toContain('中文报告'); expect(xml).toContain('<w:tbl>'); expect(xml).toContain('<m:f>');
  expect(Object.keys(zip.files).some((file) => file.startsWith('word/media/'))).toBe(false);
  await fs.writeFile('docs/evidence/browser-markdown.docx', data);
  await page.screenshot({ path: 'docs/evidence/candidate-markdown-desktop.png', fullPage: true });
  await page.getByTestId('markdown-input').fill('# 更新后');
  await expect(result).toHaveCount(0);
  await page.setViewportSize({ width: 375, height: 812 });
  await page.screenshot({ path: 'docs/evidence/candidate-markdown-mobile.png' });
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(375);
});

test('图片批量重名ZIP、真实WebP尺寸与结果过期', async ({ page }) => {
  await page.goto('/image-generic/compress');
  const png = await fixture(page, 'image/png');
  await page.locator('input[type=file]').setInputFiles([
    { name: '同名.png', mimeType: 'image/png', buffer: png },
    { name: '同名.png', mimeType: 'image/png', buffer: png }
  ]);
  await page.getByLabel(image.outputFormat).click();
  await page.getByRole('option', { name: 'WebP', exact: true }).click();
  await page.getByLabel(image.maxEdge).fill('128');
  await page.getByRole('button', { name: image.start, exact: true }).click();
  const zipButton = page.getByRole('button', { name: image.downloadZip, exact: true });
  await expect(zipButton).toBeVisible();
  const downloaded = page.waitForEvent('download'); await zipButton.click();
  const data = await bytes(await downloaded); const zip = await JSZip.loadAsync(data);
  expect(Object.keys(zip.files).sort()).toEqual(['同名-2.webp', '同名.webp']);
  for (const name of Object.keys(zip.files)) {
    const imageBytes = await zip.file(name)!.async('base64');
    const dimensions = await page.evaluate(async (encoded) => {
      const binary = Uint8Array.from(atob(encoded), (character) => character.charCodeAt(0));
      const bitmap = await createImageBitmap(new Blob([binary], { type: 'image/webp' }));
      const result = [bitmap.width, bitmap.height]; bitmap.close(); return result;
    }, imageBytes);
    expect(dimensions).toEqual([128, 64]);
  }
  await fs.writeFile('docs/evidence/browser-images.zip', data);
  await page.screenshot({ path: 'docs/evidence/candidate-image-desktop.png', fullPage: true });
  await page.getByLabel(image.maxEdge).fill('120');
  await expect(zipButton).toHaveCount(0);
  await page.setViewportSize({ width: 375, height: 812 });
  await page.screenshot({ path: 'docs/evidence/candidate-image-mobile.png' });
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(375);
});

test('JPEG透明度提示、PNG/JPEG可重新打开、损坏文件与重置', async ({ page }) => {
  await page.goto('/image-generic/compress');
  const png = await fixture(page, 'image/png');
  await page.locator('input[type=file]').setInputFiles({ name: '透明.png', mimeType: 'image/png', buffer: png });
  await page.getByLabel(image.outputFormat).click(); await page.getByRole('option', { name: 'JPEG', exact: true }).click();
  await expect(page.getByRole('button', { name: image.start, exact: true })).toBeDisabled();
  await page.getByRole('checkbox', { name: image.jpegConsent }).check();
  await page.getByRole('button', { name: image.start, exact: true }).click();
  const button = page.getByRole('button', { name: image.download, exact: true }); await expect(button).toBeVisible();
  const event = page.waitForEvent('download'); await button.click(); const data = await bytes(await event);
  expect(data.subarray(0, 2)).toEqual(Buffer.from([0xff, 0xd8]));
  expect(await decodeDimensions(page, data, 'image/jpeg')).toEqual([256, 128]);
  await page.getByRole('button', { name: image.reset, exact: true }).click();
  const jpg = await fixture(page, 'image/jpeg');
  await page.locator('input[type=file]').setInputFiles({ name: '照片.jpg', mimeType: 'image/jpeg', buffer: jpg });
  await page.getByLabel(image.outputFormat).click(); await page.getByRole('option', { name: 'PNG', exact: true }).click();
  await page.getByRole('button', { name: image.start, exact: true }).click(); await expect(button).toBeVisible();
  const next = page.waitForEvent('download'); await button.click(); const data2 = await bytes(await next);
  expect(data2.subarray(0, 8)).toEqual(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  expect(await decodeDimensions(page, data2, 'image/png')).toEqual([256, 128]);
  await page.locator('input[type=file]').setInputFiles({ name: '坏图.png', mimeType: 'image/png', buffer: Buffer.from('not an image') });
  await expect(page.getByText(image.errors.invalidImage, { exact: true })).toBeVisible();
  await expect(button).toHaveCount(0);
});

test('代码编辑器和PDF Blob预览只加载本地资源', async ({ page }) => {
  await page.goto('/json/prettify');
  await expect(page.locator('.monaco-editor').first()).toBeVisible();
  await page.goto('/pdf/merge-pdf');
  // 用库生成两份非敏感PDF，验证原有结果iframe未被新CSP误伤。
  const { PDFDocument } = await import('pdf-lib'); const pdf = await PDFDocument.create(); pdf.addPage();
  const data = Buffer.from(await pdf.save());
  await page.locator('input[type=file]').setInputFiles([
    { name: 'one.pdf', mimeType: 'application/pdf', buffer: data }, { name: 'two.pdf', mimeType: 'application/pdf', buffer: data }
  ]);
  await expect(page.locator('iframe[src^="blob:"]')).toBeVisible();
});

test('FFmpeg本地核心实际处理音频', async ({ page }) => {
  await page.goto('/audio/change-speed');
  await page.getByRole('radio', { name: 'WAV', exact: true }).check();
  const sampleRate = 8000; const count = 8000; const data = Buffer.alloc(44 + count * 2);
  data.write('RIFF', 0); data.writeUInt32LE(data.length - 8, 4); data.write('WAVEfmt ', 8); data.writeUInt32LE(16, 16); data.writeUInt16LE(1, 20); data.writeUInt16LE(1, 22); data.writeUInt32LE(sampleRate, 24); data.writeUInt32LE(sampleRate * 2, 28); data.writeUInt16LE(2, 32); data.writeUInt16LE(16, 34); data.write('data', 36); data.writeUInt32LE(count * 2, 40);
  for (let i = 0; i < count; i++) data.writeInt16LE(Math.round(Math.sin(i * 2 * Math.PI * 440 / sampleRate) * 4000), 44 + i * 2);
  await page.locator('input[type=file]').setInputFiles({ name: 'tone.wav', mimeType: 'audio/wav', buffer: data });
  const button = page.getByRole('button', { name: '下载', exact: true });
  await expect(button).toBeVisible({ timeout: 60000 });
  const event = page.waitForEvent('download'); await button.click(); const result = await bytes(await event);
  expect(result.subarray(0, 4).toString()).toBe('RIFF'); expect(result.length).toBeGreaterThan(1000);
  await fs.writeFile('docs/evidence/browser-audio.wav', result);
});

test('真实JPEG的EXIF保留与批量取消', async ({ page }) => {
  await page.goto('/image-generic/compress');
  const jpeg = await fixture(page, 'image/jpeg');
  // 合成非敏感 EXIF ImageDescription，核查实际输出，不能只靠 mock 参数声称保留。
  const label = Buffer.from('toolbox-fixture\0');
  const tiff = Buffer.alloc(26 + label.length);
  tiff.write('II', 0); tiff.writeUInt16LE(42, 2); tiff.writeUInt32LE(8, 4);
  tiff.writeUInt16LE(1, 8); tiff.writeUInt16LE(0x010e, 10); tiff.writeUInt16LE(2, 12);
  tiff.writeUInt32LE(label.length, 14); tiff.writeUInt32LE(26, 18); label.copy(tiff, 26);
  const payload = Buffer.concat([Buffer.from('Exif\0\0'), tiff]); const marker = Buffer.alloc(4);
  marker[0] = 0xff; marker[1] = 0xe1; marker.writeUInt16BE(payload.length + 2, 2);
  const photo = Buffer.concat([jpeg.subarray(0, 2), marker, payload, jpeg.subarray(2)]);
  await page.locator('input[type=file]').setInputFiles({ name: 'metadata.jpg', mimeType: 'image/jpeg', buffer: photo });
  await page.getByRole('button', { name: image.start, exact: true }).click();
  const button = page.getByRole('button', { name: image.download, exact: true }); await expect(button).toBeVisible();
  const event = page.waitForEvent('download'); await button.click(); const output = await bytes(await event);
  expect(output.includes(Buffer.from('toolbox-fixture'))).toBe(true);
  expect(await decodeDimensions(page, output, 'image/jpeg')).toEqual([256, 128]);
  await page.getByRole('button', { name: image.reset, exact: true }).click();
  const png = await fixture(page, 'image/png');
  await page.locator('input[type=file]').setInputFiles(Array.from({ length: 20 }, (_, i) => ({ name: `batch-${i}.png`, mimeType: 'image/png', buffer: png })));
  await page.getByRole('button', { name: image.start, exact: true }).click();
  await page.getByRole('button', { name: image.cancel, exact: true }).click();
  await expect(page.getByText(image.errors.cancelled, { exact: true })).toBeVisible();
  await expect(button).toHaveCount(0);
  await expect(page.getByRole('button', { name: image.downloadZip, exact: true })).toHaveCount(0);
});
