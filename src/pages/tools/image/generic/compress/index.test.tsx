import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor
} from '@testing-library/react';
import CompressImage from './index';
import {
  compressImages,
  ImageCompressionError,
  validateImageBatch,
  validateImageDimensions
} from './service';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key })
}));
vi.mock('./service', () => ({
  IMAGE_LIMITS: { dimension: 16_384 },
  ImageCompressionError: class extends Error {
    constructor(public readonly code: string) {
      super(code);
    }
  },
  compressImages: vi.fn(),
  validateImageBatch: vi.fn(),
  validateImageDimensions: vi.fn()
}));

const canvasDescriptor = Object.getOwnPropertyDescriptor(
  HTMLCanvasElement.prototype,
  'toDataURL'
);
beforeEach(() => {
  let sequence = 0;
  vi.spyOn(URL, 'createObjectURL').mockImplementation(
    () => `blob:test/${++sequence}`
  );
  vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
  // happy-dom 不实现 Canvas 编码；这里只隔离能力检测，测试选择/下载状态，不冒充编码验收。
  Object.defineProperty(HTMLCanvasElement.prototype, 'toDataURL', {
    configurable: true,
    value: () => 'data:image/webp;base64,dGVzdA=='
  });
  vi.mocked(validateImageDimensions).mockResolvedValue(undefined);
  vi.mocked(compressImages).mockResolvedValue({
    results: [
      new File(['one'], 'one.jpg', { type: 'image/jpeg' }),
      new File(['two'], 'two.jpg', { type: 'image/jpeg' })
    ],
    zipFile: new File(['archive'], 'images.zip', { type: 'application/zip' })
  });
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.resetAllMocks();
  if (canvasDescriptor)
    Object.defineProperty(
      HTMLCanvasElement.prototype,
      'toDataURL',
      canvasDescriptor
    );
  else Reflect.deleteProperty(HTMLCanvasElement.prototype, 'toDataURL');
});

describe('compression selection invalidates old downloads', () => {
  it.each(['invalidImage', 'fileSize'] as const)(
    'removes old image and ZIP results when the next selection fails with %s',
    async (code) => {
      const { container } = render(<CompressImage title="Images" />);
      const picker = container.querySelector(
        'input[type="file"]'
      ) as HTMLInputElement;
      const originalFiles = [
        new File(['first'], 'first.jpg', { type: 'image/jpeg' }),
        new File(['second'], 'second.jpg', { type: 'image/jpeg' })
      ];
      fireEvent.change(picker, { target: { files: originalFiles } });
      await waitFor(() =>
        expect(
          screen.getByRole('button', { name: 'compress.start' })
        ).not.toBeDisabled()
      );
      fireEvent.click(screen.getByRole('button', { name: 'compress.start' }));
      await screen.findByRole('button', { name: 'compress.downloadZip' });
      expect(
        screen.getAllByRole('button', { name: 'compress.download' })
      ).toHaveLength(2);

      if (code === 'fileSize')
        vi.mocked(validateImageBatch).mockImplementationOnce(() => {
          throw new ImageCompressionError(code);
        });
      else
        vi.mocked(validateImageDimensions).mockRejectedValueOnce(
          new ImageCompressionError(code)
        );
      fireEvent.change(picker, {
        target: {
          files: [new File(['bad'], 'bad.jpg', { type: 'image/jpeg' })]
        }
      });

      await screen.findByText(`compress.errors.${code}`);
      expect(
        screen.queryByRole('button', { name: 'compress.downloadZip' })
      ).not.toBeInTheDocument();
      expect(
        screen.queryByRole('button', { name: 'compress.download' })
      ).not.toBeInTheDocument();
      // 原始预览仍可重新处理，但三个旧结果 URL（两张图片和 ZIP）必须及时释放。
      expect(
        screen.getAllByRole('img', { name: 'compress.before' })
      ).toHaveLength(2);
      expect(vi.mocked(URL.revokeObjectURL).mock.calls.flat()).toEqual(
        expect.arrayContaining(['blob:test/3', 'blob:test/4', 'blob:test/5'])
      );
    }
  );
});
