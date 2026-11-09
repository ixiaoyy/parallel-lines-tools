# 平行线工具箱本地开发验收

日期：2026-11-09。本文记录中文工具箱及本轮两个重点工具的本地验收及后续生产补记；不将重点样本通过扩展为所有原生工具均可用。后续已获独立部署授权并完成公开仓库、独立生产部署和线上重点验收，真实结果另见 `deployment-status.md`，不以本地证据代替线上验收。

## 打开与使用

- 本地工具箱：`http://127.0.0.1:5178/`。
- Markdown 转 Word：`http://127.0.0.1:5178/converters/markdown-to-docx`。
- 图片压缩：`http://127.0.0.1:5178/image-generic/compress`。
- 延期条目说明：`http://127.0.0.1:5178/deferred-tools`。
- 前端修改版源码通过公开 Git 仓库 `https://github.com/ixiaoyy/parallel-lines-tools` 交付；新候选不再额外打包或站内分发应用源码 ZIP，第三方 vendor 和 `media-core-pl.1` 对应源码原样保留。本次界面清理的发布状态尚未在本文记为上线。

预览只监听本机。若预览进程结束，从仓库根执行：

```powershell
node node_modules/vite/bin/vite.js preview --host 127.0.0.1 --port 5178 --strictPort
```

先核端口归属，不终止其他服务。源码开发仍可用 `npm run dev`；生产构建是 `npm run build`，执行类型检查与静态构建，不再生成额外应用源码 ZIP。

## 本轮行为

| 范围 | 当前实现及保留项 |
|---|---|
| 汉化 | 中文默认，恢复用户原语言选择，英文保留；现有搜索、分类、收藏和深链接继续使用。语言键缺失为 0，404 处示例标题/说明接线，样本正文、结果、选项和初始参数经 AST 对比保持不变。Monaco 官方中文菜单已实际检查，切换语言后提醒先保存再刷新，不自动刷新丢输入 |
| Markdown→Word | 文件/粘贴、近似预览、字体设置、DOCX 下载、取消与 30 秒超时。标题、列表、表格、代码、引用、链接、常见原生公式和中文样本经真实文件检查；图片/HTML 明确不导入，不隐式外链取图。阅读端字体/分页不承诺完全一致 |
| 图片压缩 | 沿用通用压缩入口，PNG 专用工具保留。JPEG/PNG/WebP、质量、最长边、目标大小、前后预览、逐件下载、重名安全 ZIP；批次/像素/字节/时间上限及串行执行，取消/重置/离页释放资源，新输入/设置废弃旧下载。保留 JPEG EXIF 并提示可能含拍摄位置，不充当脱敏工具；AVIF/动画不开放 |
| 第三方资源 | Navbar 外站 iframe/推广删除，图标离线打包，字体使用系统栈，Monaco 和 FFmpeg JS/WASM 同源。CSP 不放行外站资源，保留本地/blob PDF 预览；不影响主站、Chat 或 OIDC 响应头 |
| 许可 | 用户接受适用 GPL/AGPL 源码义务；非 MIT 不构成禁用依据。已撤回过宽隔离并恢复 23 项媒体/HEIC 注册。许可清单覆盖主图和独立 Worker 图；保留原始版权、补齐图标及缺失包的许可材料 |
| 源码 | 公开 Git 仓库交付修改版前端、锁文件、构建脚本、必要类型与资源；当前构建不额外生成或站内分发应用源码 ZIP。第三方 vendor 材料和媒体核心原生对应源码保留，应用仓库不替代 FFmpeg/codec 完整对应源码 |

## 早期候选的实际验证

下表保留应用 ZIP 链退役前的实际结果与数值；源码生成、下载及解包重建仅为当时的历史验收，不表示当前构建仍产生或分发应用 ZIP。

| 检查 | 结果与范围 | 证据 |
|---|---|---|
| 最终类型/构建/源码生成 | `npm run build` 退出 0；最后只修正手机装饰图占屏和诊断目录忽略规则，再完整构建退出 0 | `evidence/candidate-build-final.log`、`candidate-build-mobile-final.log` |
| 单元测试 | 全量 82 文件、742 项通过；此后新增官方 Monaco NLS 7 项定向测试通过。后续示例显示键/样式不改服务数据，未做无关全量重跑 | `evidence/candidate-unit.log`；NLS 7 项由执行代理回执记录，测试源码为 `src/lib/monaco-nls.test.ts`，未另存该次日志 |
| 原有浏览器回归 | 系统 Chrome 的原有 6 项通过：PNG 尺寸/大小预算/ZIP、JPG→PNG 与透明度、文本拼接；显式英文夹具，不牺牲新的中文默认去迁就原测试 | `evidence/candidate-upstream-browser.log` |
| 重点浏览器流程 | 6 项通过：中文默认/搜索/刷新/英文；真实 DOCX 解包与表格/公式；WebP 解码和 128×64 尺寸；JPEG/PNG 重新解码；ZIP 两个同名文件保全；错误/过期下载；本地代码编辑器、PDF Blob 和实际 WASM 音频 | `evidence/candidate-browser.log` |
| 真实 EXIF/取消 | 合成非敏感 EXIF 描述在真实 JPEG 输出保留且图片可解码；20 张批次实际取消后无图片/ZIP 结果，1 项通过 | `evidence/candidate-exif-cancel.log` |
| 最终集成 | 126 个活动路径全部 HTTP 200 并显示对应中文主标题；Monaco 中文/英文菜单与保存后刷新提示；Worker 许可和源码下载检查，共 3 项通过。路径打开不等于所有工具文件正确性验收 | `evidence/candidate-browser-final.log`、`candidate-route-smoke.json` |
| 实际视觉 | 桌面 1280、手机宽 375 截图已观察，无横向溢出；修复链接下载按钮悬停文字对比，手机不再用装饰图挤占首屏，最终定向检查通过 | `evidence/final-markdown-desktop.png`、`final-markdown-mobile.png`、`monaco-chinese.png`、`candidate-mobile-visual.log` |
| Word 渲染 | 真实 DOCX 通过独立隐藏 Word 只读打开、PDF/PNG 渲染观察；中文、列表、表格、代码和可编辑公式可见。修复空分隔段多余分页后为 1 页、11,370 字节。标准 renderer 因机器缺 soffice 的失败保留，未冒充通过 | 新工具 `fixtures/render-report.json`、`final-page-1.png` |
| 请求边界 | 上述重点文件处理和最终页面检查记录中无外站请求、无 POST 等非只读请求、无 pageerror。仅代表这些样本/路径，不代表未开放能力或所有恶意输入已完成安全审计 | `evidence/network-*.json`、`final-network-*.json` |
| 源码重建 | 一次无 `.git` 的解包源码重建完整通过；复用同锁文件的现有 node_modules 目录链接，没有伪称新机器干净下载验收。之后仅有手机装饰布局与忽略规则变化，根目录最终构建/源码检查通过 | `evidence/source-rebuild.log` |
| ESLint | 退出 1：179 errors、27 warnings；与原版 184 errors、27 warnings 按文件/规则/消息/次数比对，无新增。没有关闭规则或清理无关旧代码来改变口径 | `evidence/candidate-lint.json`、`lint-delta.json` |

React Doctor 未安装，本轮未为满足技能擅自安装；使用实际类型、单元、浏览器和现有 ESLint 检查。Edge、Firefox、Safari、真实 Android/iOS 设备未单独验收，375px 是 Chrome 布局检查。

构建仍有大分块提示。入口静态字节/gzip/Brotli 大小见 `evidence/entry-size.json`，只是本机编码测量，不代表线上压缩配置或用户首屏时间。重型编辑器与媒体资源延迟加载，没有据此承诺任何固定内存或速度提升。

## 范围边界与保留缺口

1. **7 项引擎/资源未准备好**：OCR、背景移除、PDF 压缩/保护、PDF 高级编辑/表单、复杂图片编辑。旧路径说明保留，实际引擎不打入当前产物。负责人为本项目后续开发者；准备自托管资源、版本来源并验证后恢复。这是工程状态，不是开源许可禁止。
2. **公开分发前的引擎源码交付**：历史 npm 核心的官方配方含移动输入，当前选用全输入锁定的新自建核心。已完成完整源码导出、实际H264/MP3/AAC/WAV检查和media-core-pl.1共同Release，media-core.lock.json已锁定真实二进制。其状态不再是发布阻断；实际结果见 `deployment-status.md`，本地开发和已通过的旧核心转码不因此被叫作禁用，也不作为新核心证据。
3. **原生工具并非全量文件验收**：已知上游 `create-transparent` 会填不透明背景色，和透明 PNG 说明矛盾；本轮不改其像素逻辑，不把它算功能通过。所有 133 项的真实格式、恶意文件、完整业务结果均未逐项验收。负责人为后续原生工具质量任务。
4. **主站收录和部署**：用户已确认独立生产域名 `tools.pingxingxian.space` 和现有主站服务器；DNS/HTTP01 与独立证书签发通过。工具应用已由正式site-ee61062完整SHA产物独立部署，实际HTTP/TLS、缓存、许可/源码、续期消费者与独立健康通过；线上三个真实文件流程及无第三方请求通过。恢复入口/备份实际保存，未生产故障演练。未新增主站卡片，不替换 `/tools` 收录页或发布主站 Web。

不将这些缺口改名为完成：M0 审计和本轮本地重点实现已有证据，本次独立生产发布已完成，G1 的全原生工具质量仍未全部满足；M3/M4/M5 没有启动。

## 文件、恢复和外部副作用

代码和必要测试/文档已分批提交推送至公开 `ixiaoyy/parallel-lines-tools`。主站运维分支已推送只读检查和独立 TLS 流程，已通过既有 Secrets 正常认证连接现有生产服务器；没有检索或输出秘密值或查询业务库；已新增工具独立容器、证书/cron及唯一子域代理，并只reload网关。未重建网关，主站/Chat/OIDC/API公开健康入口均通过。持续状态以 `deployment-status.md` 为准，诊断和渲染产物没有自动提交。

上游基线保留于 `upstream-base.json`，原始源码仍在本地 Git 历史；不使用整仓库 reset/restore 撤销混合改动。运行资源延期表与相应注册/构建策略必须同步恢复，不能只加卡片不准备依赖。预览停止仅影响本地服务，不是生产回滚。

诊断源码解包目录在 `docs/evidence/source-rebuild-20261109`，已忽略；其中 node_modules 是指向原项目依赖的目录链接。清理时不得跟随该链接递归删除原项目依赖，本轮未执行这种清理。

## 后续生产验收补记

历史正式site CI42570812688通过当时的干净源码ZIP重建、真实Nginx HTTP/MIME/cache及3项文件浏览器检查；生产42573761415与独立health42574100132通过。线上Chrome同3项真实DOCX/图片ZIP/WAV用例全部通过，网络样本无外站请求、非GET/HEAD请求或pageerror；1280/375px截图已观察。Cloudflare自动统计注入曾造成首轮隐私断言失败，工具子域no-transform修复后原断言完整通过，没有删除检查或扩大CSP放行。当次实际应用SHA为ee61062ee39cb31189e365660e1fa2cca5009d88，主站main持久代理提交60e862d9。此回执不表示当前仍生成应用源码 ZIP，也不代表本次界面清理已上线。站点地址：https://tools.pingxingxian.space/ 。后续真实状态见deployment-status.md及其证据索引。
