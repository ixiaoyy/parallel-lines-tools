# FFmpeg 本地资源与对应源码交付

更新：2026-11-09。任务 `TOOLS-009`。本次仅本地开发，没有公开发布、上传或执行原生 FFmpeg 构建。

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

官方 [FAQ](https://ffmpegwasm.netlify.app/docs/faq/) 区分 wrapper 与 core：wrapper 的 MIT 不能代替 FFmpeg C 核心及外部库的许可。已安装核心由 npm 发布物取得，本轮没有自行编译或变更其字节。

## 已核构建配方

固定提交的 [Dockerfile](https://github.com/ffmpegwasm/ffmpeg.wasm/blob/71aa99d37c02a7b4c435275ca9ef50e612f6efa1/Dockerfile) 使用：

- `emscripten/emsdk:3.1.40`，FFmpeg `n5.1.4`。
- `--enable-gpl`，并启用 x264、x265、libvpx、LAME、Theora、Vorbis、Opus、WebP、FreeType、FriBidi、libass、zimg 等依赖。
- `src/bind`、`src/fftools` 定制源文件，以及 `build/` 下各依赖和核心构建脚本。
- [Makefile](https://github.com/ffmpegwasm/ffmpeg.wasm/blob/71aa99d37c02a7b4c435275ca9ef50e612f6efa1/Makefile) 的 `make prd` 走单线程 `build-st`，生产编译标志为 `-O3 -msimd128`；`prd-mt` 是另一种构建，不能混用。
- [build/ffmpeg-wasm.sh](https://github.com/ffmpegwasm/ffmpeg.wasm/blob/71aa99d37c02a7b4c435275ca9ef50e612f6efa1/build/ffmpeg-wasm.sh) 负责最终 Emscripten 链接和 ES 模块输出。

上述文件已查阅，但没有执行 Docker 构建，也没有验证重新构建产物与 npm 二进制一致。配方中 `x264=4-cores`、`LAME=master` 等仍是可移动分支，不能凭当前分支 HEAD 猜测发布包当时的全部构建输入。

## 用户接受义务后，发布仍需落实的交付项

GPL 不是默认禁用理由。当前可以在本地恢复媒体功能进行开发和样本测试；公开分发核心 WASM 前，发布负责人应配套完成以下材料：

1. 保留 wrapper 的 MIT 版权及核心/链接库各自适用的许可正文与版权通知。不能把整个工具站或 FFmpeg 核心统一标为 MIT。
2. 为实际交付的二进制提供对应源码取得方式。优先与站点发布包共同提供固定版本的源码包、定制补丁、构建/安装脚本及完整依赖来源；不能只给上游主页或 latest 分支。
3. 对移动分支构建输入取得实际使用快照或上游可核查的对应源码材料；若无法确认，就以清楚锁定输入的自建核心替换，并保存该核心真实构建记录，而非假称 npm 包的来源已全部闭合。
4. 站点第三方许可/源码入口和发布档案必须可访问，保留版本与变更说明。许可证要求的源码取得安排应在发布前成立，不由一段界面文案代替。
5. 上述是生产交付待办，当前未生成完整 FFmpeg/codec 对应源码归档，也未执行或验收公开源码下载链接。没有据此宣称已完成生产许可合规验收。

采用共同分发对应源码是本项目的交付建议；具体许可文本与实际构建组合仍需随发布材料核对。本地开发采用上述核心，不意味着可以省略这些交付材料。

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
