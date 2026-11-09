# HEIC 对应源码与重建材料

核对日期：2026-11-09。当前用途是公开分发时共同提供已使用库的 preferred source 和原始许可，不停用 HEIC，也不要求把每个原生库重新编译一次。

## 已核身份

| 组件 | 固定版本/提交 | 实际证据 |
|---|---|---|
| heic-to | `1.6.6` / `4045b8d7607e326c2b479cc424c7a60519b42dae` | npm gitHead 和官方 v1.6.6 tag 相同；默认 dist、两份 ASM.js、README、esbuild.mjs 与固定提交原文相符 |
| libheif | `1.23.6` / `f81f28ac014b1c28dee483ac45b72c6b05bc421a` | heic-to 的 ASM.js 首行明确版本，README 发布表一致，官方 v1.23.6 tag 可固定；无 Git 子模块 |
| libde265 | `1.0.16` / `7ba65889d3d6d8a0d99b5360b028243ba843be3a` | 同一首行明确版本，README 构建命令指定此值；官方 release 提供实际源 tar.gz（非 Android 二进制）；无 Git 子模块 |

当前工具导入 `heic-to`，exports 默认是 `dist/heic-to.js`，不是 CSP 变体。实际默认文件 3152244 字节，SHA256：

`122fd24dbb031605a11dd0908010adb09128d8d803f34987c72162f762e4708c`

已与官方固定提交的相同文件核对一致。`src/lib/libheif.js` 是包内 ASM.js，不是未核来源的外部 WASM。CSP 变体作为上游完整源码的一部分保留，不能把它误记为当前工具入口。

## 收集与发布

生产发布 CI 显式执行：

```text
python3 scripts/package-library-sources.py
```

该 helper 不加入普通 `npm run build` 的前置流程，不在用户打开网站时运行，也不增加外网运行时依赖。

对应源码镜像作为交付材料保存在仓库 `vendor-sources/heic/`，共约9.4MB原包；普通Node构建不依赖Python或额外下载。CI会再次核对已提交镜像与锁，不静默改写预期。该目录包含三份未经重新打包的原 tar.gz、`manifest.json`、`HEIC-NOTICES.txt`、原文 `licenses/` 和 `build-materials/`。发布负责人将整个输出一起放进应用源码 ZIP，并核对公开下载地址；不能只列上游链接或把下载成功当成已发布。`library-sources.lock.json` 保存每份源码的固定 commit、公开 URL、实际 SHA256/字节数及许可文件身份。

每份下载的连接与单次读取上限均为 20 秒，父进程提供 120 秒硬总截止，压缩包最多 40 MiB，检查的展开内容最多 200 MiB。失败或 hash 不匹配立即停止，不重试、不替换有效缓存。超时仅终止本任务自己的网络子进程，不触及服务或用户进程。源码只作 tar 成员检查与少量原文读取，不执行，也不全量解包。

一次性 `--initialize-lock` 仅用于本次已授权、尚无锁文件时建立实际下载身份；已有锁时拒绝覆盖。正式 CI 不使用此选项。普通收集只接受已提交锁，无法用下载结果静默改写预期。

## 原文构建材料与用户修改/重链

heic-to 源码包带 `src/index.js`、`src/worker.js`、`src/next/`、`src/iife.js`、两份实际 `src/lib/`、`esbuild.mjs`、package-lock/yarn.lock、README、LICENSE 和 `.tool-versions`。libheif 源码包含完整 C/C++、头文件、CMake、`post.js` 和 `build-emscripten.sh`；libde265 源包包含原生实现、configure/autogen 材料和库目录许可。

原 README 和 `build-emscripten.sh` 也分别原文保存在输出的 `build-materials/`，保留这些实际材料：

- 常规库：`LIBDE265_VERSION=1.0.16 USE_WASM=0 ../build-emscripten.sh ..`。
- 无 unsafe-eval 的变体：额外指定 `USE_UNSAFE_EVAL=0`；这不是当前工具默认入口的声明。
- README 的 LLVM-NM 补丁将 `$EMSDK/upstream/bin/llvm-nm` 改为 `/opt/homebrew/opt/llvm/bin/llvm-nm`；原始导出符号筛选和完整命令保留在原 README，不把某个用户机器路径硬编码为本站运行要求。
- 实际包中的 `buildLibheif` 工厂名称和 ESM 默认导出包装一并保留。修改库后需保持与 `src/worker.js` 调用兼容，并通过该包的 esbuild 流程重建，再以修改版依赖重新构建工具箱。
- 当前库被捆绑在 Worker 字符串里，不能误称可在浏览器直接换一个共享库文件。用户应同时取得完整工具箱源码、锁和构建脚本，以便把接口兼容的修改库重新组合进应用；不限制为调试此类修改而进行的反向工程。

## 许可正文与证据边界

heic-to 的 LGPL、libheif 的完整 COPYING（含 LGPL3、所引用 GPL3 和适用 MIT 部分）、libde265 根目录及库目录 COPYING 均按原字节保存于 `licenses/heic/` 并复制进输出。`HEIC-NOTICES.txt` 随源码保留这些正文及组件身份；各自其他子目录许可仍在原始源码包中。不能把这些组件统一改标为 MIT。

公开脚本默认只主动取得/链接 libde265；AOM、OpenJPEG、WebCodecs、uncompressed 默认不启用。没有证据据此强制把 Mac brew 列表中的每个本机包当成实际链接依赖。

仍应准确保留限制：发布者未记录原始 Emscripten 精确版本（`.tool-versions` 只列 Node 22.19.0），也没有原始完整 CMakeCache/编译收据；libheif 官方 CI 的 3.1.61 仅是可用构建参考，不冒充原发布者环境。CMake 有自动探测可选库的逻辑，因此本记录不宣称已经逐库证明全部链接清单或能位级复现原包。以上不意味着每份已有明确来源的源码都必须先重新构建。
