/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import tsconfigPaths from 'vite-tsconfig-paths';
import packageJson from './package.json';
import { releasePolicy } from './scripts/release-policy';
import upstream from './upstream-base.json';

// 源码包不依赖 .git 也可独立构建；本地候选不冒充新的已提交版本。
const commitHash = `${upstream.commit.slice(0, 7)}-${upstream.candidate}`;
const releaseModules = new Set<string>();

// https://vitejs.dev/config https://vitest.dev/config
export default defineConfig({
  plugins: [react(), tsconfigPaths(), releasePolicy(releaseModules)],
  // 离线版图标组件没有任何网络加载实现，缺图标不会触发公共 API 请求。
  resolve: {
    alias: [
      { find: /^@iconify\/react$/, replacement: '@iconify/react/offline' }
    ]
  },
  build: { copyPublicDir: false },
  define: {
    'process.env': {},
    __APP_VERSION__: JSON.stringify(packageJson.version),
    __COMMIT_HASH__: JSON.stringify(commitHash)
  },
  optimizeDeps: {
    exclude: ['@ffmpeg/ffmpeg', '@ffmpeg/util']
  },
  test: {
    globals: true,
    environment: 'happy-dom',
    setupFiles: '.vitest/setup',
    include: ['**/*.test.{ts,tsx}']
  },
  worker: {
    format: 'es',
    plugins: () => [releasePolicy(releaseModules, false)]
  }
});
