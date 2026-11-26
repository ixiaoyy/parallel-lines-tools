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

## AI 创作外链

首批三项核实于 2026-11-25；音乐、3D 建模和人声增强三项核实于 2026-11-26。六项均归入「AI 创作 → 在线工具」。卡片新标签打开官方入口；本站不接收提示词或素材、不调用生成接口，不代登录或计费。

| 稳定 ID | 用途 | 官方入口 |
| --- | --- | --- |
| `ai-creative/jimeng` | 封面、角色图与插画；支持局部重绘及扩图 | [即梦 AI](https://jimeng.jianying.com/ai-tool/tools) |
| `ai-creative/kling` | 文生视频、图生视频，适合动态分镜或预告片段 | [可灵 AI 中文站](https://klingai.kuaishou.com/)（[快手官方入口说明](https://ir.kuaishou.com/zh-hans/news-releases/news-release-details/kuaishoukelingaixiangquanqiuyonghuquanmiankaifangneice)） |
| `ai-creative/biling-novel` | 中文小说大纲、人设与章节续写 | [笔灵 AI 小说工作台](https://ibiling.cn/novel-workbench) |
| `ai-creative/haimian-music` | 用文字或歌词生成歌曲；公开发布或商用前看官方条款 | [海绵音乐](https://www.haimian.com/)（[官方功能说明](https://www.haimian.com/about)） |
| `ai-creative/hunyuan-3d` | 用文字或图片生成 3D 模型，适合做游戏道具原型 | [腾讯混元 3D](https://3d.hunyuan.tencent.com/)（[腾讯官方介绍](https://developer.cloud.tencent.com/article/2493300)） |
| `ai-creative/adobe-enhance-speech` | 降低录音噪声和回声；录音需上传到 Adobe | [Adobe Podcast 人声增强](https://podcast.adobe.com/en/enhance)（[官方功能与方案](https://podcast.adobe.com/en/plans)） |

参考流程：笔灵写人物小传 → 即梦做角色图 → 可灵把角色图做成短镜头。需要配乐小样时可另用海绵音乐；已有旁白录音可用 Adobe Podcast 做清理。各站相互独立，素材由用户自行转移；登录、额度、费用与数据处理以各自官方页面为准。未登录、上传素材或实测生成和音频处理。ComfyUI 不在首批收录范围内。

## 日常工具外链

核实日期：2026-11-26。沿用现有用途分类和使用形式筛选；在线工具打开官方编辑器，桌面应用打开官方下载页。本站不嵌入工具、不接收素材、不分发安装包。

| 稳定 ID | 分类与用途 | 官方入口 |
| --- | --- | --- |
| `office/excalidraw` | 办公 · 在线；手绘风流程图、白板草图。草稿自动保存在浏览器，可导出可编辑文件。 | [在线白板](https://excalidraw.com/)（[官方功能说明](https://github.com/excalidraw/excalidraw#features)） |
| `image-generic/photopea` | 图片 · 在线；打开和保存 PSD，支持图层、蒙版和混合模式。 | [在线编辑器](https://www.photopea.com/)（[官方文件读写说明](https://www.photopea.com/learn/opening-saving)） |
| `network/localsend` | 网络 · 桌面；同一局域网内互传文件。收发设备都需安装；目录平台栏列 Windows、macOS、Linux，下载页另提供 Android、iOS 版。 | [官方下载](https://localsend.org/download) |

### 2026-11-26 常用工具补充

这 15 项补充录音转写、自动抠图、扫描件文字识别、桌面编辑与浏览器会话管理。只收录官方入口；通义听悟与 remove.bg 在第三方服务处理素材，扩展默认前往 Chrome 商店，不提供本站安装包。

| 稳定 ID | 形式与用途 | 官方入口 |
| --- | --- | --- |
| `ai-creative/tingwu` | 在线；录音转写、会议纪要 | [通义听悟](https://tingwu.aliyun.com/) |
| `ai-creative/remove-bg` | 在线；人像与商品图抠图 | [remove.bg](https://www.remove.bg/zh) |
| `office/markmap` | 在线；Markdown 大纲转思维导图 | [Markmap 编辑器](https://markmap.js.org/editor) |
| `string/regex101` | 在线；正则匹配、捕获组与语法解释 | [regex101](https://regex101.com/) |
| `image-generic/svgomg` | 在线；SVG 压缩与预览 | [SVGOMG](https://jakearchibald.github.io/svgomg/) |
| `image-generic/webaim-contrast-checker` | 在线；检查文字与背景对比度 | [WebAIM 对比度检查](https://webaim.org/resources/contrastchecker/) |
| `pdf/pdf24-creator` | Windows；识别扫描件文字、整理 PDF 页序 | [PDF24 Creator](https://tools.pdf24.org/zh/creator) |
| `office/obsidian` | 桌面；本地 Markdown 笔记，官方同步和发布另收费 | [Obsidian](https://obsidian.md/download) |
| `office/7-zip` | 桌面；压缩解压，平台栏列 Windows 图形版 | [7-Zip](https://www.7-zip.org/download.html) |
| `office/powertoys` | Windows；批量改名、窗口布局 | [PowerToys](https://learn.microsoft.com/windows/powertoys/install) |
| `image-generic/inkscape` | 桌面；SVG 矢量绘图 | [Inkscape](https://inkscape.org/release/) |
| `video/kdenlive` | 桌面；多轨视频剪辑 | [Kdenlive](https://kdenlive.org/download/) |
| `audio/audacity` | 桌面；录音、混音与降噪 | [Audacity](https://www.audacityteam.org/download/) |
| `office/dark-reader` | 扩展；网页深色模式，提示网站访问权限及 Safari 收费 | [Chrome 商店](https://chromewebstore.google.com/detail/dark-reader/eimadpbcbfnmbkopoojfekhnkhdbieeh) |
| `office/tab-session-manager` | 扩展；标签页恢复，提示开启云同步后将保存的链接写入 Google 云端硬盘 | [Chrome 商店](https://chromewebstore.google.com/detail/tab-session-manager/iaiomicjabeggjcfkbimgmglanimpnae) |

### 2026-11-26 扩充收录

核实日期：2026-11-26。覆盖流程图/图表、图片压缩、API 接口调试、网络测速、录屏与音视频处理、3D 建模、本地搜索、密码管理、PDF/电子书及三款 MV3/跨浏览器扩展；所有条目仅链接官网、官方下载页或 Chrome 商店，不提供本站安装包。

| 稳定 ID | 分类与形式 | 官方入口 |
| --- | --- | --- |
| `office/drawio` | 办公 · 在线；流程图、架构图与 UML 框图 | [draw.io](https://app.diagrams.net/) |
| `office/mermaid-live` | 办公 · 在线；文本语法绘制流程图、时序图与甘特图 | [Mermaid Live Editor](https://mermaid.live/) |
| `image-generic/squoosh` | 图片 · 在线；浏览器本地图片压缩与画质对比 | [Squoosh](https://squoosh.app/) |
| `network/hoppscotch` | 网络 · 在线；开源 REST / GraphQL / WebSocket 接口调试 | [Hoppscotch](https://hoppscotch.io/) |
| `network/cloudflare-speed` | 网络 · 在线；下载/上传速度、延迟与抖动测试 | [Cloudflare 测速](https://speed.cloudflare.com/) |
| `video/obs-studio` | 视频 · 桌面；免费开源录屏与直播推流（Win/macOS/Linux） | [官方下载](https://obsproject.com/download) |
| `video/vlc` | 视频（兼音频）· 桌面；免费开源全格式本地播放器（Win/macOS/Linux） | [官方下载](https://www.videolan.org/vlc/) |
| `video/handbrake` | 视频 · 桌面；免费开源视频转码与压缩（Win/macOS/Linux） | [官方下载](https://handbrake.fr/downloads.php) |
| `image-generic/blender` | 图片 · 桌面；免费开源 3D 建模、渲染与动画（Win/macOS/Linux） | [官方下载](https://www.blender.org/download/) |
| `office/everything` | 办公 · 桌面；Windows NTFS 极速本地文件名搜索 | [官方下载](https://www.voidtools.com/downloads/) |
| `office/keepassxc` | 办公 · 桌面；免费开源本地加密密码库（Win/macOS/Linux） | [官方下载](https://keepassxc.org/download/) |
| `pdf/sumatrapdf` | PDF · 桌面；Windows 轻量极速 PDF/EPUB/漫画阅读器 | [官方下载](https://www.sumatrapdfreader.org/download-free-pdf-viewer) |
| `office/calibre` | 办公 · 桌面；免费开源电子书管理与格式转换（Win/macOS/Linux） | [官方下载](https://calibre-ebook.com/download) |
| `network/ublock-origin-lite` | 网络 · 扩展；MV3 轻量广告与追踪器过滤；免费 | [Chrome 商店](https://chromewebstore.google.com/detail/ublock-origin-lite/ddkjiahejlhfcafbddmgiahcphecmpfh) |
| `office/bitwarden` | 安全与隐私 · 扩展；开源密码管理器自动填充；部分收费 | [Chrome 商店](https://chromewebstore.google.com/detail/bitwarden-password-manage/nngceckbapebfimnlniiiahkandclblb) |
| `office/vimium` | 开发与调试（兼办公）· 扩展；Vim 风格纯键盘浏览网页；免费 | [Chrome 商店](https://chromewebstore.google.com/detail/vimium/dbepggeogbaibhgnhhndojpepiihcmeb) |

### 2026-11-26 新增六大用途分类与扩充收录

核实日期：2026-11-26。新增「系统效率（`system`）」「设计与配色（`design`）」「安全与隐私（`security`）」「学习与阅读（`learning`）」「开发与调试（`developer`）」「生活与实用（`life`）」六个用途分类；已有相关条目保留原稳定 `path` 收藏 ID，仅调整主分类或补充兼属分类，并新收录 20 款工具：

| 稳定 ID | 分类与形式 | 官方入口 |
| --- | --- | --- |
| `system/wiztree` | 系统效率 · 桌面；Windows NTFS 极速磁盘空间分析 | [官方下载](https://diskanalyzer.com/download) |
| `system/ventoy` | 系统效率 · 桌面；免费开源多系统启动 U 盘制作（Win/Linux） | [官方下载](https://www.ventoy.net/en/download.html) |
| `system/copyq` | 系统效率 · 桌面；免费开源跨平台剪贴板历史管理（Win/macOS/Linux） | [官方主页](https://hluk.github.io/CopyQ/) |
| `design/coolors` | 设计与配色 · 在线；配色方案生成器与色板导出 | [Coolors](https://coolors.co/) |
| `design/google-fonts` | 设计与配色 · 在线；免费开源字体与 Material 图标库 | [Google Fonts](https://fonts.google.com/) |
| `design/iconify` | 设计与配色 · 在线；20 万+ 开源矢量图标搜索与 SVG 复制 | [Iconify](https://icon-sets.iconify.design/) |
| `design/figma` | 设计与配色 · 在线；界面设计与交互原型协作 | [Figma](https://www.figma.com/) |
| `security/virustotal` | 安全与隐私 · 在线；多引擎文件哈希与可疑链接安全检测 | [VirusTotal](https://www.virustotal.com/) |
| `security/ente-auth` | 安全与隐私 · 桌面；免费开源端到端加密两步验证 2FA 应用 | [官方下载](https://ente.io/auth/) |
| `security/veracrypt` | 安全与隐私 · 桌面；免费开源本地磁盘与加密容器软件 | [官方下载](https://veracrypt.fr/en/Downloads.html) |
| `learning/anki` | 学习与阅读 · 桌面；开源间隔重复记忆卡片软件 | [官方下载](https://apps.ankiweb.net/) |
| `learning/zotero` | 学习与阅读 · 桌面；免费开源学术文献与论文引用管理 | [官方下载](https://www.zotero.org/download/) |
| `learning/desmos` | 学习与阅读 · 在线；免费交互式函数图形计算器 | [Desmos](https://www.desmos.com/calculator) |
| `developer/vscode` | 开发与调试 · 桌面；微软免费跨平台代码编辑器 | [官方下载](https://code.visualstudio.com/download) |
| `developer/transform-tools` | 开发与调试（兼转换）· 在线；JSON/TS/Go/SVG/JSX 等代码格式互转 | [Transform](https://transform.tools/) |
| `developer/caniuse` | 开发与调试 · 在线；前端特性浏览器兼容性查询 | [Can I use](https://caniuse.com/) |
| `life/pomofocus` | 生活与实用 · 在线；在线番茄工作法专注计时器 | [Pomofocus](https://pomofocus.io/) |
| `life/windy` | 生活与实用 · 在线；全球实时风场、台风路径与气象雷达图 | [Windy](https://www.windy.com/) |
| `life/timeanddate` | 生活与实用（兼时间）· 在线；全球城市实时世界时钟与时差查询 | [timeanddate](https://www.timeanddate.com/worldclock/) |
| `life/asoftmurmur` | 生活与实用 · 在线；雨声、海浪与咖啡馆环境白噪音混音器 | [A Soft Murmur](https://asoftmurmur.com/) |

合并后第三方目录为 68 项（31 个在线工具、26 个桌面应用、11 个浏览器扩展），按稳定 ID 去重，不把兼属分类计为新条目。首页按用途展示当前筛选的分类和每类数量；桌面应用和浏览器扩展可从精选或收藏切到该形式的全部匹配条目，再返回原视图。展开不修改网址筛选或收藏，图标继续从站内加载。

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
