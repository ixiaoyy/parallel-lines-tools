# 工具站部署进度

更新：2026-11-09（北京时间）。此文件是持续部署记录，不代表已完成上线。

## 本次明确授权

用户批准：创建公开仓库 ixiaoyy/parallel-lines-tools、推送当前代码；在主站现有生产服务器 /opt/parallellines-tools 独立容器部署 tools.pingxingxian.space，仅新增该子域代理、独立证书和必要网关 reload，保留原站全部服务。允许新公开仓库使用 GitHub 标准 Linux runner 构建并保存必要源码/产物；不购买新服务器或付费 runner，遇额外费用先停。用户已接受按 GPL/AGPL 等适用许可提供对应源码。

## 已完成

- 独立仓库 https://github.com/ixiaoyy/parallel-lines-tools 已创建；当前分支 feat/pingxingxian-toolbox 保留，upstream 仍为原作者仓库。
- 初始应用提交 8c90570 已推送。首次 push 因浅克隆缺失对象失败，fetch --unshallow 后正常推送，没有 force/reset 或重建仓库。
- 主站仅新增运维分支 ops/tools-deploy-20261109，未改 main 的运行配置或触发现有全栈发布。
- 只读现场 inventory 42508258911 通过；manual dispatch 42509228129 也通过，故无需把dispatcher复制到main。第一次inventory因SSH逐行script_stop破坏heredoc失败，已改等价set-eu/完整stdin脚本，不改账号、密钥、fingerprint或平台屏蔽策略。
- 实际网关 parallellines-nginx-1、可用现有网络 parallellines_default。主站 default.conf tracked且clean；完整前像只由本地Git源码计算，远端只比较布尔，不还原日志中被平台屏蔽的值。
- tools DNS已有解析，真实HTTP01随机探针200、body匹配、0重定向、自有探针已清理。
- 显式prepare-tls 42511922651 成功；专属证书目录 /opt/parallellines/var/letsencrypt/parallellines-tools，SAN仅tools域、有效至2027-02-06，主站配置未改、网关未reload。续期仍待部署消费者安装和单独验证，不能将一次签发算闭环。
- 静态prebuilt Docker/Compose、包/回执、read-only容器验证与site Release workflow已准备；正式asset未生成/未部署。
- HEIC优先使用原作者可核源码，不因LGPL重新编译或禁用：heic-to1.6.6/default dist与固定提交一致，libheif1.23.6、libde2651.0.16原始源码/构建材料与许可已收集并锁定。三份原始源码镜像已纳入 vendor-sources/heic，正式应用源码ZIP会完整收录；无需给普通Node构建新增Python前置。

## 媒体核心实际构建

采用新自建 media-core-pl.1，并非声称恢复旧 npm 包的历史输入。16源码/子模块/SDL port/SDK/frontend/BuildKit已固定；全部codec configure/link标志保留，单线程，最多2并发。

| Run | 实际结果 |
|---|---|
| 42508247233 (32a70db) | 失败：zlib两个CMake目标同名libz.a在并行安装时竞态；仅该库改为串行，不删target/codec |
| 42509219935 (ff22e05) | zlib通过，失败于FriBidi缺c2man的手册安装；显式安装gen.tab/lib和pkgconfig并检查库/头完整，源码目录仍全部保留 |
| 42510809406 (dcbb334) | 全部依赖库编译推进到FFmpeg configure，x265缺pkgconfig；真实原因已核为浅取commit无3.4 tag导致x265 CMake不生成pc，不是已证明缺codec/线程/ABI |
| 42549935072 (f80a46b) | 依赖与核心编译/最终链接已完成，末尾错误地将带双引号SDK版本原文与裸版本比较而失败；同时发现x265三位深无ASM fallback函数签名不符，未发布 |
| 42558773964 (c9b2814) | SDK-only短预检通过：按官方解析得到3.1.40，实际emcc返回0；不能代替完整构建或媒体验收 |
| 42560282613 (8a844cc) | 依赖/核心编译和完整源码导出通过，没有已知xgetbv签名警告；真实浏览器probe到总180秒超时，未进入公开Release，不能算编解码通过 |
| 42567344709 (d249b36) | 完整编译、源码/许可导出、H264/MP3/AAC真实编解码及WAV页面通过；media-core-pl.1二进制/源码/输入锁/许可/QA共同公开 |

x265原始commit现在仅表示基线；实际ABI补丁、Git diff与修改记录随源码归档。没有为缓存改源码事实，也未砍x265或吞失败。root统一commit/push/dispatch，完成后再登记实际发布资产。

## 发布路线与剩余工作

1. core构建成功、实际媒体测试通过后，才将二进制/完整源码/输入锁/许可回执一起公开Release。没有成功之前不部署旧未知输入二进制。
2. root按真实core Release生成media-core.lock.json；正式site工作流验证资产身份、准备LGPL源码、构建并在真实Nginx容器验HTTP/MIME/cache/浏览器，再公开site-40SHA静态bundle+receipt。
3. 生产只COPY封装已验证dist，不npm/Vite/媒体编译，base Nginx按digest，container只本工具、无公网端口、无DB/卷，CPU0.5/mem256m/pids64。固定network必须仍属gateway。
4. 当前主站nginx-only发布实际会force-recreate gateway，不能使用。本次只走备份、唯一标记段、nginx-t、reload和独立health/一文件恢复；不整仓checkout/reset、不改旧证书/hooks。
5. root在实际运行验证后持久化唯一tools vhost到主站tracked default.conf，提交明确[skip ci]避免触发旧自动recreate；main没有branch protection，仍不得强推或覆盖并发变化。
6. 专属Certbot config与父目录renew隔离；专属cron/消费者只处理tools，证书改变且配置可安全reload才重载。允许已记录tools标记段owned delta，不以全局git clean错误阻断正常续期；其它未提交配置变化仍停止。

所有远程写动作仅由root显式dispatch执行；workflow push只做inventory。部署/rollback/renew入口必须先完整实现和检查，不暴露空壳操作。独立health不依赖部署进程，read健康与mutation并发组分离。

## 当前上线门槛与负责人

- root：已按真实公开资产生成并推送媒体锁9646b45。site首轮42569433528因交付文档需同步真实core结果，已在初始阶段主动取消；最终文档提交后执行正式site Release/生产部署。当前没有已部署工具容器或网关reload。
- chinese：已关闭gateway身份漂移、精确部分尾恢复、完整attempt所有权和续期待reload重试，四份描述符固定，写流程与主站共用并发组；12项deploy/11项TLS局部替身检查通过。由416c7ff9推送，push只读inventory42566591443通过。
- markdown：独立复核已确认P1均在代码层关闭；实际SSH、镜像/bind、生产健康与续期消费者仍由root真实验收。生产不主动造故障或演练撤除首次工具站。
- image：实际匿名源码下载与必要原文件清单检查进行中；生产前消费其证据。HEVC-ST是已证实的上游死锁且当前UI未调用，已撤销额外扩大门槛，保留负结果不称通过、不删codec。最终源码ZIP的无Git/无共享依赖npm ci/build由site同job执行。
