import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor
} from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import MarkdownToDocx from './index';
import { convertInWorker } from './client';

vi.mock('./client', () => ({ convertInWorker: vi.fn() }));
vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key })
}));

describe('Markdown workspace state', () => {
  beforeEach(() => {
    // MUI 会用 -1 取消尚未排期的动画帧；浏览器忽略它，happy-dom 12 却调用 clearImmediate(-1)。
    const cancel = globalThis.cancelAnimationFrame;
    vi.stubGlobal('cancelAnimationFrame', (handle: number) => {
      if (handle !== -1) cancel(handle);
    });
  });
  afterEach(() => {
    cleanup();
    vi.resetAllMocks();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('discards an old result if the input changes while a conversion is finishing', async () => {
    let resolve: ((buffer: ArrayBuffer) => void) | undefined;
    vi.mocked(convertInWorker).mockImplementation(
      () =>
        new Promise((done) => {
          resolve = done;
        })
    );
    render(<MarkdownToDocx title="Markdown" />);
    fireEvent.change(screen.getByTestId('markdown-input'), {
      target: { value: '# 旧内容' }
    });
    fireEvent.click(screen.getByText('markdownToDocx.convert'));
    const signal = vi.mocked(convertInWorker).mock.calls[0][2];
    fireEvent.change(screen.getByTestId('markdown-input'), {
      target: { value: '# 新内容' }
    });
    expect(signal.aborted).toBe(true);
    await act(async () => {
      resolve?.(new ArrayBuffer(16));
    });
    expect(
      screen.queryByText('markdownToDocx.download')
    ).not.toBeInTheDocument();
  });

  it('releases a generated download URL on reset and cannot download the expired result', async () => {
    const create = vi
      .spyOn(URL, 'createObjectURL')
      .mockReturnValue('blob:local-docx');
    const revoke = vi
      .spyOn(URL, 'revokeObjectURL')
      .mockImplementation(() => {});
    vi.mocked(convertInWorker).mockResolvedValue(new ArrayBuffer(16));
    try {
      render(<MarkdownToDocx title="Markdown" />);
      fireEvent.change(screen.getByTestId('markdown-input'), {
        target: { value: '# 当前内容' }
      });
      fireEvent.click(screen.getByText('markdownToDocx.convert'));
      await waitFor(() =>
        expect(screen.getByText('markdownToDocx.download')).toHaveAttribute(
          'href',
          'blob:local-docx'
        )
      );
      fireEvent.click(screen.getByText('markdownToDocx.reset'));
      expect(
        screen.queryByText('markdownToDocx.download')
      ).not.toBeInTheDocument();
      expect(revoke).toHaveBeenCalledWith('blob:local-docx');
    } finally {
      create.mockRestore();
      revoke.mockRestore();
    }
  });
});
