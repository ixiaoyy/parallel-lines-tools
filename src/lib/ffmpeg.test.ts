import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
  type Mock
} from 'vitest';

const state = vi.hoisted(() => ({
  instances: [] as Array<{
    loaded: boolean;
    load: Mock<[], Promise<boolean>>;
    terminate: Mock<[], void>;
    deleteFile: Mock<[], Promise<boolean>>;
  }>,
  load: vi.fn<[], Promise<boolean>>()
}));
vi.mock('@ffmpeg/core?url', () => ({
  default: '/assets/ffmpeg-core-local.js'
}));
vi.mock('@ffmpeg/core/wasm?url', () => ({
  default: '/assets/ffmpeg-core-local.wasm'
}));
vi.mock('@ffmpeg/ffmpeg', () => ({
  FFmpeg: class {
    loaded = false;
    load = vi.fn(async () => {
      const first = await state.load();
      this.loaded = true;
      return first;
    });
    terminate = vi.fn(() => {
      this.loaded = false;
    });
    deleteFile = vi.fn(async () => true);
    constructor() {
      state.instances.push(this);
    }
  }
}));

let engine: typeof import('./ffmpeg');
beforeEach(async () => {
  vi.resetModules();
  state.instances.length = 0;
  state.load.mockReset();
  state.load.mockResolvedValue(true);
  engine = await import('./ffmpeg');
});
afterEach(() => {
  engine.resetFFmpeg();
  vi.useRealTimers();
});

/** 受控任务闸门只用于验证队列串行/恢复，不调用浏览器或外部网络。 */
function deferred() {
  let resolve: () => void = () => {};
  const promise = new Promise<void>((complete) => {
    resolve = complete;
  });
  return { promise, resolve };
}

describe('local bounded FFmpeg bridge', () => {
  it('loads core and wasm from same-origin assets and keeps the legacy return value', async () => {
    const result = await engine.runFFmpegTask(async ({ tempFile }) => {
      const name = tempFile('.wav');
      expect(name.endsWith('.wav')).toBe(true);
      return 'done';
    });
    expect(result).toBe('done');
    expect(state.instances).toHaveLength(1);
    expect(state.instances[0].load).toHaveBeenCalledWith({
      coreURL: `${window.location.origin}/assets/ffmpeg-core-local.js`,
      wasmURL: `${window.location.origin}/assets/ffmpeg-core-local.wasm`
    });
    expect(state.instances[0].deleteFile).toHaveBeenCalledTimes(1);
    expect(state.instances[0].terminate).not.toHaveBeenCalled();
  });

  it('serializes tasks and reuses one loaded engine', async () => {
    const gate = deferred();
    const order: string[] = [];
    const first = engine.runFFmpegTask(async () => {
      order.push('first');
      await gate.promise;
      order.push('first-done');
    });
    const second = engine.runFFmpegTask(async () => {
      order.push('second');
    });
    await vi.waitFor(() => expect(order).toEqual(['first']));
    gate.resolve();
    await Promise.all([first, second]);
    expect(order).toEqual(['first', 'first-done', 'second']);
    expect(state.instances).toHaveLength(1);
  });

  it('propagates a task error but allows later tasks to run', async () => {
    await expect(
      engine.runFFmpegTask(async () => {
        throw new Error('expected media failure');
      })
    ).rejects.toThrow('expected media failure');
    await expect(engine.runFFmpegTask(async () => 42)).resolves.toBe(42);
    expect(state.instances).toHaveLength(1);
  });

  it('cancels queued work without terminating the task ahead of it', async () => {
    const gate = deferred();
    const first = engine.runFFmpegTask(async () => {
      await gate.promise;
      return 1;
    });
    await vi.waitFor(() => expect(state.instances[0]?.loaded).toBe(true));
    const controller = new AbortController();
    const callback = vi.fn(async () => 2);
    const second = engine.runFFmpegTask(callback, {
      signal: controller.signal
    });
    const check = expect(second).rejects.toMatchObject({ code: 'cancelled' });
    controller.abort();
    await check;
    expect(state.instances[0].terminate).not.toHaveBeenCalled();
    gate.resolve();
    await first;
    await engine.runFFmpegTask(async () => 3);
    expect(callback).not.toHaveBeenCalled();
  });

  it('cancels active execution and starts the next task with a fresh engine', async () => {
    const gate = deferred();
    const controller = new AbortController();
    const first = engine.runFFmpegTask(
      async () => {
        await gate.promise;
        return 1;
      },
      { signal: controller.signal }
    );
    await vi.waitFor(() => expect(state.instances[0]?.loaded).toBe(true));
    const check = expect(first).rejects.toMatchObject({ code: 'cancelled' });
    controller.abort();
    await check;
    expect(state.instances[0].terminate).toHaveBeenCalledTimes(1);
    await expect(engine.runFFmpegTask(async () => 2)).resolves.toBe(2);
    expect(state.instances).toHaveLength(2);
    gate.resolve();
  });

  it('bounds core loading and recovers after timeout', async () => {
    vi.useFakeTimers();
    state.load.mockImplementationOnce(() => new Promise(() => {}));
    const run = engine.runFFmpegTask(async () => 1);
    const check = expect(run).rejects.toMatchObject({ code: 'loadTimeout' });
    await vi.advanceTimersByTimeAsync(engine.FFMPEG_LIMITS.loadMs);
    await check;
    expect(state.instances[0].terminate).toHaveBeenCalledTimes(1);
    await expect(engine.runFFmpegTask(async () => 2)).resolves.toBe(2);
    expect(state.instances).toHaveLength(2);
  });

  it('bounds stalled media work and keeps the queue usable', async () => {
    vi.useFakeTimers();
    const run = engine.runFFmpegTask(async () => new Promise(() => {}));
    const check = expect(run).rejects.toMatchObject({ code: 'taskTimeout' });
    await vi.advanceTimersByTimeAsync(engine.FFMPEG_LIMITS.taskMs);
    await check;
    await expect(engine.runFFmpegTask(async () => 2)).resolves.toBe(2);
    expect(state.instances).toHaveLength(2);
  });

  it('bounds pending queue size', async () => {
    const gate = deferred();
    const runs = Array.from({ length: engine.FFMPEG_LIMITS.queueSize }, () =>
      engine.runFFmpegTask(async () => {
        await gate.promise;
      })
    );
    await expect(engine.runFFmpegTask(async () => {})).rejects.toMatchObject({
      code: 'queueLimit'
    });
    gate.resolve();
    await Promise.all(runs);
  });

  it('reset interrupts current work and queued tasks obtain a fresh engine', async () => {
    const gate = deferred();
    const run = engine.runFFmpegTask(async () => {
      await gate.promise;
    });
    await vi.waitFor(() => expect(state.instances[0]?.loaded).toBe(true));
    const check = expect(run).rejects.toMatchObject({ code: 'cancelled' });
    engine.resetFFmpeg();
    await check;
    await expect(engine.runFFmpegTask(async () => 'restored')).resolves.toBe(
      'restored'
    );
    expect(state.instances).toHaveLength(2);
    gate.resolve();
  });
});
