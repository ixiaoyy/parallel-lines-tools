import { convertMarkdown } from './service';
import {
  ConversionError,
  ConversionRequest,
  ConversionResponse
} from './types';

// 转换仅在当前 Worker 中进行；由主线程在取消或总超时时直接终止，不保留任务或正文。
self.onmessage = async (event: MessageEvent<ConversionRequest>) => {
  try {
    const buffer = await convertMarkdown(event.data.markdown, event.data.font);
    const result: ConversionResponse = { type: 'success', buffer };
    self.postMessage(result, { transfer: [buffer] });
  } catch (error) {
    const result: ConversionResponse = {
      type: 'error',
      code: error instanceof ConversionError ? error.code : 'failed'
    };
    self.postMessage(result);
  }
};
