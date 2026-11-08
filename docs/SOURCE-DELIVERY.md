# 定制工具箱源码交付

更新：2026-11-09。当前只在本地准备源码归档，没有公开发布、远程上传、commit 或 push。

## 工具箱与媒体引擎的交付边界

`dist/toolbox-source-local-20261109.zip` 是当前修改版工具箱应用的源码快照，包含 React/TypeScript 源码、当前修改版 npm 锁文件、构建配置、必要脚本、允许发布的 public 资源、图标源数据与许可材料。已新增并精确锁定 `markdown-docx@1.7.1` 与 `marked@15.0.12`，不再把当前锁文件称为未修改的上游原件。它与原版 OmniTools 的上游链接不同，不能用原版主页替代这份修改版源码。

此 ZIP **不包含 FFmpeg 核心及 codec 的完整对应源码**，也不声称仅凭这份工具箱源码包便已满足引擎的全部 GPL 源码交付义务。实际 npm 核心为 `@ffmpeg/core@0.12.10`；已查到的配方、可移动构建输入及尚缺材料见 [媒体引擎源码义务](ffmpeg-source-obligations.md)。用户接受 GPL/AGPL 义务不等于这些具体材料已经交付。

本地允许继续采用该核心开发和测试。公开分发包含该二进制的站点/镜像前，发布负责人必须先关闭上述对应源码材料缺口，或使用全部构建输入已经锁定并保存源码的自建核心；不能把本工具箱 ZIP 或一份许可证正文当作引擎源码。

## 生成与内容

在工具箱仓库根目录，已有依赖安装完成后执行：

```powershell
node scripts/package-source.mjs
```

脚本只使用已有 JSZip，不新增运行依赖。输出路径固定为 `dist/toolbox-source-local-20261109.zip`，以临时文件加重命名完成写入；若源码在读取期间变化则明确失败，需要待编辑完成后再生成。

归档根目录带 `SOURCE-MANIFEST.json`，记录文件清单、上游提交、候选标识、排除目录和引擎源码边界。这里的文件大小用于核对清单，不代表已经验证构建结果或浏览器行为。

明确不包含：

- `.git`、`node_modules`、真实 `.env`、运行日志、构建镜像、coverage、浏览器测试输出及 DOCX/PDF/PNG 渲染验收产物。
- `src/config/deferred-tools.json` 对应的 7 个延期工具目录，及 `src/lib/ghostscript`。延期说明页面和路径仍保留；这些源码路径只作为延期清单中的说明字符串，不在活动注册表中加载。
- `public/gs.js`、未采用的旧站点字体和品牌文件。public 内容与静态发布白名单一致。

保留 `@types`、`.vitest/setup.ts`、`scripts/release-policy.ts`、`upstream-base.json`、`licenses` 及必要生成脚本。docs 仅收录本说明与 `ffmpeg-source-obligations.md`，不把含本机路径和开发过程的审计交接记录作为公开源码交付。源文件中的测试可随源码保留，但诊断 fixture 输出不打包；未安装浏览器和外部工具时，不能把源码可构建当作所有测试可运行。

## 在独立目录重建

解压后进入解压目录，使用 Node 22 和 npm 10（本轮验证环境），按归档内当前修改版锁文件安装：

```powershell
npm ci --ignore-scripts --no-audit --no-fund
npm run build
```

安装仍需要取得锁文件中的 npm 发布物；源码 ZIP 不附带依赖缓存，也不是完全离线构建包。`--ignore-scripts` 避免在没有 `.git` 的源码解压目录安装提交钩子，不影响已验证的应用构建路径。当前 Vite 通过 `upstream-base.json` 取得候选版本标识，不要求归档包含 `.git`。

构建产物是 `dist` 静态目录。仅本机预览可以执行：

```powershell
node node_modules/vite/bin/vite.js preview --host 127.0.0.1 --port 5178 --strictPort
```

再次发布前须对最终输入重新生成归档，并核对归档内容与实际站点/镜像一致。脚本生成和 ZIP 可解压不等同于独立重建、浏览器验收、源码下载链接公开可访问或生产许可验收；这些验证由集成/发布负责人记录，不预先宣称完成。

## 图标来源

`src/assets/local-icons.json` 是随站点打包的图标几何数据和别名，未以运行时 API 加载图标。`licenses/icons/manifest.json` 针对实际 28 个图标集记录所采用图标、原作者、固定 Iconify 提交、许可及对应文本来源。

可取得的原始 LICENSE 以其仓库提交锁定保存；标准许可文本来自 SPDX 官方许可文本仓库的固定提交。许可正文未改写，仅规范化行尾与尾部空白，不补造版权年份。使用标准文本时，作者归属另由已锁定的 Iconify 元数据提供，不把标准模板中的占位符冒充某个作者的原始版权声明。

图标的 CC BY / CC BY-SA 等义务应随几何源数据和发行归属一并保留，不能只保留 React 组件包的许可。若清单记录某个具体图标的权利材料仍不能确认，应替换该图标，而不是关闭与它无关的工具功能。
