# 工具箱源码与第三方源码边界

更新：2026-11-09。修改版代码位于 https://github.com/ixiaoyy/parallel-lines-tools 。按本次要求取消额外应用源码 ZIP 的生成及站内分发；源码仓库、第三方对应源码和实际站点仍分别验收，公开代码不代表站点已经部署。

## 工具箱与媒体引擎的交付边界

修改版应用源码、npm 锁文件、构建配置、必要脚本与图标许可材料保留在本仓库。已精确锁定 `markdown-docx@1.7.1` 与 `marked@15.0.12`，当前锁文件不是未修改的上游原件；原版 OmniTools 主页也不能代替修改版仓库。

取消的是额外应用源码 ZIP，**不取消 FFmpeg 核心及 codec 的完整原生对应源码交付**。正式版本用 `media-core.lock.json` 选择实际自建核心：其二进制、完整原生源码 tar.gz、构建输入和已通过的媒体测试回执仍须共同保留在对应 Release，并保留必要的源码取得入口。应用仓库或原作者主页不能替代该原生源码包；详细材料见 `ffmpeg-source-obligations.md`。

在尚未选定自建锁的历史 bootstrap 本地版本中，原 npm core 0.12.10 仅供开发；正式站点 workflow 要求已通过回执和已提交锁，不能因下载/校验失败回退到旧二进制。核心自身的 CI 可显式使用刚编译的目录做测试，但不将待验证产物标成生产版本。

HEIC 的来源已可核定，无需因此停用或重建。三份原始源码包、许可与构建/修改重链说明继续保存在仓库 `vendor-sources/heic/`，不因应用 ZIP 退役而删除。镜像总原包约9.4MB，保留锁定的原始字节；普通 Node 构建不需要 Python 或重新抓取这些源码，发布 CI 仍核对已提交镜像的来源身份。见 `HEIC-SOURCE.md`。

## 应用构建与发布

`scripts/package-source.mjs` 已退役。`npm run build` 只执行现有 TypeScript/Vite 构建，不再生成 `dist/toolbox-source-local-20261109.zip` 或 `SOURCE-MANIFEST.json`；正式静态打包遇到 `dist` 中残留的 `toolbox-source*.zip` 会明确拒绝，不能把旧包重新分发。历史已发布资产、旧镜像及既有原生源码资料不在本次删除范围。

取得本仓库的目标提交后，在独立目录使用 Node 22 和 npm 10，按当前修改版锁文件安装：

```powershell
npm ci --ignore-scripts --no-audit --no-fund
npm run build
```

安装需要取得锁文件中的 npm 发布物；首次构建还需取得锁定 Release 的 JS/WASM/回执，不是完全离线构建流程。`--ignore-scripts` 避免安装提交钩子。`npm run build` 的 prebuild 在存在自建锁时自动校验/取得对应核心，实际 JS/WASM 来源与回执不一致会停止；没有旧二进制兜底。当前 Vite 通过 `upstream-base.json` 取得候选版本标识，不要求目录包含 `.git`。

四个运行资产现按该公开 Release 的真实资产 ID 锁定为同仓 `api.github.com/repos/ixiaoyy/parallel-lines-tools/releases/assets/整数ID`，匿名 `GET` 明确带 `Accept: application/octet-stream`，不使用 token。旧锁中的 canonical Release 下载链接仍兼容，但不会在失败后自动切换地址、镜像或旧二进制。此次仅更换传输入口，文件名、大小、SHA256、原生对应源码 URL/身份均不变；已按同一 hash/字节验证的本地缓存继续复用，不重编媒体核心。

已有 `HTTP_PROXY`/`HTTPS_PROXY` 的网络环境，可在 Node 22.21+ 设置 `NODE_USE_ENV_PROXY=1`，让 Node 内建 fetch 沿用现有代理；不需要把代理地址或凭据写进源码。正式 CI 使用该开关。下载保留 30 秒首响应/空闲、单次 180 秒、全程 8 分钟上限，瞬时网络/504 等最多重试一次，完整性不符不重试；错误明确指出资产名。单元测试不使用生产二进制，不因选定发行锁而新增下载 WASM 的前置。

构建产物是 `dist` 静态目录。仅本机预览可以执行：

```powershell
node node_modules/vite/bin/vite.js preview --host 127.0.0.1 --port 5178 --strictPort
```

再次发布仍须对最终应用执行构建、静态 HTTP/许可/核心回执检查并生成部署 bundle 与 receipt。本次 UI-only 调整复用未变化工具逻辑和媒体核心的有效验收证据，不再为已退役的应用 ZIP 做解压重建或重复运行三项文件/媒体浏览器检查；真实站点发布结果另由负责人记录。

## 图标来源

`src/assets/local-icons.json` 是随站点打包的图标几何数据和别名，未以运行时 API 加载图标。`licenses/icons/manifest.json` 针对实际 28 个图标集记录所采用图标、原作者、固定 Iconify 提交、许可及对应文本来源。

可取得的原始 LICENSE 以其仓库提交锁定保存；标准许可文本来自 SPDX 官方许可文本仓库的固定提交。许可正文未改写，仅规范化行尾与尾部空白，不补造版权年份。使用标准文本时，作者归属另由已锁定的 Iconify 元数据提供，不把标准模板中的占位符冒充某个作者的原始版权声明。

图标的 CC BY / CC BY-SA 等义务应随几何源数据和发行归属一并保留，不能只保留 React 组件包的许可。若清单记录某个具体图标的权利材料仍不能确认，应替换该图标，而不是关闭与它无关的工具功能。
