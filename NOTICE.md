# 平行线工具箱开源归属与源码

本项目派生自 OmniTools，基线提交和版本保存在 `upstream-base.json`。原始 MIT 许可和版权保留于 `LICENSE`。本地定制包括中文界面、Markdown 转 Word、图片压缩增强、本地运行资源及交付检查。

不以非 MIT 为由排除组件。实际使用的 GPL、LGPL、AGPL 或其他许可按各组件的真实条款履行，不将根目录 MIT 当作所有依赖的统一许可。用户已经接受按适用许可证提供相关源码；这不代表当前已经公开发布。

构建会生成 `THIRD_PARTY_NOTICES.txt`，覆盖主程序和 Worker 的实际组件、图标作者及许可文本。`licenses/vendor/` 中补充 npm 发布物缺少的已核实许可文件及出处；`licenses/icons/` 保存图标归属、原始及标准许可全文。所有许可文本保持原文。

`toolbox-source-local-20261109.zip` 是本修改版工具箱的应用源码，不能以原版上游仓库链接替代。该包不包含 FFmpeg/codec 的完整对应源码；二进制发布前必须按 `docs/ffmpeg-source-obligations.md` 和 `docs/SOURCE-DELIVERY.md` 补齐具体交付材料。当前本地构建和测试不宣称已经完成生产发布许可验收。

运行资源尚未就绪的条目保留在 `src/config/deferred-tools.json`，旧链接显示具体原因。它们没有被认定为开源许可禁止使用，也未删除上游源码；准备好资源并验证后可以恢复。
