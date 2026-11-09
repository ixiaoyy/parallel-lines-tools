# 许可证与来源审计

时间：2026-11-09。本报告记录实际文件和采用边界，不构成法律授权。当前已进入本地定制实现，不能将其所有依赖统一视为 MIT。

用户已明确接受按 GPL/AGPL 等适用许可提供相关源码。GPL/AGPL/LGPL 本身不构成功能禁用依据；此前按许可类别扩大隔离的本地方案已撤回，23 项媒体/HEIC 能力恢复。实际未准备好的运行资源和对应源码材料另列，不将工程未完成解释为许可禁止。

## 已检查来源

| 来源 | 固定提交 | 查到的许可 | 本次使用 |
|---|---|---|---|
| OmniTools | `9244e02923d99cde143ddd5b8d761d9ed0997da4` | 根 MIT | 本地克隆/构建/测试，保留原 LICENSE；未发布 |
| markdown-docx | `acc2bcb36c3cab1b01281033425b5b2308b36f36` | 根 MIT；npm 版本 1.7.1 | 已精确锁定 npm 1.7.1，并核安装包 LICENSE；marked 15.0.12 也为直接依赖 |
| Squoosh | `e8d35e0fb66eb16eff6fe8fc773eabcbb7128de3` | 根 Apache-2.0，多个 codec 有独立 LICENSE.codec.md | 仅审计，无代码或 codec 集成 |
| DoxDock | `f584cb973605282c4069e010e925dba220e35b00` | 根 MIT | 阅读排序、文本提取、图片压缩 helper，未移植 |
| PDFSlice | `09c7ff90e01c18b48442d0c28e65f4c044107f46` | 根 MIT；不覆盖所有引擎义务 | 阅读 pdfTools/toolsData，未移植引擎 |
| Whisper Web | `d8afd24b55b691570e23d92451d44ccb3d911be1` | API 许可为 null；所查树无许可文件 | 禁止复制或假定 MIT；无模型下载 |
| ConvertX | `7c6c8f16e517dcc76a8881fa3bafc2a67ed77826` | AGPL-3.0 | 仅审计，不启动服务 |
| Stirling-PDF | `d74543712c8214548b823859c8dba4cf2e52a875` | 根 MIT 有目录例外；engine 另有用户许可 | 仅审计，未获生产使用授权，不接入 |

快照含完整根 LICENSE 和抽样代码，仅为可核对的证据，位于 `evidence/sources/`，不进入静态站 public/dist。采用任何来源时仍需随产物提供实际复用部分的版权/许可/NOTICE，而非只链接此表。

## 上游自带的重点风险

1. `@imgly/background-removal@1.7.0` 的 package.json 是 `SEE LICENSE IN LICENSE.md`，实际 LICENSE.md 为 AGPL v3，可以按许可使用。用户已接受源码义务；其模型资源尚未自托管，所以仍属资源未就绪，不再以非 MIT 为由隔离。
2. `src/lib/ghostscript/gs-worker.js` 指向 `https://cdn-wasm.b-cdn.net/gs-worker.wasm`。实际二进制的来源版本、构建配置和对应源码未锁定。`public/gs.js` 是模拟占位，不能证明 PDF 压缩/加密已经可靠完成。
3. M0 发现 `src/lib/ffmpeg.ts` 请求 unpkg core 0.12.6，与 npm 锁定依赖不一致；本候选已改为安装包 `@ffmpeg/core@0.12.10` 的本站 JS/WASM。core 为 GPL-2.0-or-later，wrapper 为 MIT，不能相互替代许可说明。完整对应源码构建输入仍待闭合，详见 `ffmpeg-source-obligations.md`。
4. OCR、背景模型、编辑器和字体的自托管/传递依赖义务不能只用 npm 包的顶层 LICENSE 代替，需沿实际资产路径检查。
5. `evidence/baseline-sbom.json` 是 `npm sbom --sbom-format cyclonedx --omit=dev` 的结果，包含 508 个组件，出现 GPL/LGPL/OFL 等许可证。SBOM 不能直接判定兼容性，缺 license 字段的组件也不能自动当 MIT。

## 发布前仍需完成

- 形成实际发布工具及资源白名单，未清楚来源或义务的工具/资产不打入产物；保留可核查的未开放说明。
- 明确 AGPL/GPL/LGPL 组件的实际复用范围和对应源码/分发义务，按用户已接受的策略准备材料，不按非 MIT 类别删功能。资源未就绪条目同时从注册和产物图排除，但保留源码与旧路径说明。
- 记录新依赖的版本、传递依赖、许可证、体积、浏览器支持及升级来源。首轮不引入 Squoosh 旧 lib、不复制 Whisper 或 Stirling 受限代码。
- 保留原作者版权、附适用 NOTICE、说明定制修改；不擅自删除上游归属。

构建守卫同时检查主程序与 Worker 模块图，生成实际 `release-components.json` 与 `THIRD_PARTY_NOTICES.txt`。图标源码和版权/许可正文在 `licenses/icons/`；部分 npm 发布物遗漏的许可正文按固定来源补入 `licenses/vendor/`。tiny-case 的作者 MIT 声明保留原元数据，没有虚构版权年份。

前端修改版源码通过公开 Git 仓库 `https://github.com/ixiaoyy/parallel-lines-tools` 交付，新候选不再额外打包或站内分发应用源码 ZIP。第三方 `vendor-sources/heic/` 原包与许可、`media-core-pl.1` 的原生对应源码及构建材料原样保留；应用仓库不能代替媒体二进制的完整对应源码。取得方式与边界见 `SOURCE-DELIVERY.md`，不能只提供根 LICENSE 或原版上游链接。

初次本地审计时未创建远端 Fork、没有 commit/PR，也没有公开修改版服务；以上风险和待办保留其调查时语境。后续已授权的公开仓库、原生对应源码 Release 与生产结果另见 `deployment-status.md`。本次应用 ZIP 退役和普通使用界面清理不因此被记为已经上线。
