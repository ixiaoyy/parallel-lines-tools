import markdownDocx, { Packer } from 'markdown-docx';
import { DocumentFont, validateMarkdown } from './types';

/**
 * 将受限长度的 Markdown 转为 DOCX 字节，供隔离 Worker 和结构测试调用。
 * 图片和内联 HTML 均不导入，不下载字体或图片；字体由阅读设备本地回退。
 */
export async function convertMarkdown(
  markdown: string,
  font: DocumentFont = 'sans'
): Promise<ArrayBuffer> {
  validateMarkdown(markdown);
  const chineseFont = font === 'serif' ? 'SimSun' : 'Microsoft YaHei';
  const document = await markdownDocx(markdown, {
    gfm: true,
    breaks: false,
    ignoreImage: true,
    ignoreHtml: true,
    // 覆盖库的默认下载适配器；即使以后调整图片解析，也不得隐式联网取图。
    imageAdapter: async () => null,
    math: { engine: 'katex', libreOfficeCompat: true },
    theme: {
      bodyFont: chineseFont,
      headingFont: chineseFont,
      blockquoteFont: chineseFont,
      codeFont: 'Consolas',
      heading1: '000000',
      heading2: '000000',
      heading3: '000000',
      heading4: '000000',
      heading5: '000000',
      heading6: '000000',
      bodySize: 12,
      lineSpacing: 1.3,
      // Markdown 空行用于分段，不另加空白段落，避免短文档被分隔段挤到多页。
      collapseEmptyLines: true,
      margin: '2cm'
    },
    document: {
      creator: '平行线工具箱 / markdown-docx',
      description: 'Converted locally in the browser'
    }
  });
  return Packer.toArrayBuffer(document);
}
