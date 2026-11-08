import { defineConfig } from '@playwright/test';
import path from 'node:path';

process.env.NO_PROXY = [process.env.NO_PROXY, 'localhost', '127.0.0.1', '::1'].filter(Boolean).join(',');
export default defineConfig({
  testDir: '../tests',
  testMatch: '**/*.spec.ts',
  outputDir: '../test-results/candidate',
  timeout: 90000,
  workers: 1,
  retries: 0,
  reporter: [['list'], ['json', { outputFile: path.resolve(__dirname, '../docs/evidence/candidate-e2e.json') }]],
  use: { baseURL: 'http://127.0.0.1:5180', channel: 'chrome', viewport: { width: 1280, height: 900 }, screenshot: 'only-on-failure', trace: 'retain-on-failure' },
  webServer: {
    cwd: path.resolve(__dirname, '..'),
    command: 'node node_modules/vite/bin/vite.js preview --host 127.0.0.1 --port 5180 --strictPort',
    url: 'http://127.0.0.1:5180',
    reuseExistingServer: false
  }
});
