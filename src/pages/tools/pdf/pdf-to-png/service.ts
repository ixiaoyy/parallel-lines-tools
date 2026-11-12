import * as pdfjsLib from 'pdfjs-dist';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import JSZip from 'jszip';

// 与锁定的 PDF.js 5.6.205 使用同包 ESM worker，不回退外链或其他版本。
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

export const PDF_PNG_TIMEOUTS = {
  total: 10 * 60_000,
  loading: 60_000,
  page: 90_000,
  packing: 120_000,
  cleanup: 5_000
} as const;
export type ConversionProgress = {
  stage: 'loading' | 'rendering' | 'encoding' | 'packing';
  page: number;
  total: number;
};
export type ImagePreview = { blob: Blob; filename: string };
export type PdfPngFailureCode =
  | 'cancelled'
  | 'timeout'
  | 'encoding'
  | 'canvas'
  | 'failed'
  | 'cleanup';

export class PdfPngConversionError extends Error {
  /** 只暴露固定错误码与阶段，不携带文件名、PDF 内容或底层异常原文。 */
  constructor(
    public readonly code: PdfPngFailureCode,
    public readonly stage: ConversionProgress['stage']
  ) {
    super(`pdf_png_${code}`);
    this.name = 'PdfPngConversionError';
  }
}

/** 等待当前阶段；取消由调用链实际停止 reader、PDF worker/render 或 ZIP 分块。 */
function waitForAbort<T>(promise: Promise<T>, signal: AbortSignal): Promise<T> {
  return new Promise((resolve, reject) => {
    const cancel = () => reject(signal.reason);
    signal.addEventListener('abort', cancel, { once: true });
    promise
      .then(resolve, reject)
      .finally(() => signal.removeEventListener('abort', cancel));
    if (signal.aborted) cancel();
  });
}

/** 用可中止的 FileReader 读本地文件，避免取消后仍无限等待读取 Promise。 */
function readPdf(file: File, signal: AbortSignal): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    const clear = () => {
      signal.removeEventListener('abort', cancel);
      reader.onload = reader.onerror = reader.onabort = null;
    };
    const cancel = () => {
      clear();
      reader.abort();
      reject(signal.reason);
    };
    reader.onload = () => {
      const result = reader.result;
      clear();
      if (result instanceof ArrayBuffer) resolve(result);
      else reject(new PdfPngConversionError('failed', 'loading'));
    };
    reader.onerror = reader.onabort = () => {
      clear();
      reject(
        signal.aborted
          ? signal.reason
          : new PdfPngConversionError('failed', 'loading')
      );
    };
    signal.addEventListener('abort', cancel, { once: true });
    if (signal.aborted) cancel();
    else reader.readAsArrayBuffer(file);
  });
}

/** Canvas 原生编码没有取消 API；取消时拒绝本次等待并忽略迟到回调，由外层释放画布。 */
function encodePng(
  canvas: HTMLCanvasElement,
  signal: AbortSignal
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    let settled = false;
    const finish = (blob?: Blob | null) => {
      if (settled) return;
      settled = true;
      signal.removeEventListener('abort', cancel);
      if (signal.aborted) reject(signal.reason);
      else if (blob) resolve(blob);
      else reject(new PdfPngConversionError('encoding', 'encoding'));
    };
    const cancel = () => finish();
    signal.addEventListener('abort', cancel, { once: true });
    if (signal.aborted) cancel();
    else {
      try {
        canvas.toBlob(finish, 'image/png');
      } catch {
        finish(null);
      }
    }
  });
}

/** 流式收集完整 STORE ZIP；取消/超时调用公开 pause 停止分块调度，并丢弃已收集块。 */
function createZip(
  zip: JSZip,
  name: string,
  signal: AbortSignal
): Promise<File> {
  return new Promise((resolve, reject) => {
    const stream = zip.generateInternalStream({
      type: 'uint8array',
      compression: 'STORE',
      streamFiles: true
    });
    let chunks: ArrayBuffer[] = [];
    let settled = false;
    const clear = () => signal.removeEventListener('abort', cancel);
    const cancel = () => {
      stream.pause();
      if (settled) return;
      settled = true;
      chunks = [];
      clear();
      reject(signal.reason);
    };
    stream.on('data', (chunk) => {
      // JSZip 的 resume 内部异步调度；取消前已排队的首块也必须再次暂停，不能重新跑完整归档。
      if (settled || signal.aborted) {
        stream.pause();
        return;
      }
      // 只复制当前视图的字节，既不带入 byteOffset 外的内容，也不把共享底层缓冲传给 File。
      const owned = new ArrayBuffer(chunk.byteLength);
      new Uint8Array(owned).set(chunk);
      chunks.push(owned);
    });
    stream.on('error', () => {
      if (settled) return;
      settled = true;
      chunks = [];
      clear();
      reject(new PdfPngConversionError('failed', 'packing'));
    });
    stream.on('end', () => {
      if (settled) return;
      settled = true;
      clear();
      try {
        resolve(new File(chunks, name, { type: 'application/zip' }));
      } catch {
        reject(new PdfPngConversionError('failed', 'packing'));
      }
      chunks = [];
    });
    signal.addEventListener('abort', cancel, { once: true });
    if (signal.aborted) cancel();
    else stream.resume();
  });
}

/**
 * 本地逐页转换为 scale=2 的全部 PNG 和完整 ZIP，不上传、不删页、不降清晰度。
 * signal 取消整个任务，onProgress 只含阶段/页码；每次独占 PDFWorker，取消时终止 worker。
 * Canvas 编码只能忽略迟到结果，不能强杀浏览器编码线程。
 */
export async function convertPdfToPngImages(
  pdfFile: File,
  options: {
    signal?: AbortSignal;
    onProgress?: (progress: ConversionProgress) => void;
  } = {}
): Promise<{ images: ImagePreview[]; zipFile: File }> {
  const controller = new AbortController();
  const { signal } = controller;
  let stage: ConversionProgress['stage'] = 'loading';
  let ownedWorker: Worker | undefined;
  let worker: pdfjsLib.PDFWorker | undefined;
  let loadingTask: pdfjsLib.PDFDocumentLoadingTask | undefined;
  let renderTask: pdfjsLib.RenderTask | undefined;
  let disposal: Promise<boolean> | undefined;
  let finished = false;
  let cleanupFailed = false;
  let workerReleaseAttempted = false;
  const images: ImagePreview[] = [];
  // 各资源独立释放；一个清理调用抛错不能阻止明确持有的原生 Worker 终止。
  const release = (operation: () => void) => {
    try {
      operation();
    } catch {
      cleanupFailed = true;
    }
  };
  const releaseWorker = () => {
    if (workerReleaseAttempted) return;
    workerReleaseAttempted = true;
    release(() => worker?.destroy());
    release(() => ownedWorker?.terminate());
  };
  const beginDestroy = () => {
    // 取消会关闭 worker 消息通道，原生 destroy 的拒绝转为清理结果，不展开底层错误。
    if (disposal) return disposal;
    try {
      disposal = loadingTask
        ? loadingTask.destroy().then(
            () => true,
            () => false
          )
        : Promise.resolve(true);
    } catch {
      cleanupFailed = true;
      disposal = Promise.resolve(false);
    }
    return disposal;
  };
  const stopWork = () => {
    release(() => renderTask?.cancel());
    beginDestroy();
    releaseWorker();
  };
  const workerFailure = (event: Event) => {
    event.preventDefault();
    controller.abort(new PdfPngConversionError('failed', stage));
  };
  const cancel = () =>
    controller.abort(new PdfPngConversionError('cancelled', stage));
  const timeout = () =>
    controller.abort(new PdfPngConversionError('timeout', stage));
  signal.addEventListener('abort', stopWork, { once: true });
  options.signal?.addEventListener('abort', cancel, { once: true });
  const totalTimer = setTimeout(timeout, PDF_PNG_TIMEOUTS.total);

  /** 为一个阶段设置总等待上限；超时中止整项任务，返回原操作结果并总是清除阶段计时器。 */
  async function phase<T>(
    milliseconds: number,
    operation: () => Promise<T>
  ): Promise<T> {
    const timer = setTimeout(timeout, milliseconds);
    try {
      if (signal.aborted) throw signal.reason;
      return await waitForAbort(operation(), signal);
    } finally {
      clearTimeout(timer);
    }
  }
  // 只报告当前任务仍有效的固定阶段和页码，不传出 PDF 原文或文件名。
  const report = (progress: ConversionProgress) => {
    stage = progress.stage;
    if (!signal.aborted) options.onProgress?.(progress);
  };

  try {
    if (options.signal?.aborted) cancel();
    report({ stage: 'loading', page: 0, total: 0 });
    const pdf = await phase(PDF_PNG_TIMEOUTS.loading, async () => {
      const data = await readPdf(pdfFile, signal);
      if (signal.aborted) throw signal.reason;
      // PDF.js 握手前只在内部局部变量持有线程；显式持有同一 port，启动未响应也能真正 terminate。
      ownedWorker = new Worker(pdfjsWorker, { type: 'module' });
      ownedWorker.addEventListener('error', workerFailure);
      ownedWorker.addEventListener('messageerror', workerFailure);
      worker = pdfjsLib.PDFWorker.create({ port: ownedWorker });
      await waitForAbort(worker.promise, signal);
      if (signal.aborted) throw signal.reason;
      loadingTask = pdfjsLib.getDocument({ data, worker });
      return loadingTask.promise;
    });
    const zip = new JSZip();
    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
      let page: pdfjsLib.PDFPageProxy | undefined;
      let canvas: HTMLCanvasElement | undefined;
      report({ stage: 'rendering', page: pageNumber, total: pdf.numPages });
      try {
        const blob = await phase(PDF_PNG_TIMEOUTS.page, async () => {
          // 取页在取消后若仍迟到，立即清理，不能启动渲染或写入结果。
          page = await pdf.getPage(pageNumber);
          if (signal.aborted) {
            release(() => page?.cleanup());
            throw signal.reason;
          }
          const viewport = page.getViewport({ scale: 2 });
          canvas = document.createElement('canvas');
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          const context = canvas.getContext('2d');
          if (!context) throw new PdfPngConversionError('canvas', 'rendering');
          renderTask = page.render({
            canvas,
            canvasContext: context,
            viewport
          });
          await waitForAbort(renderTask.promise, signal);
          renderTask = undefined;
          report({ stage: 'encoding', page: pageNumber, total: pdf.numPages });
          return encodePng(canvas, signal);
        });
        if (signal.aborted) throw signal.reason;
        const filename = `page-${pageNumber}.png`;
        images.push({ blob, filename });
        zip.file(filename, blob);
      } finally {
        renderTask = undefined;
        release(() => page?.cleanup());
        // 不创建无消费者的预览 URL；逐页释放 Canvas 像素缓冲，PNG Blob 留给结果与 ZIP。
        if (canvas) {
          canvas.width = 0;
          canvas.height = 0;
        }
        if (cleanupFailed) throw new PdfPngConversionError('cleanup', stage);
      }
    }
    report({ stage: 'packing', page: pdf.numPages, total: pdf.numPages });
    const zipFile = await phase(PDF_PNG_TIMEOUTS.packing, () =>
      createZip(zip, pdfFile.name.replace(/\.pdf$/i, '-pages.zip'), signal)
    );
    if (signal.aborted) throw signal.reason;
    finished = true;
    return { images, zipFile };
  } catch (error) {
    images.length = 0;
    if (signal.aborted) throw signal.reason;
    if (error instanceof PdfPngConversionError) throw error;
    throw new PdfPngConversionError('failed', stage);
  } finally {
    clearTimeout(totalTimer);
    // 正常完成最多等五秒原生清理；取消路径已经终止 worker，不等待失联通道的确认。
    const cleanup = beginDestroy();
    let cleanupTimer: ReturnType<typeof setTimeout> | undefined;
    const cleaned = signal.aborted
      ? false
      : await waitForAbort(
          Promise.race([
            cleanup,
            new Promise<false>((resolve) => {
              cleanupTimer = setTimeout(
                () => resolve(false),
                PDF_PNG_TIMEOUTS.cleanup
              );
            })
          ]),
          signal
        ).catch(() => false); // 唯一拒绝来源是取消；stopWork 已同步终止 worker。
    clearTimeout(cleanupTimer);
    releaseWorker();
    ownedWorker?.removeEventListener('error', workerFailure);
    ownedWorker?.removeEventListener('messageerror', workerFailure);
    options.signal?.removeEventListener('abort', cancel);
    signal.removeEventListener('abort', stopWork);
    if (cleanupFailed) throw new PdfPngConversionError('cleanup', stage);
    if (finished && signal.aborted) throw signal.reason;
    if (!cleaned && finished) throw new PdfPngConversionError('cleanup', stage);
  }
}
