import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
  type Mock
} from 'vitest';
import JSZip from 'jszip';
import { convertPdfToPngImages, PDF_PNG_TIMEOUTS } from './service';

const mocks = vi.hoisted(() => ({
  getPage: vi.fn(),
  getDocument: vi.fn(),
  worker: vi.fn()
}));
vi.mock('pdfjs-dist', () => ({
  GlobalWorkerOptions: {},
  getDocument: mocks.getDocument,
  PDFWorker: { create: mocks.worker }
}));
vi.mock('pdfjs-dist/build/pdf.worker.min.mjs?url', () => ({
  default: '/fixture-pdf-worker.mjs'
}));

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((yes, no) => {
    resolve = yes;
    reject = no;
  });
  return { promise, resolve, reject };
}
async function flush() {
  for (let i = 0; i < 30; i++) await Promise.resolve();
}
const file = () =>
  new File(['synthetic PDF input; parsing is mocked'], 'office.PDF', {
    type: 'application/pdf'
  });
const readers: Reader[] = [];
class Reader {
  result: ArrayBuffer | null = null;
  onload: ((event: { target: Reader }) => void) | null = null;
  onerror: (() => void) | null = null;
  onabort: (() => void) | null = null;
  aborted = false;
  constructor() {
    readers.push(this);
  }
  readAsArrayBuffer(blob: Blob) {
    void blob.arrayBuffer().then((data) => {
      if (this.aborted) return;
      this.result = data;
      this.onload?.({ target: this });
    });
  }
  abort() {
    this.aborted = true;
    this.onabort?.();
  }
}
let worker: { promise: Promise<void>; destroy: ReturnType<typeof vi.fn> };
let loadingTask: {
  promise: Promise<unknown>;
  destroy: ReturnType<typeof vi.fn>;
};
let pages: ReturnType<typeof makePage>[];
let canvases: HTMLCanvasElement[];
let encode: (callback: BlobCallback) => void;
const nativeWorkers: NativeWorker[] = [];
class NativeWorker extends EventTarget {
  terminate = vi.fn();
  postMessage = vi.fn();
  removeEventListener = vi.fn(
    (...args: Parameters<EventTarget['removeEventListener']>) =>
      super.removeEventListener(...args)
  );
  constructor(
    public readonly url: string,
    public readonly options: WorkerOptions
  ) {
    super();
    nativeWorkers.push(this);
  }
}
function makePage() {
  return {
    getViewport: vi.fn(() => ({ width: 20, height: 30 })),
    cleanup: vi.fn(),
    render: vi.fn(() => ({ promise: Promise.resolve(), cancel: vi.fn() }))
  };
}
beforeEach(() => {
  readers.length = 0;
  nativeWorkers.length = 0;
  canvases = [];
  pages = [makePage(), makePage()];
  worker = { promise: Promise.resolve(), destroy: vi.fn() };
  loadingTask = {
    promise: Promise.resolve({ numPages: 2, getPage: mocks.getPage }),
    destroy: vi.fn().mockResolvedValue(undefined)
  };
  mocks.worker.mockImplementation(() => worker);
  mocks.getDocument.mockReturnValue(loadingTask);
  mocks.getPage.mockImplementation(async (number: number) => pages[number - 1]);
  vi.stubGlobal('FileReader', Reader);
  vi.stubGlobal('Worker', NativeWorker);
  encode = (callback) =>
    callback(new Blob([`png-${canvases.length}`], { type: 'image/png' }));
  vi.spyOn(document, 'createElement').mockImplementation(() => {
    const canvas = {
      width: 0,
      height: 0,
      getContext: vi.fn(() => ({})),
      toBlob: vi.fn((callback: BlobCallback) => encode(callback))
    } as unknown as HTMLCanvasElement;
    canvases.push(canvas);
    return canvas;
  });
});
afterEach(() => {
  vi.restoreAllMocks();
  vi.clearAllMocks();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

type ZipListener = (value?: Uint8Array) => void;
type FakeZipStream = {
  on: Mock<[string, ZipListener], FakeZipStream>;
  pause: Mock<[], void>;
  resume: Mock<[], void>;
};
function hangingZip() {
  const listeners: Record<string, ZipListener> = {};
  const stream: FakeZipStream = {
    on: vi.fn<[string, ZipListener], FakeZipStream>((event, callback) => {
      listeners[event] = callback;
      return stream;
    }),
    pause: vi.fn<[], void>(),
    resume: vi.fn<[], void>()
  };
  vi.spyOn(JSZip.prototype, 'generateInternalStream').mockReturnValue(
    stream as unknown as JSZip.JSZipStreamHelper<Uint8Array>
  );
  return { stream, listeners };
}

describe('PDF PNG conversion', () => {
  it('rejects a null Canvas encoding instead of leaving the conversion pending', async () => {
    encode = (callback) => callback(null);
    await expect(convertPdfToPngImages(file())).rejects.toMatchObject({
      code: 'encoding'
    });
    expect(pages[0].render).toHaveBeenCalledOnce();
    expect(canvases[0].toBlob).toHaveBeenCalledOnce();
    expect(canvases[0].width).toBe(0);
    expect(pages[0].cleanup).toHaveBeenCalled();
    expect(loadingTask.destroy).toHaveBeenCalledOnce();
    expect(worker.destroy).toHaveBeenCalled();
    expect(nativeWorkers).toHaveLength(1);
    expect(nativeWorkers[0].url).toBe('/fixture-pdf-worker.mjs');
    expect(nativeWorkers[0].options).toEqual({ type: 'module' });
    expect(mocks.worker).toHaveBeenCalledWith({ port: nativeWorkers[0] });
    expect(nativeWorkers[0].terminate).toHaveBeenCalledOnce();
  });

  it('keeps scale 2, every page, PNG bytes and a complete original-named STORE ZIP', async () => {
    const progress = vi.fn();
    const result = await convertPdfToPngImages(file(), {
      onProgress: progress
    });
    expect(result.images.map((image) => image.filename)).toEqual([
      'page-1.png',
      'page-2.png'
    ]);
    expect(result.zipFile.name).toBe('office-pages.zip');
    const archive = await JSZip.loadAsync(await result.zipFile.arrayBuffer());
    expect(Object.keys(archive.files)).toEqual(['page-1.png', 'page-2.png']);
    expect(await archive.file('page-1.png')!.async('string')).toBe('png-1');
    expect(await archive.file('page-2.png')!.async('string')).toBe('png-2');
    expect(
      progress.mock.calls.map(([value]) => `${value.stage}:${value.page}`)
    ).toEqual([
      'loading:0',
      'rendering:1',
      'encoding:1',
      'rendering:2',
      'encoding:2',
      'packing:2'
    ]);
    for (const page of pages) {
      expect(page.getViewport).toHaveBeenCalledWith({ scale: 2 });
      expect(page.cleanup).toHaveBeenCalledOnce();
    }
    expect(
      canvases.every((canvas) => canvas.width === 0 && canvas.height === 0)
    ).toBe(true);
    expect(worker.destroy).toHaveBeenCalled();
    expect(mocks.getDocument).toHaveBeenCalledWith(
      expect.objectContaining({ worker })
    );
  });

  it('copies only the ZIP chunk view bytes into owned storage before later source mutation', async () => {
    const backing =
      typeof SharedArrayBuffer === 'undefined'
        ? new ArrayBuffer(4)
        : new SharedArrayBuffer(4);
    const source = new Uint8Array(backing);
    source.set([99, 5, 6, 88]);
    const { stream, listeners } = hangingZip();
    stream.resume.mockImplementation(() => {
      listeners.data(source.subarray(1, 3));
      source[1] = 44;
      listeners.end();
    });
    const result = await convertPdfToPngImages(file());
    expect(
      Array.from(new Uint8Array(await result.zipFile.arrayBuffer()))
    ).toEqual([5, 6]);
  });

  it.each(['parse', 'getPage', 'render', 'canvas', 'encode-throw', 'zip'])(
    'reports %s failures without exposing the underlying message, then cleans resources',
    async (kind) => {
      const sensitive = new Error('PRIVATE PDF TEXT MUST NOT LEAK');
      if (kind === 'parse') loadingTask.promise = Promise.reject(sensitive);
      if (kind === 'getPage') mocks.getPage.mockRejectedValueOnce(sensitive);
      if (kind === 'render')
        pages[0].render.mockReturnValueOnce({
          promise: Promise.reject(sensitive),
          cancel: vi.fn()
        });
      if (kind === 'canvas') {
        vi.mocked(document.createElement).mockImplementationOnce(
          () =>
            ({
              width: 20,
              height: 30,
              getContext: () => null
            }) as unknown as HTMLCanvasElement
        );
      }
      if (kind === 'encode-throw')
        encode = () => {
          throw sensitive;
        };
      if (kind === 'zip') {
        const { listeners, stream } = hangingZip();
        stream.resume.mockImplementation(() => {
          listeners.error();
        });
      }
      const error = await convertPdfToPngImages(file()).catch(
        (error: unknown) => error
      );
      expect(error).toMatchObject({
        code:
          kind === 'canvas'
            ? 'canvas'
            : kind === 'encode-throw'
              ? 'encoding'
              : 'failed'
      });
      expect(String(error)).not.toContain('PRIVATE');
      expect(loadingTask.destroy).toHaveBeenCalled();
      expect(worker.destroy).toHaveBeenCalled();
    }
  );

  it.each(['worker', 'document', 'page'])(
    'bounds an unresponsive %s and actively stops its worker/render work',
    async (kind) => {
      vi.useFakeTimers();
      const never = new Promise<never>(() => {});
      const renderCancel = vi.fn();
      if (kind === 'worker') worker.promise = never;
      if (kind === 'document') loadingTask.promise = never;
      if (kind === 'page')
        pages[0].render.mockReturnValueOnce({
          promise: never,
          cancel: renderCancel
        });
      const conversion = convertPdfToPngImages(file());
      const rejected = expect(conversion).rejects.toMatchObject({
        code: 'timeout'
      });
      await flush();
      await vi.advanceTimersByTimeAsync(
        kind === 'page' ? PDF_PNG_TIMEOUTS.page : PDF_PNG_TIMEOUTS.loading
      );
      await rejected;
      expect(worker.destroy).toHaveBeenCalled();
      if (kind === 'page') expect(renderCancel).toHaveBeenCalledOnce();
      expect(vi.getTimerCount()).toBe(0);
    }
  );

  it('aborts a pending FileReader without creating a PDF worker', async () => {
    vi.spyOn(Reader.prototype, 'readAsArrayBuffer').mockImplementation(
      () => {}
    );
    const controller = new AbortController();
    const conversion = convertPdfToPngImages(file(), {
      signal: controller.signal
    });
    controller.abort();
    await expect(conversion).rejects.toMatchObject({ code: 'cancelled' });
    expect(readers[0].aborted).toBe(true);
    expect(mocks.worker).not.toHaveBeenCalled();
  });

  it('cancels rendering and ignores a late render completion', async () => {
    const pending = deferred<void>();
    const cancel = vi.fn();
    pages[0].render.mockReturnValueOnce({ promise: pending.promise, cancel });
    const controller = new AbortController();
    const conversion = convertPdfToPngImages(file(), {
      signal: controller.signal
    });
    await flush();
    expect(pages[0].render).toHaveBeenCalled();
    controller.abort();
    await expect(conversion).rejects.toMatchObject({ code: 'cancelled' });
    pending.resolve();
    await flush();
    expect(cancel).toHaveBeenCalledOnce();
    expect(canvases[0].toBlob).not.toHaveBeenCalled();
    expect(canvases[0].width).toBe(0);
  });

  it('cleans a getPage result that arrives after cancellation, without rendering it', async () => {
    const pending = deferred<ReturnType<typeof makePage>>();
    mocks.getPage.mockReturnValueOnce(pending.promise);
    const controller = new AbortController();
    const conversion = convertPdfToPngImages(file(), {
      signal: controller.signal
    });
    await flush();
    controller.abort();
    await expect(conversion).rejects.toMatchObject({ code: 'cancelled' });
    pending.resolve(pages[0]);
    await flush();
    expect(pages[0].cleanup).toHaveBeenCalledOnce();
    expect(pages[0].render).not.toHaveBeenCalled();
  });

  it('cancels Canvas waiting, releases the canvas and ignores the non-cancellable native callback', async () => {
    let callback!: BlobCallback;
    encode = (next) => {
      callback = next;
    };
    const controller = new AbortController();
    const zip = vi.spyOn(JSZip.prototype, 'generateInternalStream');
    const conversion = convertPdfToPngImages(file(), {
      signal: controller.signal
    });
    await flush();
    controller.abort();
    await expect(conversion).rejects.toMatchObject({ code: 'cancelled' });
    callback(new Blob(['late PNG']));
    await flush();
    expect(canvases[0].height).toBe(0);
    expect(zip).not.toHaveBeenCalled();
  });

  it.each(['cancel', 'timeout'])(
    'pauses actual ZIP chunk scheduling on %s and rejects late data/end events',
    async (kind) => {
      if (kind === 'timeout') vi.useFakeTimers();
      const { stream, listeners } = hangingZip();
      const controller = new AbortController();
      const conversion = convertPdfToPngImages(file(), {
        signal: controller.signal
      });
      const rejected = expect(conversion).rejects.toMatchObject({
        code: kind === 'timeout' ? 'timeout' : 'cancelled'
      });
      await flush();
      expect(stream.resume).toHaveBeenCalledOnce();
      listeners.data(new Uint8Array([1, 2]));
      if (kind === 'cancel') controller.abort();
      else await vi.advanceTimersByTimeAsync(PDF_PNG_TIMEOUTS.packing);
      await rejected;
      expect(stream.pause).toHaveBeenCalled();
      listeners.data(new Uint8Array([3]));
      listeners.end();
      expect(stream.pause.mock.calls.length).toBeGreaterThan(1);
      expect(worker.destroy).toHaveBeenCalled();
    }
  );

  it('bounds cleanup of a successful result and terminates its worker when the channel will not finish', async () => {
    vi.useFakeTimers();
    loadingTask.destroy.mockReturnValue(new Promise(() => {}));
    const { stream, listeners } = hangingZip();
    stream.resume.mockImplementation(() => listeners.end());
    const conversion = convertPdfToPngImages(file());
    const rejected = expect(conversion).rejects.toMatchObject({
      code: 'cleanup'
    });
    await flush();
    await vi.advanceTimersByTimeAsync(PDF_PNG_TIMEOUTS.cleanup);
    await rejected;
    expect(worker.destroy).toHaveBeenCalled();
    expect(vi.getTimerCount()).toBe(0);
  });

  it('times out native encoding and ignores the callback that arrives after canvas cleanup', async () => {
    vi.useFakeTimers();
    let callback!: BlobCallback;
    encode = (next) => {
      callback = next;
    };
    const conversion = convertPdfToPngImages(file());
    const rejected = expect(conversion).rejects.toMatchObject({
      code: 'timeout',
      stage: 'encoding'
    });
    await flush();
    await vi.advanceTimersByTimeAsync(PDF_PNG_TIMEOUTS.page);
    await rejected;
    callback(new Blob(['late']));
    expect(canvases[0].width).toBe(0);
    expect(worker.destroy).toHaveBeenCalled();
    expect(vi.getTimerCount()).toBe(0);
  });

  it('can still cancel while the completed document is waiting for cleanup', async () => {
    vi.useFakeTimers();
    loadingTask.destroy.mockReturnValue(new Promise(() => {}));
    const { stream, listeners } = hangingZip();
    stream.resume.mockImplementation(() => listeners.end());
    const controller = new AbortController();
    const conversion = convertPdfToPngImages(file(), {
      signal: controller.signal
    });
    const rejected = expect(conversion).rejects.toMatchObject({
      code: 'cancelled'
    });
    await vi.waitFor(() => expect(loadingTask.destroy).toHaveBeenCalled(), {
      interval: 1,
      timeout: 100
    });
    controller.abort();
    await rejected;
    expect(worker.destroy).toHaveBeenCalled();
    expect(vi.getTimerCount()).toBe(0);
  });

  it('enforces the whole-job deadline across otherwise individually valid pages without dropping pages', async () => {
    vi.useFakeTimers();
    pages = Array.from({ length: 10 }, makePage);
    for (const page of pages)
      page.render.mockImplementation(() => {
        let timer: ReturnType<typeof setTimeout>;
        const promise = new Promise<void>((resolve) => {
          timer = setTimeout(resolve, 80_000);
        });
        return { promise, cancel: vi.fn(() => clearTimeout(timer)) };
      });
    loadingTask.promise = Promise.resolve({
      numPages: 10,
      getPage: mocks.getPage
    });
    const conversion = convertPdfToPngImages(file());
    const rejected = expect(conversion).rejects.toMatchObject({
      code: 'timeout',
      stage: 'rendering'
    });
    await flush();
    await vi.advanceTimersByTimeAsync(PDF_PNG_TIMEOUTS.total);
    await rejected;
    expect(mocks.getPage).toHaveBeenCalledTimes(8);
    expect(worker.destroy).toHaveBeenCalled();
    expect(vi.getTimerCount()).toBe(0);
  });

  it('terminates the owned silent port while the real PDF.js GetDocRequest never receives a response', async () => {
    // 仅真实接线 PDF.js 的消息层；fake port 不响应，不解析文件、不渲染，也不创建真正后台线程。
    vi.stubGlobal('DOMMatrix', class {});
    const actual =
      await vi.importActual<typeof import('pdfjs-dist')>('pdfjs-dist');
    mocks.worker.mockImplementation(({ port }: { port: Worker }) =>
      actual.PDFWorker.create({ port })
    );
    mocks.getDocument.mockImplementation((options) =>
      actual.getDocument(options)
    );
    vi.useFakeTimers();
    const conversion = convertPdfToPngImages(file());
    const rejected = expect(conversion).rejects.toMatchObject({
      code: 'timeout',
      stage: 'loading'
    });
    await vi.waitFor(
      () => {
        expect(nativeWorkers).toHaveLength(1);
        expect(
          nativeWorkers[0].postMessage.mock.calls.some(
            ([message]) => message.action === 'GetDocRequest'
          )
        ).toBe(true);
      },
      { interval: 1, timeout: 100 }
    );
    await vi.advanceTimersByTimeAsync(PDF_PNG_TIMEOUTS.loading);
    await rejected;
    expect(nativeWorkers).toHaveLength(1);
    expect(nativeWorkers[0].terminate).toHaveBeenCalledOnce();
    expect(nativeWorkers[0].removeEventListener).toHaveBeenCalledWith(
      'error',
      expect.any(Function)
    );
    expect(nativeWorkers[0].removeEventListener).toHaveBeenCalledWith(
      'messageerror',
      expect.any(Function)
    );
    expect(vi.getTimerCount()).toBe(0);
  });

  it.each(['error', 'messageerror'])(
    'fails immediately on native worker %s without waiting for its loading deadline',
    async (kind) => {
      loadingTask.promise = new Promise(() => {});
      const conversion = convertPdfToPngImages(file());
      const rejected = expect(conversion).rejects.toMatchObject({
        code: 'failed',
        stage: 'loading'
      });
      await flush();
      const event = new Event(kind, { cancelable: true });
      nativeWorkers[0].dispatchEvent(event);
      await rejected;
      expect(event.defaultPrevented).toBe(true);
      expect(nativeWorkers[0].terminate).toHaveBeenCalledOnce();
      expect(nativeWorkers[0].removeEventListener).toHaveBeenCalledWith(
        kind,
        expect.any(Function)
      );
    }
  );

  it.each(['native', 'wrapper'])(
    'reports a safe failure for %s constructor errors and terminates any already-created port',
    async (kind) => {
      if (kind === 'native')
        vi.stubGlobal(
          'Worker',
          class {
            constructor() {
              throw new Error('PRIVATE WORKER ERROR');
            }
          }
        );
      else
        mocks.worker.mockImplementationOnce(() => {
          throw new Error('PRIVATE WRAPPER ERROR');
        });
      const error = await convertPdfToPngImages(file()).catch(
        (error: unknown) => error
      );
      expect(error).toMatchObject({ code: 'failed', stage: 'loading' });
      expect(String(error)).not.toContain('PRIVATE');
      expect(nativeWorkers).toHaveLength(kind === 'native' ? 0 : 1);
      if (kind === 'wrapper')
        expect(nativeWorkers[0].terminate).toHaveBeenCalledOnce();
    }
  );

  it.each([
    'document-destroy',
    'document-reject',
    'wrapper-destroy',
    'native-terminate'
  ])(
    'keeps cleanup failure fixed and attempts native termination despite %s exceptions',
    async (kind) => {
      const { stream, listeners } = hangingZip();
      stream.resume.mockImplementation(() => listeners.end());
      if (kind === 'document-destroy')
        loadingTask.destroy.mockImplementation(() => {
          throw new Error('PRIVATE CLEANUP');
        });
      if (kind === 'document-reject')
        loadingTask.destroy.mockRejectedValue(new Error('PRIVATE CLEANUP'));
      if (kind === 'wrapper-destroy')
        worker.destroy.mockImplementation(() => {
          throw new Error('PRIVATE CLEANUP');
        });
      const conversion = convertPdfToPngImages(file(), {
        onProgress: (progress) => {
          if (kind === 'native-terminate' && progress.stage === 'packing') {
            nativeWorkers[0].terminate.mockImplementation(() => {
              throw new Error('PRIVATE CLEANUP');
            });
          }
        }
      });
      const error = await conversion.catch((error: unknown) => error);
      expect(error).toMatchObject({ code: 'cleanup' });
      expect(String(error)).not.toContain('PRIVATE');
      expect(nativeWorkers[0].terminate).toHaveBeenCalledOnce();
      expect(nativeWorkers[0].removeEventListener).toHaveBeenCalledWith(
        'error',
        expect.any(Function)
      );
    }
  );

  it('still terminates the native handle when render cancellation throws', async () => {
    pages[0].render.mockReturnValueOnce({
      promise: new Promise(() => {}),
      cancel: vi.fn<[], void>(() => {
        throw new Error('PRIVATE CANCEL');
      })
    });
    const controller = new AbortController();
    const conversion = convertPdfToPngImages(file(), {
      signal: controller.signal
    });
    const rejected = expect(conversion).rejects.toMatchObject({
      code: 'cleanup'
    });
    await flush();
    controller.abort();
    await rejected;
    expect(nativeWorkers[0].terminate).toHaveBeenCalledOnce();
    expect(canvases[0].width).toBe(0);
  });
});
