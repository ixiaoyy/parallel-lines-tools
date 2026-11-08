import { defineConfig } from '@playwright/test';
import upstream from '../playwright.config';
import path from 'node:path';

// 本机代理不应接管环回健康检查；仅影响本次测试及其子进程。
process.env.NO_PROXY = [process.env.NO_PROXY, 'localhost', '127.0.0.1', '::1']
  .filter(Boolean)
  .join(',');

// 复用已构建的原版产物和系统 Chrome；不重复构建，也不下载替代浏览器。
export default defineConfig({
  ...upstream,
  testDir: '../src',
  outputDir: '../test-results/baseline',
  retries: 0,
  workers: 1,
  reporter: [['list'], ['json', { outputFile: path.resolve(__dirname, '../docs/evidence/baseline-e2e.json') }]],
  projects: [{ name: 'chrome-local', use: { channel: 'chrome' } }],
  webServer: {
    cwd: path.resolve(__dirname, '..'),
    command: 'node node_modules/vite/bin/vite.js preview --host 127.0.0.1 --port 4173 --strictPort',
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: false
  },
  use: { ...upstream.use, baseURL: 'http://127.0.0.1:4173' }
});
