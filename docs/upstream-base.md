# 上游与主站基线

核对时间：2026-11-08 至 2026-11-09（北京时间）。以下原版测试与工具清单是 M0 基线；当前定制实现及验收另见 `implementation-status.md`、`acceptance-report.md`。所有工作仅在本地，不代表线上状态。

## 已确定的产品边界

- 用户确认 `/tools` 是收录页，点击卡片跳转。不能将它改造成内嵌工具应用，也不删除现有工具。
- 工具应用独立开发于 `D:\work\pingx\parallel-lines-tools`，沿用 OmniTools React/TypeScript 结构和正式工具注册机制。
- 工具应用部署地址尚未确定。`tools.pingxingxian.space` 是原方案建议，未配置 DNS、证书、Nginx 或发布服务。
- 用户已授权开始本地开发。未授权本轮 commit、push、创建远端 Fork、连接服务器、上传或部署。

## OmniTools

| 项目 | 实际值 |
|---|---|
| 上游 | https://github.com/iib0011/omni-tools |
| 锁定提交 | `9244e02923d99cde143ddd5b8d761d9ed0997da4` |
| package.json 版本 | `0.7.0`，不将它冒充已核实的发布 tag |
| 本地分支 | `feat/pingxingxian-toolbox` |
| remote | 仅 `upstream`，指向上述官方仓库；没有可推送的自有 origin |
| 克隆 | `git clone --depth 1`，浅克隆；后续升级前需有范围补取历史 |
| 许可证 | 根 LICENSE 为 MIT；保留原作者版权。第三方依赖/二进制另见许可证报告 |
| 本轮运行环境 | Node `v22.14.0`、npm `10.9.2` |
| 上游声明 | CI 和 Docker 使用 Node 20；package.json 未声明 engines，不据此猜更低版本支持 |
| 依赖 | npm、原始 package-lock.json；不套用主站 pnpm |
| 原版构建入口 | M0 为 `tsc && vite build`；当前 `npm run build` 另在最后生成定制源码 ZIP |
| 注册 | `src/tools/defineTool.tsx`、`src/tools/index.ts` 与各类 `index.ts` |
| 翻译 | `src/i18n/index.ts`、`public/locales/{en,zh}/*.json` |
| 源码工具量 | 128 个 meta 文件，通用计算器展开后 132 个工具，全部注册图可达 |

M0 安装执行 `npm ci --ignore-scripts --no-audit --no-fund`，退出码 0，安装 1173 个包。显式跳过生命周期脚本，未安装 Husky 钩子；这不等同于上游完整 `npm ci` 的生命周期验收。当时原始锁文件未改；当前已精确增加 `markdown-docx@1.7.1` 和 `marked@15.0.12`，使用修改版锁文件。未因此批量升级其他依赖。

## 主站接线（只读）

主站目录 `D:\work\pingx\ParallelLines`，检查时 main 提交 `071ed3203ead701d990f73a71f418380228fdba4`，工作区干净。

调用链：`apps/web/src/app/router.ts` 的 `/tools` → `pages/tools/ToolsPage.vue` → 本地 `tools` 收录数组 → 卡片 RouterLink 跳转到工具页。现有两个条目为 Excel 公式速查与操作、拼豆图纸生成器；`/tools/list-compare` 重定向到 Excel 工具的 compare 操作。

后续接入新应用需在该列表的链接结构上增加有类型的外部 URL 支持，保留现有命名路由及搜索/分类语义。不需要把 React 依赖装进 Vue 主站，不需要改主站账号或模型代理。

`apps/web/nginx.conf` 对 `/tools` 返回静态入口，`/tools/` 规范化到 `/tools`。主站 `deploy/nginx/default.conf` 同时保存 SEO、Chat、OIDC、New API 等规则；不能为新增工具站整体替换此文件。主站发布由 `.github/workflows/` 及现有镜像交接流程管理，本轮未触发。

此前公共 URL 请求得到 HTTP 200，HTML/SEO 回退仍含暂无可用工具文案；只能证明该响应，不证明 Vue 接管后的卡片状态。线上与本地是否同版本未核实，不将这段 HTML 当作需要删除本地现有工具的依据。

## M0 原版基线命令与结果

| 命令 | 退出码 | 证据与边界 |
|---|---|---|
| `npm run typecheck` | 0 | `evidence/baseline-typecheck.log` |
| `npx vitest run --maxWorkers=2 --minWorkers=1` | 0 | 74 个测试文件、699 个测试；`evidence/baseline-unit.log` |
| `npm run build` | 0 | `evidence/baseline-build.log`；仍有大包和 eval 警告 |
| `npx eslint src --max-warnings=0` | 1 | 原版 184 errors、27 warnings；未使用上游带 `--fix` 的 lint 命令，以免污染基线 |
| `npx playwright test --config scripts/playwright-baseline.config.ts` | 0 | 系统 Chrome 中 6/6 原有用例通过；PNG 文件重新解析、尺寸、大小预算、ZIP 和文本拼接；不覆盖所有工具 |
| `node scripts/audit-toolbox.mjs` | 0 | 源码图/翻译清单；不执行工具，也不判定运行正确性 |
| `npm sbom --sbom-format cyclonedx --omit=dev` | 0 | 508 个组件；许可证字段仅是筛查线索，不能代替逐项义务检查 |
| `node scripts/capture-baseline.mjs` | 0 | 原版桌面/手机截图及首页请求目的地；不是新增界面验收 |

E2E 的 3 次前置脚手架失败均保留于 `evidence/baseline-e2e-harness-*-attempt.log`：配置合并启动双服务、本机环回请求被代理接管、脚本目录下的相对路径错误。已修正脚手架后运行实际用例，不能把这些失败归为上游业务失败。第一次意外重复构建不算额外功能验证。

本次成功 E2E JSON 实际在 `../scripts/docs/evidence/baseline-e2e.json`；输出配置已修正为绝对路径，未为改报告位置重跑成功用例。整理旧报告路径的命令被工具策略拒绝，因此保留原件，不绕过删除限制。

本地原版预览：`http://127.0.0.1:5178/`。启动命令：`node node_modules/vite/bin/vite.js preview --host 127.0.0.1 --port 5178 --strictPort`。该端口只监听环回，不是 staging 或线上交付。重新启动前先查端口归属，不终止其他进程。

没有执行主站构建、API 测试、数据库查询、真实登录、模型调用或远程服务器命令。主站只读调查不证明线上游戏、Chat、登录回归已通过。
