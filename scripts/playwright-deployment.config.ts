import { defineConfig } from '@playwright/test';
import path from 'node:path';
import candidate from './playwright-candidate.config';

// 验收对象是 CI 的只读 Docker 静态服务，不能再启动 Vite 或静默改测另一个入口。
export default defineConfig({
  ...candidate,
  webServer: undefined,
  outputDir: '../test-results/deployment',
  reporter: [
    ['list'],
    [
      'json',
      {
        outputFile: path.resolve(
          __dirname,
          '../docs/evidence/deployment-e2e.json'
        )
      }
    ]
  ],
  use: {
    ...candidate.use,
    baseURL: 'http://127.0.0.1:5180',
    // 使用锁文件对应的 Playwright Chromium，不借用可能漂移的系统 Chrome。
    channel: undefined,
    browserName: 'chromium'
  },
  projects: [{ name: 'chromium' }]
});
