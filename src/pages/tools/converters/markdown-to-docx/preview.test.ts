import { describe, expect, it } from 'vitest';
import { renderPreview } from './preview';

describe('local Markdown preview', () => {
  it('renders headings, tables and code without interactive links', () => {
    const html = renderPreview(
      '# 标题\n\n| Name | Value |\n| --- | --- |\n| 示例 | 2 |\n\n`code` [link](https://example.invalid)'
    );
    expect(html).toContain('<h1>标题</h1>');
    expect(html).toContain('<table>');
    expect(html).toContain('<code>code</code>');
    expect(html).not.toContain('<a');
    expect(html).not.toContain('https://');
  });
  it('removes resource nodes, scripts, event handlers and arbitrary HTML before insertion', () => {
    const html = renderPreview(
      '![image](https://example.invalid/image.png)\n\n<img src="https://example.invalid/html.png">\n\n<iframe src="https://example.invalid"></iframe>\n\n<script>alert(1)</script>'
    );
    expect(html).not.toMatch(/<img|<iframe|<script|src=|onerror=|https:\/\//i);
  });
  it('keeps empty previews empty and refuses over-limit text', () => {
    expect(renderPreview('  ')).toBe('');
    expect(() => renderPreview('a'.repeat(100001))).toThrow('tooLarge');
  });
});
