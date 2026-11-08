import { chromium } from 'playwright';
import fs from 'node:fs/promises';

// 采集原版桌面/手机基线；只记录请求目的地和方法，不记录请求内容、查询参数或文件名。
const browser = await chromium.launch({ channel: 'chrome', headless: true });
try {
  const context = await browser.newContext({ locale: 'zh-CN', viewport: { width: 1280, height: 900 } });
  await context.addInitScript(() => localStorage.setItem('lang', 'zh'));
  const page = await context.newPage();
  const requests = [];
  const errors = [];
  page.on('request', (req) => {
    const url = new URL(req.url());
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return;
    requests.push({ destination: url.origin + url.pathname, method: req.method(), hasBody: req.postDataBuffer() !== null });
  });
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('http://127.0.0.1:5178', { waitUntil: 'networkidle', timeout: 30000 });
  await page.screenshot({ path: 'docs/evidence/upstream-desktop.png', fullPage: true, animations: 'disabled' });
  const desktop = { title: await page.title(), bodyWidth: await page.evaluate(() => document.documentElement.scrollWidth) };
  await page.setViewportSize({ width: 375, height: 812 });
  // 等待媒体查询引发的 React 布局提交，避免截到桌面布局尚未收拢的中间帧。
  await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  await page.screenshot({ path: 'docs/evidence/upstream-mobile.png', fullPage: false, animations: 'disabled' });
  const mobile = { bodyWidth: await page.evaluate(() => document.documentElement.scrollWidth) };
  await fs.writeFile('docs/evidence/upstream-browser.json', JSON.stringify({ desktop, mobile, requests, errors, scope: '仅原版首页；未验证全部工具文件处理过程，也未证明无内容外发。' }, null, 2));
  console.log(JSON.stringify({ desktop, mobile, errors, requests: requests.length }));
} finally {
  await browser.close();
}
