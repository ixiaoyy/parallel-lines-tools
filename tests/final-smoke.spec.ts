import { test, expect } from '@playwright/test';
import fs from 'node:fs/promises';
import JSZip from 'jszip';
import inventory from '../docs/tool-inventory.json';
import zh from '../public/locales/zh/translation.json';
import converters from '../public/locales/zh/converters.json';

let outside: string[];
let failures: string[];
test.beforeEach(async ({ page }) => {
  outside = []; failures = [];
  page.on('request', (request) => {
    if (/^https?:/.test(request.url()) && new URL(request.url()).origin !== 'http://127.0.0.1:5180') outside.push(new URL(request.url()).origin);
    if (!['GET', 'HEAD'].includes(request.method())) failures.push('Unexpected method: ' + request.method());
  });
  page.on('pageerror', (error) => failures.push(error.message));
});
test.afterEach(async ({}, info) => {
  await fs.writeFile(`docs/evidence/final-network-${info.testId.replace(/\W/g, '_')}.json`, JSON.stringify({ title: info.title, externalOrigins: outside, failures }, null, 2));
  expect(outside).toEqual([]); expect(failures).toEqual([]);
});

test('最终：全部活动路径能打开且显示正确中文标题（非文件全验收）', async ({ page }) => {
  test.setTimeout(240000);
  const results = [];
  for (const tool of inventory.filter((row) => row.registered)) {
    try {
      const response = await page.goto(tool.route, { waitUntil: 'load', timeout: 10000 });
      expect(response?.status()).toBe(200);
      await expect(page.getByRole('heading', { level: 1 }).first()).toHaveText(tool.chinese!, { timeout: 3500 });
      results.push({ id: tool.id, passed: true });
    } catch (error) {
      results.push({ id: tool.id, passed: false, error: String(error).slice(0, 800) });
    }
  }
  await fs.writeFile('docs/evidence/candidate-route-smoke.json', JSON.stringify(results, null, 2));
  expect(results.filter((row) => !row.passed)).toEqual([]);
});

test('最终：Monaco中文菜单、切换提示及刷新后英文菜单', async ({ page }) => {
  await page.goto('/json/prettify');
  const editor = page.locator('.monaco-editor').first();
  await expect(editor).toBeVisible(); await editor.click({ button: 'right' });
  await expect(page.locator('.context-view .action-label').filter({ hasText: '复制' }).first()).toBeVisible();
  await page.screenshot({ path: 'docs/evidence/monaco-chinese.png' });
  await page.keyboard.press('Escape');
  await page.evaluate(() => document.documentElement.dataset.nlsMarker = 'keep-input');
  await page.getByRole('combobox', { name: '语言' }).click();
  await page.getByRole('option', { name: 'English', exact: true }).click();
  await expect(page.getByText(/Save your input before refreshing/)).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.dataset.nlsMarker)).toBe('keep-input');
  await page.reload(); await expect(editor).toBeVisible(); await editor.click({ button: 'right' });
  await expect(page.locator('.context-view .action-label').filter({ hasText: /^Copy/ }).first()).toBeVisible();
});

test('最终：下载按钮悬停可读、源码和Worker许可产物完整', async ({ page }) => {
  await page.goto('/converters/markdown-to-docx');
  const copy = converters.markdownToDocx;
  await page.getByRole('button', { name: copy.sample, exact: true }).click();
  await page.getByRole('button', { name: copy.convert, exact: true }).click();
  const download = page.getByRole('link', { name: copy.download, exact: true });
  await expect(download).toBeVisible(); await download.hover();
  expect(await download.evaluate((element) => getComputedStyle(element).color)).toBe('rgb(255, 255, 255)');
  const notice = await page.request.get('/THIRD_PARTY_NOTICES.txt');
  expect(notice.status()).toBe(200); const text = await notice.text();
  for (const name of ['markdown-docx', 'docx@', 'katex', '@ffmpeg/core', 'GNU GENERAL PUBLIC LICENSE', 'Icon artwork']) expect(text).toContain(name);
  const pending = page.waitForEvent('download');
  await page.getByRole('link', { name: zh.footer.modifiedSource, exact: true }).click();
  const source = await pending; const file = await source.path(); if (!file) throw new Error('No source archive');
  const archive = await JSZip.loadAsync(await fs.readFile(file)); const paths = Object.keys(archive.files);
  for (const path of ['SOURCE-MANIFEST.json', 'src/lib/monaco-nls.ts', 'src/pages/tools/converters/markdown-to-docx/service.ts', 'scripts/release-policy.ts', 'upstream-base.json', 'licenses/icons/manifest.json']) expect(paths).toContain(path);
  expect(paths.filter((path) => /(^|\/)(\.git|node_modules|fixtures)\/|src\/lib\/ghostscript/.test(path))).toEqual([]);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: 'docs/evidence/final-markdown-desktop.png', fullPage: true });
  await page.setViewportSize({ width: 375, height: 812 });
  await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  await page.screenshot({ path: 'docs/evidence/final-markdown-mobile.png' });
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(375);
});
