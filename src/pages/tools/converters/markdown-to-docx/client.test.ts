import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { convertInWorker } from './client';
import { CONVERSION_TIMEOUT_MS, ConversionResponse } from './types';

class TestWorker {
  static instances: TestWorker[] = [];
  onmessage: ((event: MessageEvent<ConversionResponse>) => void) | null = null;
  onerror: (() => void) | null = null;
  onmessageerror: (() => void) | null = null;
  postMessage = vi.fn();
  terminate = vi.fn();
  constructor() {
    TestWorker.instances.push(this);
  }
}

describe('Markdown conversion worker lifecycle', () => {
  beforeEach(() => {
    TestWorker.instances = [];
    vi.useFakeTimers();
    vi.stubGlobal('Worker', TestWorker);
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });
  it('resolves a success and terminates its worker and timeout', async () => {
    const promise = convertInWorker(
      '# 文档',
      'sans',
      new AbortController().signal
    );
    const worker = TestWorker.instances[0];
    const buffer = new ArrayBuffer(8);
    worker.onmessage?.(
      new MessageEvent('message', { data: { type: 'success', buffer } })
    );
    expect(await promise).toBe(buffer);
    expect(worker.terminate).toHaveBeenCalledTimes(1);
    expect(vi.getTimerCount()).toBe(0);
  });
  it('aborts without leaving the conversion running', async () => {
    const controller = new AbortController();
    const promise = convertInWorker('# 文档', 'sans', controller.signal);
    const outcome = expect(promise).rejects.toMatchObject({
      code: 'cancelled'
    });
    controller.abort();
    await outcome;
    expect(TestWorker.instances[0].terminate).toHaveBeenCalledTimes(1);
    expect(vi.getTimerCount()).toBe(0);
  });
  it('terminates and reports a total timeout', async () => {
    const promise = convertInWorker(
      '# 文档',
      'sans',
      new AbortController().signal
    );
    const outcome = expect(promise).rejects.toMatchObject({ code: 'timeout' });
    await vi.advanceTimersByTimeAsync(CONVERSION_TIMEOUT_MS);
    await outcome;
    expect(TestWorker.instances[0].terminate).toHaveBeenCalledTimes(1);
  });
  it('reports worker failures instead of returning an empty successful document', async () => {
    const promise = convertInWorker(
      '# 文档',
      'sans',
      new AbortController().signal
    );
    const outcome = expect(promise).rejects.toMatchObject({ code: 'failed' });
    TestWorker.instances[0].onerror?.();
    await outcome;
    expect(vi.getTimerCount()).toBe(0);
  });
});
