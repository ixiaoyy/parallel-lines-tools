import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import imageCompression from 'browser-image-compression';
import JSZip from 'jszip';
import {
  compressImages,
  IMAGE_LIMITS,
  validateImageBatch,
  validateImageDimensions
} from './service';

vi.mock('browser-image-compression', () => ({ default: vi.fn() }));
const options = { maxFileSizeInMB: 1, quality: 80 };
const input = (name = 'photo.jpg', type = 'image/jpeg') =>
  new File([new Uint8Array(100)], name, { type });

/** 只构造用于文件头校验的 PNG，不将它冒充可解码的真实 PNG 样本。 */
function pngHeader(width: number, height: number, animated = false): File {
  const bytes = new Uint8Array(60);
  const view = new DataView(bytes.buffer);
  view.setUint32(0, 0x89504e47);
  view.setUint32(8, 13);
  bytes.set(new TextEncoder().encode('IHDR'), 12);
  view.setUint32(16, width);
  view.setUint32(20, height);
  view.setUint32(33, 0);
  bytes.set(new TextEncoder().encode(animated ? 'acTL' : 'IDAT'), 37);
  return new File([bytes], 'image.png', { type: 'image/png' });
}

describe('bounded image compression', () => {
  beforeEach(() => {
    vi.mocked(imageCompression).mockReset();
    vi.mocked(imageCompression).mockImplementation(
      async (_file, opts) =>
        new File(['encoded'], 'output', { type: opts.fileType })
    );
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('keeps the empty legacy return and validates options', async () => {
    expect(await compressImages([], options)).toBeNull();
    await expect(
      compressImages([input()], { ...options, quality: 0 })
    ).rejects.toMatchObject({ code: 'options' });
    await expect(
      compressImages([input()], { ...options, maxWidthOrHeight: NaN })
    ).rejects.toMatchObject({ code: 'options' });
  });

  it('loads the worker helper from this site and preserves EXIF', async () => {
    await compressImages([input()], options);
    expect(imageCompression).toHaveBeenCalledWith(
      expect.any(File),
      expect.objectContaining({
        preserveExif: true,
        useWebWorker: true,
        maxWidthOrHeight: 1920,
        libURL: expect.stringContaining(window.location.origin)
      })
    );
    expect(vi.mocked(imageCompression).mock.calls[0][1].libURL).not.toContain(
      'cdn.jsdelivr.net'
    );
  });

  it('rejects zero bytes, unsupported types and large batches', () => {
    expect(() =>
      validateImageBatch([new File([], 'empty.jpg', { type: 'image/jpeg' })])
    ).toThrowError('fileSize');
    expect(() =>
      validateImageBatch([input('a.gif', 'image/gif')])
    ).toThrowError('fileType');
    expect(() =>
      validateImageBatch(Array.from({ length: 21 }, () => input()))
    ).toThrowError('count');
  });

  it('stops before calling the encoder when cancelled', async () => {
    const controller = new AbortController();
    controller.abort();
    await expect(
      compressImages([input()], options, { signal: controller.signal })
    ).rejects.toMatchObject({ code: 'cancelled' });
    expect(imageCompression).not.toHaveBeenCalled();
  });

  it('cancels a pending encoder and does not keep a partial batch', async () => {
    const controller = new AbortController();
    vi.mocked(imageCompression).mockImplementation(() => new Promise(() => {}));
    const promise = compressImages([input(), input()], options, {
      signal: controller.signal
    });
    controller.abort();
    await expect(promise).rejects.toMatchObject({ code: 'cancelled' });
    expect(imageCompression).toHaveBeenCalledTimes(1);
  });

  it('enforces a total deadline even if the encoder does not settle', async () => {
    vi.useFakeTimers();
    vi.mocked(imageCompression).mockImplementation(() => new Promise(() => {}));
    const promise = compressImages([input()], options);
    const assertion = expect(promise).rejects.toMatchObject({
      code: 'timeout'
    });
    await vi.advanceTimersByTimeAsync(IMAGE_LIMITS.durationMs);
    await assertion;
  });

  it('rejects failures rather than silently skipping an image', async () => {
    vi.mocked(imageCompression).mockRejectedValueOnce(
      new Error('encoder failed')
    );
    await expect(
      compressImages([input(), input()], options)
    ).rejects.toMatchObject({ code: 'failed' });
    expect(imageCompression).toHaveBeenCalledTimes(1);
  });

  it('does not pretend a browser fallback is the requested format', async () => {
    vi.mocked(imageCompression).mockResolvedValueOnce(
      new File(['png'], 'output.png', { type: 'image/png' })
    );
    await expect(
      compressImages([input()], { ...options, format: 'image/webp' })
    ).rejects.toMatchObject({ code: 'failed' });
  });

  it('uses serial encoding and keeps duplicate names distinct in a ZIP', async () => {
    let active = 0;
    let peak = 0;
    vi.mocked(imageCompression).mockImplementation(async (_file, opts) => {
      active++;
      peak = Math.max(active, peak);
      await Promise.resolve();
      active--;
      return new File(['small'], 'output', { type: opts.fileType });
    });
    const output = await compressImages(
      [input('同名.jpg'), input('同名.jpg')],
      options
    );
    expect(peak).toBe(1);
    expect(output?.results.map((file) => file.name)).toEqual([
      '同名.jpg',
      '同名-2.jpg'
    ]);
    const archive = await JSZip.loadAsync(await output!.zipFile!.arrayBuffer());
    expect(Object.keys(archive.files)).toEqual(['同名.jpg', '同名-2.jpg']);
  });

  it('does not restore the old file when a deliberate conversion grows', async () => {
    const large = new Uint8Array(200);
    vi.mocked(imageCompression).mockResolvedValueOnce(
      new File([large], 'result.png', { type: 'image/png' })
    );
    const output = await compressImages([input()], {
      ...options,
      format: 'image/png',
      maxWidthOrHeight: 100
    });
    expect(output?.results[0].type).toBe('image/png');
    expect(output?.results[0].name).toBe('photo.png');
    expect(output?.results[0].size).toBe(200);
  });

  it('reports completion and supports the requested quality and dimensions', async () => {
    const progress = vi.fn();
    await compressImages(
      [input()],
      { ...options, maxWidthOrHeight: 100, quality: 70 },
      { onProgress: progress }
    );
    expect(progress).toHaveBeenLastCalledWith(100);
    expect(imageCompression).toHaveBeenCalledWith(
      expect.any(File),
      expect.objectContaining({ maxWidthOrHeight: 100, initialQuality: 0.7 })
    );
  });
});

describe('image header preflight', () => {
  it('accepts bounded PNG headers and rejects excessive pixel counts before decoding', async () => {
    await expect(
      validateImageDimensions(pngHeader(100, 200))
    ).resolves.toBeUndefined();
    await expect(
      validateImageDimensions(pngHeader(6000, 6000))
    ).rejects.toMatchObject({ code: 'pixels' });
  });
  it('rejects animated PNG and damaged data', async () => {
    await expect(
      validateImageDimensions(pngHeader(100, 100, true))
    ).rejects.toMatchObject({ code: 'animation' });
    await expect(validateImageDimensions(input())).rejects.toMatchObject({
      code: 'invalidImage'
    });
  });
});
