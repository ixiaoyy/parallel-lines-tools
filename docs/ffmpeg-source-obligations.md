# FFmpeg 本地资源与对应源码交付

更新：2026-11-09。任务 `TOOLS-009`、`DEPLOY-CORE`。用户已批准新公开仓库的标准 Linux runner 自建核心和保存对应源码/产物；本记录不将工作流准备完成当作构建或发布验收。

## 实际采用的二进制与来源

| 项目 | 已检查事实 |
|---|---|
| npm 核心包 | 已安装 `@ffmpeg/core@0.12.10`，原锁文件版本 |
| 引用方式 | `@ffmpeg/core?url` 与 `@ffmpeg/core/wasm?url`，由 Vite 将 ESM JS/WASM 作为同源构建资源提供 |
| JS 大小 | `dist/esm/ffmpeg-core.js`，111804 字节 |
| WASM 大小 | `dist/esm/ffmpeg-core.wasm`，32232419 字节 |
| 原行为 | `src/lib/ffmpeg.ts` 绕过 npm 锁文件，从 unpkg 下载 core 0.12.6 |
| 新行为 | 加载本地锁定的单线程 0.12.10 核心，不用 CDN 或共享外网兜底；进入媒体功能时才下载核心，不在首页预载 |
| 包声明 | `packages/core/package.json` 及已安装包声明 `GPL-2.0-or-later` |
| 包内许可正文 | 当前 npm 包仅带 package.json 和 dist，没有单独 LICENSE，不能仅分发这几个文件就宣称已完成许可交付 |

上游版本号有易混点：`v0.12.10` release 对应的是 JS wrapper 0.12.10 与 core 0.12.6，不是本轮选用的 core 0.12.10。与本地核心包版本相符的官方 release 为 [v12.15](https://github.com/ffmpegwasm/ffmpeg.wasm/releases/tag/v12.15)，其固定提交是 `71aa99d37c02a7b4c435275ca9ef50e612f6efa1`；该提交的 [core/package.json](https://github.com/ffmpegwasm/ffmpeg.wasm/blob/71aa99d37c02a7b4c435275ca9ef50e612f6efa1/packages/core/package.json) 确认 core 0.12.10。

官方 [FAQ](https://ffmpegwasm.netlify.app/docs/faq/) 区分 wrapper 与 core：wrapper 的 MIT 不能代替 FFmpeg C 核心及外部库的许可。默认本地核心仍由 npm 发布物取得；自建核心使用可选 `TOOLBOX_MEDIA_CORE_DIR` 对接，不把新产物假称为原 npm 二进制。

## 已核构建配方

固定提交的 [Dockerfile](https://github.com/ffmpegwasm/ffmpeg.wasm/blob/71aa99d37c02a7b4c435275ca9ef50e612f6efa1/Dockerfile) 使用：

- `emscripten/emsdk:3.1.40`，FFmpeg `n5.1.4`。
- `--enable-gpl`，并启用 x264、x265、libvpx、LAME、Theora、Vorbis、Opus、WebP、FreeType、FriBidi、libass、zimg 等依赖。
- `src/bind`、`src/fftools` 定制源文件，以及 `build/` 下各依赖和核心构建脚本。
- [Makefile](https://github.com/ffmpegwasm/ffmpeg.wasm/blob/71aa99d37c02a7b4c435275ca9ef50e612f6efa1/Makefile) 的 `make prd` 走单线程 `build-st`，生产编译标志为 `-O3 -msimd128`；`prd-mt` 是另一种构建，不能混用。
- [build/ffmpeg-wasm.sh](https://github.com/ffmpegwasm/ffmpeg.wasm/blob/71aa99d37c02a7b4c435275ca9ef50e612f6efa1/build/ffmpeg-wasm.sh) 负责最终 Emscripten 链接和 ES 模块输出。

上游基线审计时尚未执行 Docker 构建；后续自建 CI 已实际完成依赖和核心链接，但没有验证自建产物与 npm 二进制逐字节一致。上游配方中 `x264=4-cores`、`LAME=master` 等仍是可移动分支，不能凭当前分支 HEAD 猜测发布包当时的全部构建输入。

## 已批准的自建与共同源码发布路径

官方 release 没有提供已核验的旧 npm 二进制完整输入快照，因此当前采用新自建核心闭合，不追随移动分支猜测旧包来源。

- `core-build.lock.json`：固定官方配方提交、16 个源码 commit、zimg 的 googletest 子模块、SDL2 port 版本/官方 SHA512、SDK 镜像、Dockerfile frontend 和 BuildKit 镜像 digest。这些是 2026-11-09 选择的新构建输入。
- `scripts/media-core/prepare.py`：取得固定源码并校验子模块清单，预填 SHA512 验证的 SDL2 源码。保留全部 codec configure/link 标志，将 `make -j`（含 install）上限限制为 2，zlib 因已核同名归档竞态单独串行；FriBidi 仅绕过失败的 c2man 手册安装，完整库/头文件/pkg-config 必须存在，不盲目 `|| true`。实际编译错误需依据日志修复，不删功能或伪装通过。
- x265 明确取得与基线 commit 相同的 3.4 tag，使上游版本脚本生成 x265.pc；另对 `primitives.cpp` 无 ASM fallback 应用一行真实源码 ABI 修复：定义从三参数 void 改为与 cpu.cpp 声明一致的一参数 uint64_t 并返回 0。原始 commit 只是基线，实际差异和 Git patch 随源码归档，不能声称源码完全未改。
- 生成的 Dockerfile 用本地 COPY 代替 16 个 Git ADD/clone；所有编译 RUN 都是 `--network=none`。只有基础镜像和系统构建工具准备阶段可联网。系统工具的实际包版本、Emscripten 版本与实际 SDK 源码从编译环境导出保存。
- `.github/workflows/build-media-core.yml`：只手动触发，目标为用户批准的公开 `ixiaoyy/parallel-lines-tools`，标准 `ubuntu-24.04` runner。作业总时限 180 分钟，编译上限 130 分钟，BuildKit 并发 2、CPU 配额 2、内存上限 6 GiB；不买新服务器/付费 runner，不使用 Actions artifact 保存大源码。`sdk_only` 默认 true，先只跑已锁镜像的短身份预检；确认后以 false 执行编译/验收/发布。
- `scripts/media-core/finalize.py`：将全部实际源代码、port 原包、SDK 源码、构建脚本/修改、输入锁与构建记录共同归档，产生 `core-receipt.json`，关联实际 JS/WASM 的大小/SHA256、源码包的大小/SHA256/公开 URL，以及工具箱提交/运行编号。
- 产物先放 `.media-core/runtime/`，先在 Chromium 运行 HEVC 8/10/12-bit 两帧无损编码/逐字节解码及 MP3/AAC 实际编码/非静音 PCM 解码，再使用 `TOOLBOX_MEDIA_CORE_DIR` 构建工具箱并跑已有真实 WAV 页面用例；每次 exec 检查返回码，同一二进制身份和全部探针成功后才发布 `media-core-pl.1` Release 的二进制、源码、许可与收据。不把模拟单测或 Docker 编译成功当作真实转码通过。

`media-core-NOTICES.txt` 会按实际源码组件与固定 SHA 汇入原始顶层 COPYING/LICENSE/LICENCE/NOTICE/AUTHORS/COPYRIGHT/PATENTS 等正文，另含 zlib 的许可原文及 FreeType 的 FTL/GPL 双许可材料；SDL2 原文、实际 SDK 源码中的许可正文也纳入。不会仅列仓库 URL，不将所有组件统一标为 MIT。完整原文件和其子目录版权始终随 preferred source 提供。

上游 `testdata` 是未用于核心编译的媒体测试素材，锁中记录 gitlink 但排除其内容；zimg 的构建源码子模块显式固定并取得。这不移除任何编码器或解码器。

### 当前证据与剩余验收

本地只做锁、语法和配方/实际源码补丁准备检查，没有启动本机 Docker。此前真实 CI 依次暴露并修复 zlib 同名归档竞态、FriBidi 手册安装问题、x265 缺 tag 导致 pc 不生成的问题。

第 4 次完整 run `42549935072` 已完成依赖、FFmpeg configure/编译及 UMD/ESM 最终链接，失败发生在末尾 SDK 版本文件的错误字符串断言，因此没有已发布的核心产物。该 run 还暴露 x265 三位深的 xgetbv 函数签名错配；常规无 ASM 路径是否早退不能代替正确 ABI，未取得该版本产物做反汇编，也不能断言它必然在正常 H265 路径 trap。

短预检 [42558773964](https://github.com/ixiaoyy/parallel-lines-tools/actions/runs/42558773964) 实测通过：原始版本文件含双引号，按官方 `tools/shared.py` 的 `strip().strip('"')` 和三段数字解析后是 3.1.40；实际 emcc 3.1.40、返回 0，与锁定 image digest 一致。完整身份原文保存在 `scripts/media-core/sdk-identity-verified.json` 并随源码交付。身份检查已前移，尾部导出只记录实际版本/源码，不再重复错误的未解析字符串断言。

新的实际源码 ABI 补丁、无签名警告门槛及 HEVC/MP3/AAC 探针已准备，但尚待下一次完整 CI 执行。仍未完成：完整 preferred source 导出、实际独立许可汇总、修正后 WASM 的真实编解码、Release 资产完整/公开可访问，以及最终部署所用核心身份。不能用准备通过、SDK-only 成功或单纯链接成功冒充这些验收。

## 运行边界与恢复

`runFFmpegTask(task)` 保留原调用签名与 `ffmpeg/tempFile` context，所有现有消费者无需改动。新增可选 `options.signal` 只控制自己的排队/加载/执行，不取消排在前面的其他任务。

- 核心加载：45 秒总上限（覆盖本站 JS/WASM 下载及初始化）。
- 单任务执行：120 秒上限；含排队的调用总上限：180 秒。
- 等待/执行合计最多 8 项。超过时明确拒绝，不无限排队。
- 取消、超时或 `resetFFmpeg()` 终止所属 Worker；后续排队任务重新取得新引擎，不能沿用已经终止的实例。
- 每个任务登记的虚拟临时文件完成后清理；未生成的输出文件可能不存在。清理失败或超过 5 秒时释放整个虚拟引擎，避免遗留文件保留在复用实例内。
- 队列控制链吸收拒绝仅为允许后续任务继续，真实失败仍由当前调用返回的 Promise 传给原有页面错误边界。

尚未给各旧媒体页面额外接入取消按钮；本次提供的是共享边界的取消能力。旧页面使用原有提示，实际媒体文件的浏览器运行和资源请求验收由集成检查完成。

## 本地验证

- `node node_modules/vitest/vitest.mjs run src/lib/ffmpeg.test.ts --maxWorkers=1 --minWorkers=1`：退出码 0，9/9 通过，覆盖本地资源、原返回值、串行复用、错误传播、排队/执行取消、加载超时、任务超时、队列上限及 reset 恢复。
- `node node_modules/eslint/bin/eslint.js src/lib/ffmpeg.ts src/lib/ffmpeg.test.ts src/pages/tools/image/generic/compress --max-warnings=0`：退出码 0。
- 这些是模拟 FFmpeg 边界的单元测试，不证明实际 WASM、媒体转码内容或全部浏览器已验收。没有为本次改动重跑全库构建或全库测试。
