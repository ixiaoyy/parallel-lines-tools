import { CompressionExecution, InitialValuesType } from './types';
import imageCompression from 'browser-image-compression';
import compressionLibraryUrl from 'browser-image-compression/dist/browser-image-compression.js?url';
import JSZip from 'jszip';

export const IMAGE_LIMITS = {
  count: 20,
  fileBytes: 20 * 1024 * 1024,
  totalBytes: 100 * 1024 * 1024,
  pixels: 24_000_000,
  dimension: 16_384,
  durationMs: 120_000
} as const;

type ErrorCode =
  | 'fileType'
  | 'fileSize'
  | 'totalSize'
  | 'count'
  | 'invalidImage'
  | 'pixels'
  | 'animation'
  | 'options'
  | 'cancelled'
  | 'timeout'
  | 'failed';

/** 用稳定错误码交给界面翻译，不把原始文件名或编码器对象写入日志。 */
export class ImageCompressionError extends Error {
  constructor(public readonly code: ErrorCode) {
    super(code);
    this.name = 'ImageCompressionError';
  }
}

/** 校验批量文件的类型、数量和字节上限；不解码图片，也不修改文件。 */
export function validateImageBatch(files: File[]): void {
  if (files.length > IMAGE_LIMITS.count)
    throw new ImageCompressionError('count');
  if (
    files.some(
      (file) => !['image/jpeg', 'image/png', 'image/webp'].includes(file.type)
    )
  )
    throw new ImageCompressionError('fileType');
  if (
    files.some((file) => file.size === 0 || file.size > IMAGE_LIMITS.fileBytes)
  )
    throw new ImageCompressionError('fileSize');
  if (
    files.reduce((total, file) => total + file.size, 0) >
    IMAGE_LIMITS.totalBytes
  )
    throw new ImageCompressionError('totalSize');
}

/** 从受限文件头读取像素尺寸，在浏览器实际解码前排除过大或动画图片。 */
export async function validateImageDimensions(file: File): Promise<void> {
  const buffer = await file.slice(0, 1024 * 1024).arrayBuffer();
  const bytes = new Uint8Array(buffer);
  const view = new DataView(buffer);
  const ascii = (offset: number, size: number) =>
    String.fromCharCode(...bytes.subarray(offset, offset + size));
  let width = 0;
  let height = 0;
  if (
    file.type === 'image/png' &&
    bytes.length >= 24 &&
    view.getUint32(0) === 0x89504e47 &&
    ascii(12, 4) === 'IHDR'
  ) {
    width = view.getUint32(16);
    height = view.getUint32(20);
    for (let offset = 8; offset + 8 <= bytes.length; ) {
      const chunk = ascii(offset + 4, 4);
      if (chunk === 'acTL') throw new ImageCompressionError('animation');
      if (chunk === 'IDAT') break;
      offset += view.getUint32(offset) + 12;
    }
  } else if (
    file.type === 'image/jpeg' &&
    bytes[0] === 0xff &&
    bytes[1] === 0xd8
  ) {
    for (let offset = 2; offset + 9 <= bytes.length; ) {
      if (bytes[offset] !== 0xff) break;
      const marker = bytes[offset + 1];
      if (
        [
          0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd,
          0xce, 0xcf
        ].includes(marker)
      ) {
        height = view.getUint16(offset + 5);
        width = view.getUint16(offset + 7);
        break;
      }
      const length = view.getUint16(offset + 2);
      if (length < 2) break;
      offset += length + 2;
    }
  } else if (
    file.type === 'image/webp' &&
    bytes.length >= 30 &&
    ascii(0, 4) === 'RIFF' &&
    ascii(8, 4) === 'WEBP'
  ) {
    const chunk = ascii(12, 4);
    if (chunk === 'VP8X') {
      if (bytes[20] & 2) throw new ImageCompressionError('animation');
      width = 1 + bytes[24] + (bytes[25] << 8) + (bytes[26] << 16);
      height = 1 + bytes[27] + (bytes[28] << 8) + (bytes[29] << 16);
    } else if (
      chunk === 'VP8 ' &&
      bytes[23] === 0x9d &&
      bytes[24] === 1 &&
      bytes[25] === 0x2a
    ) {
      width = view.getUint16(26, true) & 0x3fff;
      height = view.getUint16(28, true) & 0x3fff;
    } else if (chunk === 'VP8L' && bytes[20] === 0x2f) {
      const bits = view.getUint32(21, true);
      width = 1 + (bits & 0x3fff);
      height = 1 + ((bits >>> 14) & 0x3fff);
    }
  }
  if (!width || !height) throw new ImageCompressionError('invalidImage');
  if (
    width > IMAGE_LIMITS.dimension ||
    height > IMAGE_LIMITS.dimension ||
    width * height > IMAGE_LIMITS.pixels
  )
    throw new ImageCompressionError('pixels');
}

/** 等待本地任务并响应取消；终止时移除监听，底层同时接收同一 signal 释放 Worker。 */
function withAbort<T>(task: Promise<T>, signal: AbortSignal): Promise<T> {
  return new Promise((resolve, reject) => {
    const abort = () => reject(new ImageCompressionError('cancelled'));
    task
      .then(resolve, reject)
      .finally(() => signal.removeEventListener('abort', abort));
    if (signal.aborted) {
      abort();
      return;
    }
    signal.addEventListener('abort', abort, { once: true });
  });
}

/** 为单件下载与 ZIP 分配安全且不区分大小写的唯一文件名，保留原始中文名称。 */
function outputName(name: string, mime: string, used: Set<string>): string {
  const extension =
    mime === 'image/jpeg' ? 'jpg' : mime === 'image/webp' ? 'webp' : 'png';
  const stem =
    name.replace(/\.[^.]*$/, '').replace(/[\\/\p{Cc}]/gu, '_') || 'image';
  let candidate = `${stem}.${extension}`;
  for (let index = 2; used.has(candidate.toLowerCase()); index++)
    candidate = `${stem}-${index}.${extension}`;
  used.add(candidate.toLowerCase());
  return candidate;
}

/**
 * 串行压缩受限批次，返回与输入同序的文件及可选 ZIP；旧调用保持 EXIF、1920 长边与两参数签名。
 * execution 仅控制新入口的取消与整体进度；任何一项失败整批抛出，不伪装部分成功。
 */
export const compressImages = async (
  files: File[],
  options: InitialValuesType,
  execution: CompressionExecution = {}
): Promise<{ results: File[]; zipFile: File | null } | null> => {
  if (!files.length) return null;
  validateImageBatch(files);
  const dimension = options.maxWidthOrHeight ?? 1920;
  const format = options.format ?? 'keep';
  if (
    !Number.isFinite(options.quality) ||
    options.quality < 10 ||
    options.quality > 100 ||
    !Number.isFinite(options.maxFileSizeInMB) ||
    options.maxFileSizeInMB < 0.1 ||
    options.maxFileSizeInMB > 20 ||
    !Number.isInteger(dimension) ||
    dimension < 1 ||
    dimension > IMAGE_LIMITS.dimension ||
    !['keep', 'image/jpeg', 'image/png', 'image/webp'].includes(format)
  )
    throw new ImageCompressionError('options');
  const controller = new AbortController();
  const cancel = () => controller.abort();
  let timedOut = false;
  if (execution.signal?.aborted) controller.abort();
  execution.signal?.addEventListener('abort', cancel, { once: true });
  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, IMAGE_LIMITS.durationMs);
  const usedNames = new Set<string>();
  try {
    const results: File[] = [];
    // 串行且显式限制批次，避免大图同时解码放大峰值内存；Worker 只从本站构建资源加载。
    for (let index = 0; index < files.length; index++) {
      if (controller.signal.aborted)
        throw new ImageCompressionError('cancelled');
      const file = files[index];
      const mime = format === 'keep' ? file.type : format;
      const compressed = await withAbort(
        imageCompression(file, {
          maxSizeMB: options.maxFileSizeInMB,
          maxWidthOrHeight: dimension,
          maxIteration: 10,
          useWebWorker: true,
          libURL: new URL(compressionLibraryUrl, window.location.href).href,
          preserveExif: true,
          initialQuality: options.quality / 100,
          fileType: mime,
          signal: controller.signal,
          onProgress: (percent) =>
            execution.onProgress?.(
              Math.min(
                95,
                Math.round(((index + percent / 100) / files.length) * 95)
              )
            )
        }),
        controller.signal
      );
      if (compressed.type !== mime || !compressed.size)
        throw new ImageCompressionError('failed');
      // 即使结果变大也保留明确选择的格式/尺寸，界面据实际字节提示无收益，不换回不符合尺寸的原图。
      results.push(
        new File([compressed], outputName(file.name, mime, usedNames), {
          type: mime
        })
      );
    }
    let zipFile: File | null = null;
    if (results.length > 1) {
      const zip = new JSZip();
      results.forEach((file) => zip.file(file.name, file));
      const blob = await withAbort(
        zip.generateAsync({ type: 'blob' }, () => {
          if (controller.signal.aborted)
            throw new ImageCompressionError('cancelled');
        }),
        controller.signal
      );
      zipFile = new File([blob], 'compressed-images.zip', {
        type: 'application/zip'
      });
    }
    execution.onProgress?.(100);
    return { results, zipFile };
  } catch {
    throw new ImageCompressionError(
      timedOut ? 'timeout' : controller.signal.aborted ? 'cancelled' : 'failed'
    );
  } finally {
    clearTimeout(timer);
    execution.signal?.removeEventListener('abort', cancel);
    controller.abort();
  }
};
