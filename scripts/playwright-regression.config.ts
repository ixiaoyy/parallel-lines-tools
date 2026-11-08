import { defineConfig } from '@playwright/test';
import path from 'node:path';
import baseline from './playwright-baseline.config';

// 原有用例以英文文本定位；显式复原它的夹具语言，中文默认由候选用例单独验证。
export default defineConfig({
  ...baseline,
  reporter: [['list'], ['json', { outputFile: path.resolve(__dirname, '../docs/evidence/candidate-upstream-e2e.json') }]],
  use: {
    ...baseline.use,
    storageState: { cookies: [], origins: [{ origin: 'http://127.0.0.1:4173', localStorage: [{ name: 'lang', value: 'en' }] }] }
  }
});
