# 工具站部署进度

更新：2026-11-09（北京时间）。本次独立生产发布已完成：https://tools.pingxingxian.space/ 。结论只覆盖下列实际产物、重点流程与健康检查，不表示所有原生工具均已逐项文件验收。

## 本次明确授权

用户批准：创建公开仓库 ixiaoyy/parallel-lines-tools、推送当前代码；在主站现有生产服务器 /opt/parallellines-tools 独立容器部署 tools.pingxingxian.space，仅新增该子域代理、独立证书和必要网关 reload，保留原站全部服务。允许新公开仓库使用 GitHub 标准 Linux runner 构建并保存必要源码/产物；不购买新服务器或付费 runner，遇额外费用先停。用户已接受按 GPL/AGPL 等适用许可提供对应源码。

## 已完成

- 独立仓库 https://github.com/ixiaoyy/parallel-lines-tools 已创建；当前分支 feat/pingxingxian-toolbox 保留，upstream 仍为原作者仓库。
- 初始应用提交 8c90570 已推送。首次 push 因浅克隆缺失对象失败，fetch --unshallow 后正常推送，没有 force/reset 或重建仓库。
- 主站运维分支 ops/tools-deploy-20261109 已推送；main 仅持久新增工具域名标记段，最终提交60e862d9，保留其余配置字节，非强推且提交带[skip ci]，没有触发现有全栈发布。
- 只读现场 inventory 42508258911 通过；manual dispatch 42509228129 也通过，故无需把dispatcher复制到main。第一次inventory因SSH逐行script_stop破坏heredoc失败，已改等价set-eu/完整stdin脚本，不改账号、密钥、fingerprint或平台屏蔽策略。
- 实际网关 parallellines-nginx-1、可用现有网络 parallellines_default。初始调查时default.conf tracked且clean；上线仅保留已记录工具标记段owned delta，不改变服务器Git HEAD/index。完整前像只由本地Git源码计算，远端只比较布尔，不还原日志中被平台屏蔽的值。
- tools DNS已有解析，真实HTTP01随机探针200、body匹配、0重定向、自有探针已清理。
- 显式prepare-tls 42511922651 成功；专属证书目录 /opt/parallellines/var/letsencrypt/parallellines-tools，SAN仅tools域、有效至2027-02-06，该签发阶段不reload；后续部署已真实通过专属renew dry-run、cron安装、独立消费者调用及源站SNI/CA/公共证书身份确认，旧证书/hooks未改。
- 正式应用ee61062ee39cb31189e365660e1fa2cca5009d88已由site-同SHA的Release发布并部署；bundle28817920字节。生产只COPY已验证dist，Nginx基础digest见公开deployment-receipt.json，实际image ID在服务器验证/保存；日志中被屏蔽的片段仍未知，不猜回。
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

x265原始commit现在仅表示基线；实际ABI补丁、Git diff与修改记录随源码归档。没有为缓存改源码事实，也未砍x265或吞失败。root统一commit/push/dispatch，实际资产已由media-core-pl.1与site-ee61062ee39cb31189e365660e1fa2cca5009d88登记。

## 已执行的发布路线

1. core构建成功、实际媒体测试通过后，才将二进制/完整源码/输入锁/许可回执一起公开Release。没有成功之前不部署旧未知输入二进制。
2. root按真实core Release生成media-core.lock.json；正式site工作流验证资产身份、准备LGPL源码、构建并在真实Nginx容器验HTTP/MIME/cache/浏览器，再公开site-40SHA静态bundle+receipt。
3. 生产只COPY封装已验证dist，不npm/Vite/媒体编译，base Nginx按digest，container只本工具、无公网端口、无DB/卷，CPU0.5/mem256m/pids64。固定network必须仍属gateway。
4. 当前主站nginx-only发布实际会force-recreate gateway，不能使用。本次只走备份、唯一标记段、nginx-t、reload和独立health/一文件恢复；不整仓checkout/reset、不改旧证书/hooks。
5. root在实际运行验证后持久化唯一tools vhost到主站tracked default.conf，提交明确[skip ci]避免触发旧自动recreate；main没有branch protection，仍不得强推或覆盖并发变化。
6. 专属Certbot config与父目录renew隔离；专属cron/消费者只处理tools，证书改变且配置可安全reload才重载。允许已记录tools标记段owned delta，不以全局git clean错误阻断正常续期；其它未提交配置变化仍停止。

所有远程写动作仅由root显式dispatch执行；workflow push只做inventory。部署/rollback/renew入口必须先完整实现和检查，不暴露空壳操作。独立health不依赖部署进程，read健康与mutation并发组分离。

## 正式发布回执与验证

- 核心：42567344709成功；media-core-pl.1的JS/WASM、272837112字节完整源码、原许可/构建记录/QA共同公开。匿名源码下载及18604文件清单检查通过；16依赖、子模块、SDL、SDK和真实补丁齐备。证据：evidence/core-public-source-check.json。
- 站点：42570812688成功。最终源码ZIP无Git、无共享node_modules独立npm ci/default prebuild/build通过；真实Nginx检查HTTP/深链接/CSP/MIME/Range/缓存/405，三个DOCX/重名图片ZIP/WAV浏览器用例通过。没有启动本机Docker。
- 生产：42572710797首次成功；42573761415复用相同已验证应用image，补工具子域no-transform并再次通过12项健康、renew dry-run和已安装消费者。容器parallellines-tools-static，只接parallellines_default，无公网端口/DB/卷，CPU0.5、内存256MiB、pids64。gateway_not_recreated=true。
- 最终独立健康：42574100132成功，12/12；包括真实源站TLS、工具公网标题/healthz、主站、Chat、OIDC和New API公开健康入口。不代表已测试真实用户登录或模型计费。
- 最终线上Chrome：3/3真实文件流程通过，DOCX10818字节、ZIP2158字节、WAV87354字节；网络样本无外站请求、无非GET/HEAD请求、无pageerror。1280桌面和375px布局截图已观察，未见新增遮挡/横向溢出；不是实机Android/iOS或全浏览器验收。证据：evidence/production-final-e2e.json、production-final/。
- 持久化：主站main先0af2a969、最终60e862d9，仅工具标记段；第二笔只增no-transform并保留原缓存策略。用可信前像、原树和非强制快进写入；main未加入dispatcher，没触发旧recreate发布。证据：evidence/main-tools-persistence-final.json。

## 失败与修复记录

- Site42569433528在初始阶段主动取消，以同步真实核心交付文档；没有发布资产。
- Site42569515194、42569900334在下载新发布核心时HTTP504，未发布站点。匿名receipt/source稍后恢复；Node fetch需沿用既有网络代理，CI用Node22.21+的NODE_USE_ENV_PROXY=1。installer保留30秒首响应/空闲、180秒单次、8分钟总上限，瞬时错误只重试一次；7项installer测试通过。旧FFmpeg边界9项定向测试通过，扫描另命中旧重建目录同9项，不计为额外新覆盖。
- Deploy42571450869已实际执行，失败release_download:HTTPError，expectedPreimage=true；错误在镜像/服务/config/cron和事务切换前，可能留自有attempt/receipt/lock，不删除生产残留。未证实具体HTTP码，不能直接叫504。随后独立health42571901537确认工具未部署、原站入口正常。按实际28MB包下载120秒仅得21819520字节的证据，将单资产总界限改300秒、连接/空闲30秒，并补HTTP码/资产名诊断；2项定向测试通过。
- gh2.96的格式化run日志因默认64KiB Scanner在89288字节源码行静默截断；通过官方raw job logs确认真实结果，不改认证、不提高传输边界或还原***。完整payload仍在120000字节守卫内。
- 首轮生产三个文件流程本体通过，但afterEach发现Cloudflare统计脚本请求；样本无POST。依据Cloudflare官方FAQ，在工具代理响应新增no-transform，保留上游no-store/immutable并禁止边缘改写；最终相同三个用例完整通过，无第三方请求。参考：https://developers.cloudflare.com/web-analytics/faq/ 。

## 恢复与仍保留的限制

- 源码/许可与重点功能的本次发布已完成。chinese的gateway/bind/inode、完整attempt、精确半写尾恢复及续期待reload恢复修复，经markdown独立复核关闭；12项部署/11项TLS替身回归不冒充生产演练。
- 独立恢复入口：主站ops分支tools-ops的rollback，release_tag=site-ee61062ee39cb31189e365660e1fa2cca5009d88；只撤该笔工具增量，保留其他服务。服务器保存各attempt原配置、旧current/image及事务。首次部署没有旧工具版时恢复至未开放工具域状态；本次后续header部署可恢复至先前工具配置。未来gateway身份/配置漂移会停止，须发布负责人先核现场，不强行补偿新实例。
- 未主动在生产制造故障或执行撤除站点的回滚演练；恢复依据是实际保存的独立入口/备份与局部测试。Cron独立消费者已实际调用和dry-run通过，未来自然到期续签尚未发生。
- 7个引擎/资源延期条目、上游透明PNG缺陷、所有原生工具的完整格式/恶意输入验收仍未完成；不是许可证类别禁止。HEVC-ST编码有已复现死锁，当前UI不选libx265，保留负结果，不称通过也不砍编译codec；不扩大MT/COOP。
- 主站/tools收录页及卡片、Web、账号/数据库/登录链未改；仅工具子域代理与独立应用上线。新增收录卡片、其余原生质量任务或新能力需后续对应范围授权，M3/M4/M5未启动。
