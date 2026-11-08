// @vitest-environment node
import { describe, expect, it, vi } from 'vitest';
import JSZip from 'jszip';
import { mkdirSync, writeFileSync } from 'node:fs';
import { convertMarkdown } from './service';
import {
  decodeMarkdown,
  MAX_MARKDOWN_CHARACTERS,
  validateMarkdown
} from './types';

const sample = `# 中文文档 / English

## 项目清单

1. 整理资料
2. 生成 Word

- 支持中文
- 支持 English

| 名称 | 数量 | 说明 |
| --- | ---: | --- |
| 示例文档 | 2 | 中英混排与换行 |
| 测试项目 | 12 | 保留表格内容 |

> 一段引用内容。

\`\`\`typescript
const greeting = '你好，World';
\`\`\`

[普通链接](https://pingxingxian.space)

公式：$E = mc^2$

$$
\\frac{a+b}{c}
$$

第一行  
第二行
`;

describe('Markdown DOCX conversion', () => {
  it('creates a real DOCX with Chinese, structure, links, fonts and editable math', async () => {
    const buffer = await convertMarkdown(sample);
    const zip = await JSZip.loadAsync(buffer);
    const document = await zip.file('word/document.xml')!.async('string');
    const styles = await zip.file('word/styles.xml')!.async('string');
    const relationships = await zip
      .file('word/_rels/document.xml.rels')!
      .async('string');

    expect(buffer.byteLength).toBeGreaterThan(5000);
    expect(document).toContain('中文文档 / English');
    expect(document).toContain('整理资料');
    expect(document).toContain('const greeting');
    expect(document).toContain('一段引用内容');
    expect(document).toContain('<w:tbl>');
    expect(document).toContain('<w:numPr>');
    expect(document).toContain('<w:br/>');
    expect(document).toContain('<m:oMath');
    expect(document).toContain('<m:f>');
    expect(styles).toContain('Microsoft YaHei');
    expect(styles).toContain('MdHeading1');
    expect(relationships).toContain('https://pingxingxian.space');

    // 留下同一真实测试输入的可打开样本，供浏览器/Office 渲染验收；不自动暂存。
    mkdirSync(new URL('./fixtures/', import.meta.url), { recursive: true });
    writeFileSync(
      new URL('./fixtures/generated-sample.docx', import.meta.url),
      Buffer.from(buffer)
    );
  });

  it('never fetches Markdown, HTML or reference-style images', async () => {
    const fetch = vi.fn(() => {
      throw new Error('Network forbidden in this test');
    });
    vi.stubGlobal('fetch', fetch);
    try {
      const buffer = await convertMarkdown(`Content

![remote](https://example.invalid/secret.png)

![reference][image]

[image]: https://example.invalid/another.png

<img src="https://example.invalid/html.png" onerror="alert(1)">
`);
      const zip = await JSZip.loadAsync(buffer);
      expect(fetch).not.toHaveBeenCalled();
      expect(
        Object.keys(zip.files).filter((name) => name.startsWith('word/media/'))
      ).toEqual([]);
      expect(
        await zip.file('word/document.xml')!.async('string')
      ).not.toContain('example.invalid');
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it('uses the selected serif font without embedding or downloading a font', async () => {
    const zip = await JSZip.loadAsync(
      await convertMarkdown('宋体测试', 'serif')
    );
    expect(await zip.file('word/styles.xml')!.async('string')).toContain(
      'SimSun'
    );
    expect(
      Object.keys(zip.files).some((name) => name.startsWith('word/fonts/'))
    ).toBe(false);
  });

  it('accepts incomplete Markdown as ordinary text rather than inventing a syntax error', async () => {
    const zip = await JSZip.loadAsync(
      await convertMarkdown('**未结束的强调 [a](broken')
    );
    expect(await zip.file('word/document.xml')!.async('string')).toContain(
      '未结束的强调'
    );
  });
});

describe('Markdown input bounds', () => {
  it('rejects empty and whitespace-only input', () => {
    expect(() => validateMarkdown(' \n\t')).toThrow('empty');
  });
  it('rejects binary content and text over the stated character limit', () => {
    expect(() => validateMarkdown('a\0b')).toThrow('invalidText');
    expect(() =>
      validateMarkdown('a'.repeat(MAX_MARKDOWN_CHARACTERS + 1))
    ).toThrow('tooLarge');
  });
  it('decodes UTF-8 Chinese, including a UTF-8 BOM', () => {
    expect(
      decodeMarkdown(new TextEncoder().encode('\uFEFF# 中文').buffer)
    ).toBe('# 中文');
  });
  it('rejects invalid UTF-8 instead of replacing characters', () => {
    expect(() => decodeMarkdown(new Uint8Array([0xc3, 0x28]).buffer)).toThrow(
      'invalidText'
    );
  });
});
