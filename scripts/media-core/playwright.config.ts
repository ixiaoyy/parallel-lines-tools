import { defineConfig } from '@playwright/test';
import path from 'node:path';
import candidate from '../playwright-candidate.config';

// 标准 Linux runner 使用锁定 Playwright 的 Chromium，不依赖本机 Chrome 路径。
export default defineConfig({
  ...candidate,
  testDir: '../../tests',
  outputDir: '../../.media-core/browser-results',
  timeout: 120000,
  reporter: [['list'], ['json', { outputFile: path.resolve(__dirname, '../../.media-core/browser-results.json') }]],
  use: { ...candidate.use, channel: undefined, browserName: 'chromium' }
});
