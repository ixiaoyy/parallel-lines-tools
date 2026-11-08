# 独立静态工具箱部署

准备日期：2026-11-09。此文及配置针对已授权目标 `tools.pingxingxian.space` 和生产目录 `/opt/parallellines-tools`；准备文件不代表已上传、已签证书或已上线。本任务不修改主站 `/tools`、数据库、数据卷、Chat、OIDC 或既有应用配置。

## 交付接口

| 项目 | 值与约束 |
|---|---|
| 推荐镜像入口 | `deploy/Dockerfile.prebuilt`，只封装已验收的 `dist`，不重新运行 npm/TypeScript/Vite |
| 原源码入口 | 根 `Dockerfile` 仍可独立源码构建；不要求事先有 dist，也没有新增必填构建变量 |
| 镜像参数 | `TOOLS_IMAGE`：已验收、可回退的不可变镜像引用；不能使用会漂移的 latest |
| 外部网络参数 | `TOOLS_PROXY_NETWORK`：本次只读 inventory 得到的现有网关网络名；必须先确认网关实际连接该网络 |
| Compose 项目 | `parallellines-tools`，文件为 `deploy/compose.yaml` |
| 唯一静态容器/网络别名 | `parallellines-tools-static` |
| 网关内部目标 | `http://parallellines-tools-static:80`，仅 Docker 网络内可访问 |
| 宿主机端口 | 无 ports 映射，不占用或公开宿主机 80/443 |
| 账号和文件 | 不接数据库、不挂主站卷、不保存用户文件；只读容器，运行缓存和 PID 为临时 tmpfs |
| 健康检查 | 容器内 `GET http://127.0.0.1/healthz`，必须为 200；它不能替代文件/浏览器验收 |

`deploy/.env.example` 只有配置名，不包含实际网络名、客户端凭据或生产密钥。正式环境值由部署负责人传入，不修改用户已有真实 `.env`。本仓库不提供证书管理、主站网关替换或自动远程部署脚本。

## 先封装已验收产物

构建前核对本地 dist 的实际候选版本和全部配套源码材料。预构建入口检查 `index.html`、`THIRD_PARTY_NOTICES.txt`、`release-components.json` 与修改版源码 ZIP 存在；这只是完整性下限，不代替对应源码义务和业务验收。

从仓库根目录执行镜像封装，由发布负责人给出版本、目标架构及已核实的基础镜像：

```text
docker build --file deploy/Dockerfile.prebuilt --build-arg APP_REVISION=<已核实的提交或候选标识> --tag <本次不可变镜像名> .
```

命令中的标识必须替换为本次真实值。Dockerfile 默认基础镜像为 `nginx:1.30.6-alpine`，该标签已在 [Docker 官方镜像清单](https://github.com/docker-library/official-images/blob/master/library/nginx) 中核实存在；生产交付建议用可选 `NGINX_IMAGE` 参数进一步固定为发布时实际核实的 digest。不得把文档默认标签当成已经拉取、扫描或在生产运行的镜像证据。

`deploy/Dockerfile.prebuilt.dockerignore` 是该 Dockerfile 的独立上下文白名单，允许已构建的 dist 和静态 Nginx 配置；根 `.dockerignore` 继续排除 dist，保持源码构建语义。构建环境需支持 Dockerfile 专属 ignore 文件；若服务器不具备已确认的本地封装能力，应在获准构建环境制作镜像后以镜像归档交付，不在生产安装 Node/npm 或重新编译前端。

从源码构建仍使用普通 `docker build .`。该入口用 Node 22 按当前锁文件安装依赖，再执行现有 `npm run build`；不新增必须预先生成 dist 的条件。任何构建、推送、上传和生产执行都由本次发布负责人按当前授权操作，本节命令不授予后续额外权限。

## 生产接入顺序

1. 只读核实目标服务器、CPU 架构、Docker/Compose 能力、主站网关容器及其外部网络，并确认没有名为 `parallellines-tools-static` 的其他容器或网络别名冲突。
2. 在独立 `/opt/parallellines-tools` 保存本次 Compose/配置、镜像版本记录及可恢复的旧镜像；不覆盖 `/opt/parallellines` 的源码、卷或 Compose。
3. 将已验收镜像交付目标环境，传入真实 `TOOLS_IMAGE`、`TOOLS_PROXY_NETWORK`。先执行该 Compose 的 `config` 和镜像内 `nginx -t`；均通过后才启动本项目 `tools-static`。本配置没有 build 字段，生产 up 不会隐式重编译。
4. 检查工具容器 healthy，并从同一网关网络访问 `/healthz`、首页、一个工具深链接、实际 JS/MJS/WASM、源码 ZIP 与对应源码 tar。不存在的 assets 必须 404。
5. 由网关负责人仅新增 tools 子域的 HTTP/TLS 入口及证书，将其代理到上述唯一内部别名。先验证网关配置，再 reload；保留原站点配置与恢复版本，不把本工具容器变成新的公共 80/443 入口。
6. 公网验证 HTTPS、实际版本、入口/深链接、文件 MIME 和缓存，再执行 Markdown、图片及媒体样本与隐私请求检查；同时确认主站、Chat、登录入口未受影响。不得只以容器启动或 healthz 成功宣称上线验收完成。

本次实际网络名和最终镜像引用仍待网关负责人核实填入。证书签发、代理配置、真实公网请求及服务器状态不属于本文件准备阶段已经完成的操作。

## 静态 HTTP 合同

- SPA 路由刷新返回 `index.html`；HTML/非指纹内容/源码 ZIP 和 tar 使用 `Cache-Control: no-store`，避免固定候选文件名的旧源码包被复用。
- 仅 `/assets/` 下带至少 8 位内容指纹的成功资源返回一年 immutable；404 和缺失代码不能长缓存，也不能回退为 HTML。
- JS/MJS 为 `application/javascript`，WASM 为 `application/wasm`；ZIP、tar、tar.gz/tgz 分别为 `application/zip`、`application/x-tar`、`application/gzip`。不将 gzip 下载包错误标记为 HTTP Content-Encoding。
- 保留入口 HTML 现有 CSP，不给主站或 Chat 增加全局 COOP/COEP。工具容器没有跨站请求放行或 CDN 兜底。
- 静态服务只接受 GET/HEAD，不提供文件上传或转换 API。工具容器关闭访问日志，不改变共享网关本身的日志策略。

## 回退

发布前记录旧 `TOOLS_IMAGE` 的不可变引用和对应配置；不要覆盖旧镜像或执行 image prune。新容器未健康时，不执行网关切换。

已有工具站版本的回退，只为本 Compose 项目恢复旧镜像引用并执行无构建更新，再检查健康、静态资源和浏览器。新建入口需撤回时，网关负责人恢复本次变更前的 tools 配置/证书引用，再校验并 reload；不要恢复整份过期主站配置覆盖其他人的变更。

不运行全局 `docker compose down`，不移除共享外部网络，不删除主站卷、数据库、备份、旧镜像或其他服务。首次上线没有旧工具镜像时，回退到未开放 tools 子域的原始状态，不能凭空指定一个未经验证的旧版本。

## 本阶段验证边界

本地 Docker Compose `v5.0.2` 使用仅供检查的镜像/网络环境值执行 `config --quiet`，退出码为 0；没有创建网络或连接生产 daemon。指纹缓存选择表达式另以 7 个静态样例检查，覆盖 200/206/304 的指纹资源、404、入口 HTML 和源码 ZIP/tar 的分流，全部通过；它不替代 Nginx 实际响应检查。

这里只准备静态交付文件并做必要配置检查。没有构建镜像或重跑全库前端构建。真实 Nginx 容器语法检查、镜像启动、共享网络连通、证书/网关 reload、公网 MIME/缓存、浏览器功能及回退演练仍由集成发布验收记录；文件存在或静态 YAML 解析不代替这些检查。
