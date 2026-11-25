# 可选跨站流量采集

本地实现，默认关闭；本文不授权构建发布、上传或开启线上配置。

## 开启条件

1. 主站先准备已批准的统计迁移、Redis 队列、独立统计 worker 和 `/api/v1/site/traffic`；迁移与发布须另获目标环境授权。
2. 确认主站 `/traffic-collector.v1.js` 可访问，采集接口允许正式工具域名，未将其加入业务写入或登录链。
3. 工具站本地构建使用 `VITE_TRAFFIC_ANALYTICS_ENABLED=true npm run build`（PowerShell 用 `$env:VITE_TRAFFIC_ANALYTICS_ENABLED='true'`）；Docker 对应 `--build-arg VITE_TRAFFIC_ANALYTICS_ENABLED=true`。正式 release workflow 使用同名仓库变量（2026-11-25 已按授权设为 `true`）。
4. 不需要在工具站增加服务、数据库或上传接口。关闭时重建为 false；主站接收开关可立即停收，新采集器本页遇到失败即停发。

## 性能与数据边界

- loader 不等待采集结果，首屏加载且空闲后才下载脚本。普通批次最多 20 条、30 秒发送；内存最多 40 条，无轮询、无限重试或持久队列。正常请求 3 秒超时，离页仅尽力发送。
- 只使用第一方随机匿名标识；共享 cookie 不可用时明确按站点或单页口径统计。浏览器 UV 不等于真人数。
- 页面不发送查询串、fragment、页面标题、文件名、输入、转换结果或登录凭据。
- `tool_download` / `tool_copy` 只来自已标记的共享结果按钮。统计的是按钮点击，不能推广为所有工具使用次数、下载/复制成功数或转换成功数；未使用这些共享按钮的工具不在动作覆盖内。
- 未采集的历史无法倒补。静态服务原 `access_log off` 不变，统计接口故障不回退文件上传或同步业务写库。

综合报表与统一口径见相邻主站仓库 `docs/CROSS_SITE_ANALYTICS.md`。本地检查和 mock 不证明线上网络、CSP、跨子域 cookie 或数据完整性。
