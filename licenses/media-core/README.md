# 媒体核心构建材料与许可交付

这里记录 `media-core-pl.1` 的新自建输入，不猜测 npm core 0.12.10 当时的移动分支版本。

- `core-build.lock.json` 固定上游配方、16 个源码 commit、嵌套子模块、SDL2 官方校验和、SDK、Dockerfile frontend 和 BuildKit 镜像。
- SDK 基础镜像内的 Emscripten 源码由构建任务从实际使用的镜像导出，排除编译缓存；用于确认构建脚本和 port 处理的实际版本。
- 编译上下文含完整 vendored Git 源码与实际脚本修改，并在源码归档中保留。构建脚本将 make 并发上限收敛到 2；仅 zlib 因真实 CI 中同名归档竞态，构建/安装改用 `-j1`。同时移除 FriBidi 安装时盲目的 `|| true`；保留原全部编解码器 configure/link 标志，实际编译/安装错误必须修复后才能交付。
- `core-receipt.json` 关联实际 JS/WASM、完整源码包、输入锁、来源提交及运行编号。Release 只有真实浏览器媒体测试成功后才发布。
- 本仓库的 MIT 不能代替 FFmpeg 核心及其链接库许可。FFmpeg GPL v2 正文来自所用 FFmpeg 源码的 COPYING.GPLv2；其他组件的完整许可和版权随各自原始源码共同提供。
- 上游 `testdata` 仅是未用于核心编译的媒体测试素材；其 gitlink 已锁定但不放入核心源码包，不影响任何编解码器。

生产发布须确认 Release 的 `media-core-source.tar.gz`、`media-core-NOTICES.txt` 和 `core-receipt.json` 实际可访问且与二进制一致。准备脚本存在或 CI 已启动都不等于已经完成此项验收。

CI `42509219935` 进一步确认 FriBidi 失败发生在缺少 c2man 的手册生成/安装，锁定版本 configure 没有 disable-docs 开关。配方改为显式安装 gen.tab 与完整 lib 子目录、根 pkg-config，并断言静态库/头文件/pkg-config 存在；只省略不链接进 FFmpeg 的手册、CLI 和测试安装，源码归档仍保留全部目录，编解码/文字整形能力不删减。
