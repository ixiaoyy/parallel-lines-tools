export type DocumentFont = 'sans' | 'serif';
export type ConversionErrorCode =
  | 'empty'
  | 'tooLarge'
  | 'invalidText'
  | 'unsupportedFile'
  | 'readFailed'
  | 'cancelled'
  | 'timeout'
  | 'failed';

/** 表示可翻译的转换失败；不在错误信息中附加用户文档内容。 */
export class ConversionError extends Error {
  constructor(public readonly code: ConversionErrorCode) {
    super(code);
    this.name = 'ConversionError';
  }
}

export const MAX_MARKDOWN_BYTES = 1024 * 1024;
export const MAX_MARKDOWN_CHARACTERS = 100_000;
export const CONVERSION_TIMEOUT_MS = 30_000;
export const DOCX_MIME =
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

/** 检查浏览器可可靠处理的文本边界；Markdown 的宽松语法本身不作为错误。 */
export function validateMarkdown(markdown: string): void {
  if (!markdown.trim()) throw new ConversionError('empty');
  if (
    markdown.length > MAX_MARKDOWN_CHARACTERS ||
    new TextEncoder().encode(markdown).byteLength > MAX_MARKDOWN_BYTES
  ) {
    throw new ConversionError('tooLarge');
  }
  if (markdown.includes('\0')) throw new ConversionError('invalidText');
}

/** 将文件字节严格解码为 UTF-8；无效编码单独报告，不能用替换字符掩盖损坏。 */
export function decodeMarkdown(data: ArrayBuffer): string {
  let text: string;
  try {
    text = new TextDecoder('utf-8', { fatal: true }).decode(data);
  } catch {
    throw new ConversionError('invalidText');
  }
  validateMarkdown(text);
  return text;
}

export type ConversionRequest = { markdown: string; font: DocumentFont };
export type ConversionResponse =
  | { type: 'success'; buffer: ArrayBuffer }
  | { type: 'error'; code: ConversionErrorCode };
