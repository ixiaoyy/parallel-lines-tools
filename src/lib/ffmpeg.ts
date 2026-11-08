import { FFmpeg } from '@ffmpeg/ffmpeg';
import coreResourceUrl from '@ffmpeg/core?url';
import wasmResourceUrl from '@ffmpeg/core/wasm?url';

export const FFMPEG_LIMITS = {
  loadMs: 45_000,
  taskMs: 120_000,
  totalMs: 180_000,
  cleanupMs: 5_000,
  queueSize: 8
} as const;

type FailureCode =
  | 'cancelled'
  | 'loadTimeout'
  | 'taskTimeout'
  | 'totalTimeout'
  | 'queueLimit';
/** 共享媒体边界使用稳定错误码；调用页面沿现有错误提示处理，不记录文件内容。 */
export class FFmpegTaskError extends Error {
  constructor(public readonly code: FailureCode) {
    super(`FFmpeg task failed: ${code}`);
    this.name = 'FFmpegTaskError';
  }
}

let ffmpegInstance: FFmpeg | null = null;
let loadingInstance: FFmpeg | null = null;
let activeController: AbortController | null = null;
let taskQueue: Promise<unknown> = Promise.resolve();
let queuedTasks = 0;

type FFmpegTaskContext = {
  ffmpeg: FFmpeg;
  tempFile: (extension: string) => string;
};

/** 释放本模块拥有的引擎及其虚拟文件系统，后续排队任务会按需重新加载。 */
function discard(instance: FFmpeg): void {
  if (ffmpegInstance === instance) ffmpegInstance = null;
  if (loadingInstance === instance) loadingInstance = null;
  instance.terminate();
}

/** 为本地加载/执行/排队设置总上限；取消只中断该调用拥有的工作，不终止其他排队任务。 */
function bounded<T>(
  work: Promise<T>,
  milliseconds: number,
  timeoutCode: FailureCode,
  interrupt: () => void,
  signal: AbortSignal
): Promise<T> {
  return new Promise((resolve, reject) => {
    let done = false;
    const finish = (action: () => void) => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      signal.removeEventListener('abort', abort);
      action();
    };
    const abort = () =>
      finish(() => {
        interrupt();
        reject(new FFmpegTaskError('cancelled'));
      });
    const timer = setTimeout(
      () =>
        finish(() => {
          interrupt();
          reject(new FFmpegTaskError(timeoutCode));
        }),
      milliseconds
    );
    work.then(
      (result) => finish(() => resolve(result)),
      (error: unknown) => finish(() => reject(error))
    );
    signal.addEventListener('abort', abort, { once: true });
    if (signal.aborted) abort();
  });
}

/** 在串行队列内部按需加载锁文件中的单线程核心；JS/WASM 均来自本站构建资源，不设 CDN 兜底。 */
async function getFFmpeg(signal: AbortSignal): Promise<FFmpeg> {
  if (ffmpegInstance?.loaded) return ffmpegInstance;
  const candidate = new FFmpeg();
  loadingInstance = candidate;
  let ready = false;
  try {
    await bounded(
      candidate.load({
        coreURL: new URL(coreResourceUrl, window.location.href).href,
        wasmURL: new URL(wasmResourceUrl, window.location.href).href
      }),
      FFMPEG_LIMITS.loadMs,
      'loadTimeout',
      () => discard(candidate),
      signal
    );
    if (signal.aborted) throw new FFmpegTaskError('cancelled');
    ffmpegInstance = candidate;
    ready = true;
    return candidate;
  } finally {
    if (!ready && loadingInstance === candidate) discard(candidate);
    if (loadingInstance === candidate) loadingInstance = null;
  }
}

/**
 * 取消当前正在加载/执行的媒体任务并释放虚拟文件；正常使用时复用同一引擎，无需调用。
 * 不清空排队任务；后续任务会获取新引擎，不继续使用已经终止的实例。
 */
export function resetFFmpeg(): void {
  activeController?.abort();
  const current = ffmpegInstance;
  const loading = loadingInstance;
  if (current) discard(current);
  if (loading && loading !== current) discard(loading);
}

/** 清理本任务登记的临时文件；不存在的输出文件属预期失败，清理异常或超时则释放整台虚拟引擎。 */
async function cleanupFiles(ffmpeg: FFmpeg, files: Set<string>): Promise<void> {
  if (!ffmpeg.loaded || !files.size) return;
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    const result = await Promise.race([
      Promise.allSettled([...files].map((file) => ffmpeg.deleteFile(file))),
      new Promise<null>((resolve) => {
        timer = setTimeout(() => resolve(null), FFMPEG_LIMITS.cleanupMs);
      })
    ]);
    if (result === null || result.some((entry) => entry.status === 'rejected'))
      discard(ffmpeg);
  } finally {
    clearTimeout(timer);
  }
}

/**
 * 串行执行媒体任务，保持原来的 context/返回值合同并清理登记的临时文件。
 * 新 options.signal 可取消自己的排队/加载/执行；旧单参数调用不需改动。
 * 最多八个待处理任务，加载45秒、单任务120秒、含排队总180秒；失败保留拒绝结果，不阻断后续任务。
 */
export async function runFFmpegTask<T>(
  task: (context: FFmpegTaskContext) => Promise<T>,
  options: { signal?: AbortSignal } = {}
): Promise<T> {
  if (queuedTasks >= FFMPEG_LIMITS.queueSize)
    throw new FFmpegTaskError('queueLimit');
  const controller = new AbortController();
  const cancel = () => controller.abort();
  options.signal?.addEventListener('abort', cancel, { once: true });
  if (options.signal?.aborted) controller.abort();
  queuedTasks++;
  // 只捕获队列的控制链，真实失败仍通过返回的 run 向调用者传播。
  const run = taskQueue
    .then(async () => {
      if (controller.signal.aborted) throw new FFmpegTaskError('cancelled');
      activeController = controller;
      const tempFiles = new Set<string>();
      let ffmpeg: FFmpeg | null = null;
      try {
        ffmpeg = await getFFmpeg(controller.signal);
        if (controller.signal.aborted) throw new FFmpegTaskError('cancelled');
        const owned = ffmpeg;
        const tempFile = (extension: string) => {
          const filename = `${crypto.randomUUID()}${extension}`;
          tempFiles.add(filename);
          return filename;
        };
        return await bounded(
          task({ ffmpeg, tempFile }),
          FFMPEG_LIMITS.taskMs,
          'taskTimeout',
          () => discard(owned),
          controller.signal
        );
      } finally {
        if (ffmpeg) await cleanupFiles(ffmpeg, tempFiles);
        if (activeController === controller) activeController = null;
      }
    })
    .finally(() => {
      queuedTasks--;
    });
  taskQueue = run.then(
    () => undefined,
    () => undefined
  );
  try {
    return await bounded(
      run,
      FFMPEG_LIMITS.totalMs,
      'totalTimeout',
      cancel,
      controller.signal
    );
  } finally {
    options.signal?.removeEventListener('abort', cancel);
  }
}
