# 应用与扩展收录说明

## 当前范围

用户于 2026-11-16 确认保留现有在线工具，扩展桌面应用与浏览器扩展，默认 Chrome 商店；随后要求可从本站下载离线包、教程简单，并按官方最新公开版本查看截图中的扩展，排除 ChatGPT。本轮只在独立工具站本地实现和验证，未提交、推送、上传或部署，不改主站、Chat、网关、真实数据或用户浏览器配置。

- 用途仍是主分类，`format=online|desktop|extension` 是 URL 筛选，默认全部。首页与分类返回保留形式，切换筛选不删除收藏。
- 旧条目缺少 `formats` 时仍为在线工具；`path`、SPA 路由、主站外链、`bookmarkedTools` 存储、人群筛选和旧高级求和等入口保持兼容。
- 平台、费用和来源只显示明确核实的内容。扩展主入口默认 Chrome 商店；只有已声明其他浏览器的平台才显示官网与其他浏览器，Chrome 单平台条目只显示官网。
- 网络代理服务独立为网络工具，不能混作普通文档处理或宣称无权限风险。不内嵌、执行或自动更新第三方扩展，不提供免确认一键安装。

## 已收录条目

核实日期：2026-11-16。版本是本次查看到的官方公开版本，不代表本站持续轮询或永久保持最新；未安装、登录或验证这些第三方产品的实际业务功能，不作安全背书或全网可达性保证。

| 稳定 ID | 内容 | 入口与分发 |
| --- | --- | --- |
| `office/libreoffice` | 桌面文档、表格与演示文稿；Windows/macOS/Linux；免费 | [官方下载](https://www.libreoffice.org/download/) |
| `image-generic/sharex` | Windows 截图、录屏与标注；免费 | [官方下载](https://getsharex.com/downloads)，提醒检查自动上传任务 |
| `office/singlefile` | 网页保存为 HTML；免费；1.37.0 | [Chrome 商店](https://chromewebstore.google.com/detail/singlefile/mpiodijhokgodhhofbcjdecpffjipkle)，已准备本站原包及对应源码/许可 |
| `string/immersive-translate` | 双语网页、PDF 与字幕翻译；部分收费；1.35.2 | [Chrome 商店](https://chromewebstore.google.com/detail/immersive-translate-ai-we/bpoadfkcbjbfhfodiogcnhhhpibjhbnh)，离线包仍为[作者附件](https://github.com/immersive-translate/immersive-translate/releases/download/v1.35.2/chrome-immersive-translate-1.35.2.zip)，未核本站再分发授权 |
| `string/simple-translate` | Sienori 划词/右键翻译；扩展免费；3.1.0 | [Chrome 商店](https://chromewebstore.google.com/detail/simple-translate/ibplnjkanclpjokhdolnendpplpjiace)，作者发行页仅源码归档，不冒充已编译包 |
| `image-generic/gofullpage` | Full Page LLC 整页截图；部分收费；8.11 | [Chrome 正式版](https://chromewebstore.google.com/detail/gofullpage-full-page-scre/fdpohaocaechififmbbbbbknoalclacl)，没有当前原包镜像授权依据 |
| `office/markdown-reader` | Bener Markdown 阅读；部分收费；3.6.33 | [Chrome 商店](https://chromewebstore.google.com/detail/markdown-reader/medapdbncneneejhbgcjceippjlfkmkg)，当前 3.x 不套用旧 2.x MIT 许可 |
| `network/ghelper` | Ghelper 标准版浏览器代理；部分收费；2.9.3 | [Chrome 商店](https://chromewebstore.google.com/detail/ghelper/nonmafimegllfoonjgplbabhmgfanaka)，提示代理与扩展管理权限，不使用旧 2.8.18 ZIP 冒充当前包 |

不按截图推断用户本机精确版本，按作者当前正式入口选择。GoFullPage 使用[2026-09-14 官方正式公告](https://blog.gofullpage.com/2026/09/14/gofullpage-is-back-on-chrome-and-now-available-on-firefox/)的链接，不把 Beta 或 FAQ 中不一致的 ID 当默认。

截图中的 JSON Viewer 以作者 [tulios/json-viewer](https://github.com/tulios/json-viewer) 核对：当前公开 manifest 仍是 `0.18.1`、Manifest V2，未确认可用于新版 Chrome 的正式 MV3 包，因此不以旧包凑数，也未擅自替换成同名作者产品。[Chrome 官方时间表](https://developer.chrome.com/docs/extensions/develop/migrate/mv2-deprecation-timeline)说明 Chrome 139 起不再支持 MV2。ChatGPT 扩展未收录、未下载。

## 本站下载与许可

当前仅 SingleFile 进入 `src/tools/extensionDownloads.json` 的本站分发清单：

| 文件 | 字节数 | 用途 |
| --- | ---: | --- |
| `singlefile-extension-chromium-1.37.0.zip` | 1,633,455 | 官方 Chromium 安装附件的原样副本 |
| `singlefile-corresponding-source-1.37.0.zip` | 2,777,268 | 两份官方 tag 原归档、来源/构建说明与许可 |
| `LICENSE.txt` | 34,523 | 上游 AGPL v3 许可原文 |
| `NOTICE.txt` | 1,746 | 作者、来源、版权/免责及对应源码说明 |

四项位于 `public/downloads/extensions/singlefile/1.37.0/`，构建后以相同路径进入 `dist/`。下载按钮旁直接提供对应源码、许可证和归属说明，不让用户再去 GitHub 才能取源码。

依据为 [SingleFile-MV3 v1.37.0 许可](https://raw.githubusercontent.com/gildas-lormeau/SingleFile-MV3/v1.37.0/LICENSE)及适用文件的第 7 节附加许可。对应源码包含 [SingleFile-MV3 v1.37.0](https://codeload.github.com/gildas-lormeau/SingleFile-MV3/zip/refs/tags/v1.37.0)（265 项，1,727,434 B）和 [single-file-core v1.12.0](https://codeload.github.com/gildas-lormeau/single-file-core/zip/refs/tags/v1.12.0)（262 项，1,117,411 B）。构建脚本、锁文件与第三方告知均保留；未执行上游代码或依赖安装，也未证明重建结果与官方包逐字节一致。

沉浸式翻译的[现行 EULA](https://immersivetranslate.com/en/docs/EULA/)未核实允许本站镜像当前包；Markdown Reader [当前条款](https://md-reader.github.io/terms/)不能用旧仓库 MIT 替代；Simple Translate 虽为 [MPL-2.0](https://raw.githubusercontent.com/sienori/simple-translate/3.1.0/LICENSE)，本次没有作者预编译 Chrome 包；GoFullPage 当前商店版是[私有分支](https://github.com/mrcoles/full-page-screen-capture-chrome-extension)，不套旧仓库 MIT；Ghelper 未找到明确再分发授权。以上不是永久禁止分发的法律结论，其他项目取得明确依据和真实可安装成品后再接入，不抓第三方 CRX 镜像。

## 安装向导

页面只保留三个主要步骤：

1. 下载 ZIP 并解压，记住文件夹位置。
2. 复制 `chrome://extensions`，粘贴到 Chrome 地址栏打开。
3. 开启开发者模式，点击加载已解压的扩展程序，选择刚才的文件夹。

保留必要提醒：只安装信任的扩展、不要删除已加载目录、更新按作者说明操作、离线安装不代表所有功能离线可用。复制失败仍可手动复制地址，关闭重开会重置反馈。技术依据见 [Chrome 本地加载教程](https://developer.chrome.com/docs/extensions/get-started/tutorial/hello-world#load-unpacked)。网站不自动打开内部页、不修改注册表或企业策略、不自动开启开发者模式。

SingleFile 下载不再依赖 GitHub；沉浸式翻译的作者包仍需访问其官方 GitHub，不能宣称所有包均已本站化。翻译内容、页面 URL、远程资源、账号或代理流量的处理边界以各条目提醒及作者政策为准，不把站内处理工具的隐私承诺推广给外部产品。

## 发布、维护与恢复

- `scripts/extension-downloads.ts` 只读取清单声明的四项。缺失、空文件或非普通文件会中止构建；`release-policy.ts` 不放开整个下载目录。`.source-inputs/` 只是未发布的本地来源缓存，已忽略，不暂存或复制到 dist。
- 不需要新生产依赖、数据库迁移或运行配置。源码与第三方分发边界见 `SOURCE-DELIVERY.md`。现有 ZIP MIME/缺失文件 404 规则不变；本次未更改 Nginx 或连接服务器。
- 正式发布仍需按 `DEPLOYMENT.md` 核固定提交、构建产物、来源材料、真实 HTTP 和公网实际下载，且取得本次目标环境授权。本地完成不代表线上已可用。
- 回退只撤本轮目录/UI/原包及配套清单，恢复同版本配套文件，不删用户收藏；不得恢复成孤立二进制或拿旧上游源码替代当前包。已有图片输入、列表排序及其他诊断材料不属于本轮，继续保留。

## 验证记录

先前目录与官方离线引导候选分别通过 49、55 项定向回归，旧在线工具的计算与路由合同继续保留。最终本站下载候选的验证如下：

- `npm run build` 通过，包含 TypeScript 检查、媒体核心既有四项资产校验及最终 Vite 静态构建。构建仍报告既有大块体积及 bcryptjs 的浏览器 crypto 外部化提示，未为本任务修改这些无关功能。
- 6 个 src 定向文件共 58 项通过；新增发布材料读取合同 9 项通过，合计 67 项。首次材料断言因 happy-dom 的 Windows file URL 解析错误误指向 D:\public，已在测试中使用 Node 原生 URL，保留全部真实文件/非空/同版本断言，最终回归通过，未 mock 或删掉材料检查。
- 最终 dist 的下载目录只包含清单的四份文件，没有 `.source-inputs` 或其他未声明附件。通过本机静态预览 GET 四个实际地址，均为 200，ZIP 为 application/zip，许可/归属为 text/plain，正文与 public 和 dist 原文件逐字节一致。安装包根 manifest 为 1.37.0/MV3；对应源码包实含两份上游原归档、README、NOTICE 和 LICENSE。最初 Python 环境代理使回环请求返回 502，改为明确直连本机后检查通过，没有修改系统代理或服务配置。
- 本机 Chrome 已看到六个扩展条目、正确的 Chrome 商店目标，以及三步本站下载向导；桌面和 390px 手机渲染/滚动/关闭入口已实际检查。浏览器下载事件捕获超时并使控制连接重置，恢复预览后没有反复触发下载；未确认浏览器的最终保存路径。实际文件传输证据采用上面的完整 HTTP GET，不把失败的事件捕获当成下载完成或扩展安装成功。
- 截图：`C:\Users\phpxi\.codex\visualizations\2026\11\16\01a1e327-dbe5-7fe2-8bdf-5916ebe5553f\tool-selfhost-install.jpg`，同目录 `tool-selfhost-install-mobile.jpg`。复制成功/失败通过隔离模拟测试验证，未覆盖用户真实剪贴板。
- `git diff --cached --check` 通过。代码、语言词条和四份分发材料已暂存；测试、文档和截图未自动暂存。本次没有提交、推送、上传、安装扩展或部署；React Doctor 沿用本环境未安装的结论，未为检查自行安装工具。

上述是当前工作区的本地构建/测试/HTTP 证据，不是干净提交的正式发布包或生产验收。发布负责人仍需按本次目标授权核范围、Nginx 实际 HTTP、公网文件与浏览器保存结果；本站 SingleFile 下载上线前不能宣称已对公网开放。
