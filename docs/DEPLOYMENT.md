# 独立静态工具箱部署

更新日期：2026-11-09。授权目标为 `tools.pingxingxian.space`，生产目录为 `/opt/parallellines-tools`。本文准备交付接口，不代表已公开 release、上传、签发证书、reload 或上线。本工具静态服务不修改主站 `/tools`、数据库、数据卷、Chat、OIDC 或其他应用。

## 交付方式

公开 GitHub release 使用 `site-<40位应用提交SHA>`，只发布经过验证的应用静态包 `toolbox-dist.tar.gz` 和 `deployment-receipt.json`。不把 Nginx/Docker 基础镜像副本再次上传，不额外引入公共应用镜像仓库或重复镜像存储。

CI 使用同一份 dist、部署配置和明确指定的 Nginx digest，通过 `deploy/Dockerfile.prebuilt` 封装测试镜像并做真实 HTTP 验收。通过后发布该静态包及回执。生产根据回执拉取固定 digest 的官方基础镜像，只执行 COPY 封装静态应用；不安装 npm 依赖，不重跑 TypeScript/Vite，也不编译媒体核心。生产封装后的实际 image ID 和旧 image ID 必须留存，以便核对与回退。

## 打包接口

唯一正式入口为 `scripts/package-deployment.mjs`，支持显式 CLI 参数或同名环境变量：

```text
node scripts/package-deployment.mjs --application-revision <40位小写Git提交SHA> --nginx-image nginx@sha256:<64位已核实摘要>
```

环境变量为 `APPLICATION_REVISION` 和 `NGINX_IMAGE`。CLI 明确给出的值优先；没有值、应用提交格式错误、Nginx 使用浮动标签或非 digest 引用时明确失败，不从本地 Git、Dockerfile 默认值或 latest 猜测。基础引用接受 `nginx@sha256:...` 或等价的 `docker.io/library/nginx@sha256:...`，保留调用方传入的准确值。

打包前必须已经存在构建产物与 `dist/media-core-receipt.json`。媒体回执须满足 `validation.status === "passed"`，提供实际 `version` 和公开无凭据的 GitHub release 源码 URL；组件清单必须记录相同的 `@parallellines/media-core` 版本。开发用默认核心、缺回执或未通过验证的核心不能作为正式包发布。

输出仅在 `.deployment/`：

- `toolbox-dist.tar.gz`：内容限于整个已构建 dist，以及 `deploy/Dockerfile.prebuilt`、`deploy/Dockerfile.prebuilt.dockerignore`、`deploy/nginx/default.conf`、`deploy/compose.yaml`。
- `deployment-receipt.json`：记录应用提交、核心版本/源码 URL、固定 Nginx digest、预期标题和静态包的 GitHub 下载 URL、SHA-256、字节数。

回执 schema 为 1，下载 URL 固定为 `https://github.com/ixiaoyy/parallel-lines-tools/releases/download/site-<同一应用SHA>/toolbox-dist.tar.gz`，预期标题为平行线工具箱。回执不包含生产网络名、真实环境文件、登录凭据或服务器密码。

脚本只使用已有 Node 与系统 GNU tar 或 bsdtar，无新增依赖。不收录符号链接、越界路径、真实环境文件、私钥文件或诊断产物；关键文件不存在或为空时失败。输入最多 10,000 个文件、512 MiB，tar 执行最多 180 秒。读取和打包期间若文件清单、大小或修改时间变化则停止；不把不同构建状态混成一次发行。失败退出不得继续发布残留的旧输出，必须核对成功回执中的应用 SHA。

`.deployment/` 必须留在 Git 忽略范围，不将它或 CI 的临时镜像归档提交进源码。应用源码 ZIP 与媒体核心对应源码 URL 是不同交付物；打包脚本只消费已经通过的核心回执，不替代媒体核心源码、构建记录和公开下载的验收。

## 容器与网关接口

| 项目               | 值与约束                                                                                              |
| ------------------ | ----------------------------------------------------------------------------------------------------- |
| 静态封装入口       | `deploy/Dockerfile.prebuilt`，不运行前端或媒体编译                                                    |
| 原源码入口         | 根 Dockerfile 仍可独立源码构建，不要求预先有 dist 或新增必填配置                                      |
| 应用镜像参数       | `TOOLS_IMAGE`：本次生产 COPY 封装形成的不可变镜像引用，记录实际 image ID                              |
| 基础镜像参数       | 从已核回执读取 `nginxImage`，传为 Docker build 的 `NGINX_IMAGE`，不能使用 Dockerfile 开发默认标签代替 |
| 外部网络参数       | `TOOLS_PROXY_NETWORK`：本次 inventory 核实的现有网关网络，不能猜测或隐式新建                          |
| Compose 项目       | `parallellines-tools`，文件 `deploy/compose.yaml`                                                     |
| 唯一容器及网络别名 | `parallellines-tools-static`                                                                          |
| 网关内部目标       | `http://parallellines-tools-static:80`，仅 Docker 网络内访问                                          |
| 公网端口           | 没有宿主机 ports 映射，不占用现有 80/443                                                              |
| 数据与权限         | 不接数据库、不挂主站卷、不保存用户文件；只读容器，运行缓存和 PID 使用临时 tmpfs                       |
| 健康检查           | 容器内 GET `/healthz` 应为 200；不代替文件/浏览器验收                                                 |

`deploy/.env.example` 仅列配置名，不随公开静态包发布。生产负责人按实际环境传入 TOOLS_IMAGE、TOOLS_PROXY_NETWORK，不改用户已有真实 `.env`。本仓库不提供替换主站网关、证书管理或隐式远程部署脚本。

## CI 的实际 HTTP 验收

集成 CI 至少检查以下真实容器响应，不用纯字符串断言或 healthz 冒充：

1. 使用回执固定的基础 digest 和同一份 dist/config 封装临时测试镜像，运行 `nginx -t`，以实际目标架构启动容器并等待健康。
2. 首页及 `/converters/markdown-to-docx`、`/image-generic/compress` 深链接为 200，标题正确且入口 HTML 的 CSP 保留；入口 Cache-Control 为 no-store。
3. 从该 index 实际引用中选取 JS/MJS、CSS 和 WASM，检查 200、正确 MIME；指纹资源为 immutable。WASM 另以 Range 请求验证 206 与正确内容类型。
4. 站内源码 ZIP 下载为正确 MIME、no-store；若 dist 同时提供源码 tar，也检查其站内 MIME 和缓存。核心回执的外部 GitHub 源码 URL 则独立检查公开可下载，不能要求 GitHub 的响应缓存服从本站 Nginx 配置。不存在的 assets 必须 404 且不能长缓存，不能用 HTML 回退伪装资源。
5. 静态服务 POST 返回 405，不提供上传或转换 API。真实 Markdown、图片与媒体的产物/隐私检查按各自已有验收入口执行。
6. 所有检查完成后再打包并核对 SHA-256/字节数。测试容器和临时镜像只在 CI 使用，不作为额外公开 Docker 镜像资产发布。

本机只有 Docker CLI、没有可用 daemon，本准备任务不启动本机容器；上述实际 HTTP 验收由 CI 所有者实施并记录。

## 生产接入顺序

1. 核实目标服务器、架构、Docker/Compose 能力、网关容器及其外部网络，确认唯一容器/网络别名没有冲突。先记录现有 tools 状态和旧 image ID。
2. 将本次回执与静态包取得到独立 `/opt/parallellines-tools`，核对应用 SHA、发布 URL、SHA-256 和字节数，检查核心回执及源码下载已成立。不要覆盖 `/opt/parallellines` 的文件、卷或 Compose。
3. 检查 tar 清单只含允许的相对路径、没有链接或路径穿越，再解压到独立版本目录。使用该版本的预构建 Dockerfile和回执 Nginx digest，仅 COPY 封装静态应用；留存完整构建命令、镜像标签及实际 image ID。
4. 传入真实 TOOLS_IMAGE、TOOLS_PROXY_NETWORK，先做本 Compose 的 config 和镜像内 `nginx -t`，再以无构建方式启动本工具服务。Compose 无 build 字段，不会隐式重新编译。
5. 容器 healthy 后，从网关网络检查首页、深链接、运行资源、源码材料和缓存；新服务未健康时不切换网关。容器重建可能换 IP，应沿用主站已核实的 Docker DNS 解析方式，不把某次容器 IP 写死。
6. 网关负责人仅新增 tools 子域入口/证书，将其代理到唯一内部别名。先验证配置，再 reload，并保留本次修改前的配置及恢复入口。
7. 公网复核 HTTPS、实际版本、MIME/缓存、浏览器功能与源码下载，同时确认主站、Chat、登录未受影响。只有容器启动或 healthz 成功不算上线验收完成。

实际外部网络、最终镜像 ID、证书和网关状态由本次负责人核实。本文件不预先宣称它们已在生产生效。

## 静态 HTTP 合同

- SPA 路由刷新返回 index.html；HTML、非指纹资源及源码 ZIP/tar 为 no-store，避免固定名字的旧源码包被复用。
- 只有 `/assets/` 下带至少 8 位内容指纹的成功资源长缓存一年并 immutable；404 和缺失代码不长缓存，也不回退为 HTML。
- JS/MJS、WASM、ZIP、tar、tar.gz/tgz 的 MIME 分别为 application/javascript、application/wasm、application/zip、application/x-tar、application/gzip；gzip 下载包不是 HTTP Content-Encoding。
- 保留 HTML 现有 CSP，不给主站或 Chat 增加全局 COOP/COEP；没有跨站请求放行或 CDN 兜底。
- 只接受 GET/HEAD；关闭工具容器访问日志，不修改共享网关本身的日志策略。

## 回退

发布前保留上个有效 release 回执、静态包、配置、基础 digest、应用镜像及实际 image ID，不执行 image prune。回退时仅恢复本 Compose 的旧不可变应用镜像与配套配置，检查健康和静态/浏览器结果后恢复 tools 网关入口。

如需从旧静态包重新 COPY 封装，必须继续使用旧回执固定的基础 digest，不以最新标签代替；将新生成的 image ID 与原 ID 分别记录，不伪称它们天然相同。首次上线没有旧工具版本时，回退到未开放 tools 子域的状态。

不运行全局 compose down，不移除共享外部网络，不删除主站卷、数据库、备份或其他服务；不以整份过期主站配置覆盖别人的后续修改。

## 本阶段验证边界

既有静态配置曾以本地 Docker Compose v5.0.2 执行 config --quiet 通过，并用 7 个静态样例检查缓存分流。这些是配置层证据，不是运行中的 Nginx 或线上验收。

本打包脚本的 9 项隔离合成 fixtures 检查通过：显式参数、成功 tar/回执 SHA-256 与字节数、未通过媒体验证、缺应用源码 ZIP、缺 WASM、核心版本不匹配、混入真实环境文件名、符号链接、带 token 查询参数的源码 URL。临时 fixture 均位于独立系统临时目录并已清理，没有伪造仓库实际媒体回执或生成正式发布包。体积上限没有通过制造超限大文件压测，GNU tar 分支和真实最终包由 CI 验证。

镜像和 HTTP 由 CI/生产集成验收。本机不启动 Docker daemon，不构建整个应用，也不进行远程执行或公开 release。
