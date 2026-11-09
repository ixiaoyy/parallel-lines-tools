/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import tsconfigPaths from 'vite-tsconfig-paths';
import packageJson from './package.json';
import { releasePolicy } from './scripts/release-policy';
import upstream from './upstream-base.json';
import path from 'node:path';
import fs from 'node:fs';
import { readMediaCoreInfo } from './scripts/media-core-info';

// 源码包不依赖 .git 也可独立构建；本地候选不冒充新的已提交版本。
const commitHash = `${upstream.commit.slice(0, 7)}-${upstream.candidate}`;
const releaseModules = new Set<string>();
const mediaLock = fs.existsSync('media-core.lock.json')
  ? JSON.parse(fs.readFileSync('media-core.lock.json', 'utf8'))
  : null;
const preparedCoreDirectory = process.env.TOOLBOX_MEDIA_CORE_DIR;
const mediaCore = readMediaCoreInfo(
  preparedCoreDirectory || (mediaLock ? '.media-core/runtime' : undefined)
);
const requireVerifiedCore =
  process.env.TOOLBOX_REQUIRE_MEDIA_CORE === '1' ||
  (mediaLock && !preparedCoreDirectory);
if (requireVerifiedCore && (!mediaCore || !mediaCore.validated))
  throw new Error(
    'Public deployment requires the prepared media core and corresponding source receipt'
  );
if (
  process.env.TOOLBOX_REQUIRE_MEDIA_CORE === '1' &&
  (!mediaLock ||
    !mediaCore ||
    mediaCore?.version !== mediaLock.version ||
    mediaCore.source.sha256 !== mediaLock.source.sha256)
)
  throw new Error(
    'Public deployment core must match the committed corresponding-source lock'
  );

// https://vitejs.dev/config https://vitest.dev/config
export default defineConfig({
  plugins: [
    react(),
    tsconfigPaths(),
    releasePolicy(releaseModules, true, mediaCore)
  ],
  // 离线版图标组件没有任何网络加载实现，缺图标不会触发公共 API 请求。
  resolve: {
    alias: [
      ...(mediaCore
        ? [
            {
              find: /^@ffmpeg\/core\/wasm(?=\?|$)/,
              replacement: path.join(mediaCore.directory, 'ffmpeg-core.wasm')
            },
            {
              find: /^@ffmpeg\/core(?=\?|$)/,
              replacement: path.join(mediaCore.directory, 'ffmpeg-core.js')
            }
          ]
        : []),
      { find: /^@iconify\/react$/, replacement: '@iconify/react/offline' }
    ]
  },
  build: { copyPublicDir: false },
  define: {
    'process.env': {},
    __APP_VERSION__: JSON.stringify(packageJson.version),
    __COMMIT_HASH__: JSON.stringify(commitHash),
    __MEDIA_CORE_SOURCE_URL__: JSON.stringify(mediaCore?.source.url ?? null)
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
    plugins: () => [releasePolicy(releaseModules, false, mediaCore)]
  }
});
