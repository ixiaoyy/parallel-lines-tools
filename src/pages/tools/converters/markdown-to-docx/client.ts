import {
  CONVERSION_TIMEOUT_MS,
  ConversionError,
  ConversionResponse,
  DocumentFont,
  validateMarkdown
} from './types';

/** 在独立 Worker 转换一份文档；信号取消、错误和 30 秒总超时都会终止 Worker。 */
export async function convertInWorker(
  markdown: string,
  font: DocumentFont,
  signal: AbortSignal
): Promise<ArrayBuffer> {
  validateMarkdown(markdown);
  if (signal.aborted) throw new ConversionError('cancelled');
  return new Promise((resolve, reject) => {
    const worker = new Worker(new URL('./worker.ts', import.meta.url), {
      type: 'module'
    });
    let settled = false;
    const finish = (error?: ConversionError, buffer?: ArrayBuffer) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      signal.removeEventListener('abort', abort);
      worker.terminate();
      if (error) reject(error);
      else if (buffer) resolve(buffer);
      else reject(new ConversionError('failed'));
    };
    const abort = () => finish(new ConversionError('cancelled'));
    const timer = setTimeout(
      () => finish(new ConversionError('timeout')),
      CONVERSION_TIMEOUT_MS
    );
    signal.addEventListener('abort', abort, { once: true });
    worker.onerror = () => finish(new ConversionError('failed'));
    worker.onmessageerror = () => finish(new ConversionError('failed'));
    worker.onmessage = (event: MessageEvent<ConversionResponse>) => {
      if (
        event.data.type === 'success' &&
        event.data.buffer instanceof ArrayBuffer
      )
        finish(undefined, event.data.buffer);
      else if (event.data.type === 'error')
        finish(new ConversionError(event.data.code));
      else finish(new ConversionError('failed'));
    };
    try {
      worker.postMessage({ markdown, font });
    } catch {
      finish(new ConversionError('failed'));
    }
  });
}
