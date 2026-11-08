import DOMPurify from 'dompurify';
import { Marked, Renderer } from 'marked';
import { ConversionError, validateMarkdown } from './types';

const renderer = new Renderer();
// 预览的资源节点在生成 HTML 时就被移除，不能用隐藏图片来伪装无外部请求。
renderer.image = () => '';
renderer.html = () => '';
renderer.link = function ({ tokens }) {
  return this.parser.parseInline(tokens);
};
const parser = new Marked({ renderer, gfm: true, async: false });

/** 生成只读近似预览；不渲染图片/HTML/可点击链接，最终仍以 Word 文件为准。 */
export function renderPreview(markdown: string): string {
  if (!markdown.trim()) return '';
  validateMarkdown(markdown);
  const html = parser.parse(markdown);
  if (typeof html !== 'string') throw new ConversionError('failed');
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      'p',
      'h1',
      'h2',
      'h3',
      'h4',
      'h5',
      'h6',
      'ul',
      'ol',
      'li',
      'blockquote',
      'pre',
      'code',
      'table',
      'thead',
      'tbody',
      'tr',
      'th',
      'td',
      'em',
      'strong',
      'del',
      'hr',
      'br',
      'sup',
      'sub'
    ],
    ALLOWED_ATTR: ['start', 'colspan', 'rowspan']
  });
}
