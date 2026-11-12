import React, { ReactNode, useEffect } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor
} from '@testing-library/react';
import PdfToPng from './index';
import { convertPdfToPngImages, PdfPngConversionError } from './service';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, values?: unknown) =>
      `${key}${values ? JSON.stringify(values) : ''}`
  })
}));
vi.mock('./service', () => ({
  convertPdfToPngImages: vi.fn(),
  PdfPngConversionError: class extends Error {
    constructor(
      public readonly code: string,
      public readonly stage: string
    ) {
      super(code);
    }
  }
}));
// 只隔离公共展示壳，验证本页任务生命周期；真实 PDF/Canvas/下载由浏览器另验。
vi.mock('@components/ToolContent', () => ({
  default: ({
    inputComponent,
    resultComponent,
    compute,
    input
  }: {
    inputComponent: ReactNode;
    resultComponent: ReactNode;
    compute: (options: {}, input: unknown) => void;
    input: unknown;
  }) => {
    useEffect(() => {
      compute({}, input);
    }, [compute, input]);
    return (
      <>
        {inputComponent}
        {resultComponent}
      </>
    );
  }
}));
vi.mock('@components/input/ToolPdfInput', () => ({
  default: ({ onChange }: { onChange: (file: File | null) => void }) => (
    <>
      <input
        aria-label="PDF fixture"
        type="file"
        onChange={(event) => onChange(event.target.files?.[0] ?? null)}
      />
      <button onClick={() => onChange(null)}>Clear fixture</button>
    </>
  )
}));
vi.mock('@components/result/ToolMultiFileResult', () => ({
  default: ({
    value,
    zipFile,
    loading
  }: {
    value: File[];
    zipFile: File | null;
    loading: boolean;
  }) => (
    <>
      <div data-testid="spinner">{loading ? 'loading' : 'idle'}</div>
      {value.map((file) => (
        <span key={file.name}>{file.name}</span>
      ))}
      <button disabled={!zipFile}>ZIP fixture</button>
    </>
  )
}));

type Result = Awaited<ReturnType<typeof convertPdfToPngImages>>;
type Options = NonNullable<Parameters<typeof convertPdfToPngImages>[1]>;
const jobs: {
  options: Options;
  resolve: (value: Result) => void;
  reject: (reason: unknown) => void;
}[] = [];
const result = (name: string): Result => ({
  images: [{ blob: new Blob(['synthetic PNG']), filename: name }],
  zipFile: new File(['synthetic archive'], 'fixture.zip')
});

beforeEach(() => {
  jobs.length = 0;
  vi.mocked(convertPdfToPngImages).mockImplementation(
    (_file, options = {}) =>
      new Promise((resolve, reject) => {
        jobs.push({ options, resolve, reject });
      })
  );
});
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});
function select(name: string) {
  fireEvent.change(screen.getByLabelText('PDF fixture'), {
    target: { files: [new File(['synthetic'], name)] }
  });
}

describe('PDF PNG page job ownership', () => {
  it('shows phase/page progress, completes all output and exits loading', async () => {
    render(<PdfToPng title="PDF" />);
    select('one.pdf');
    await waitFor(() => expect(jobs).toHaveLength(1));
    act(
      () =>
        jobs[0].options.onProgress?.({ stage: 'rendering', page: 2, total: 2 })
    );
    expect(screen.getByRole('status')).toHaveTextContent(
      'inline.pngStage_rendering{"page":2,"total":2}'
    );
    await act(async () => jobs[0].resolve(result('page-2.png')));
    expect(screen.getByTestId('spinner')).toHaveTextContent('idle');
    expect(screen.getByText('page-2.png')).toBeVisible();
    expect(
      screen.getByRole('button', { name: 'ZIP fixture' })
    ).not.toBeDisabled();
    expect(screen.getByRole('status')).toHaveTextContent('inline.pngDone');
  });

  it('cancels immediately and never publishes a late successful result', async () => {
    render(<PdfToPng title="PDF" />);
    select('one.pdf');
    await waitFor(() => expect(jobs).toHaveLength(1));
    fireEvent.click(screen.getByRole('button', { name: 'inline.pngCancel' }));
    expect(jobs[0].options.signal?.aborted).toBe(true);
    expect(screen.getByTestId('spinner')).toHaveTextContent('idle');
    await act(async () => jobs[0].resolve(result('stale.png')));
    expect(screen.queryByText('stale.png')).not.toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('inline.pngCancelled');
    expect(screen.getByRole('button', { name: 'ZIP fixture' })).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: 'inline.pngRetry' }));
    await waitFor(() => expect(jobs).toHaveLength(2));
  });

  it('replacing a file aborts the old task and ignores its progress, result and finally', async () => {
    render(<PdfToPng title="PDF" />);
    select('one.pdf');
    await waitFor(() => expect(jobs).toHaveLength(1));
    select('two.pdf');
    await waitFor(() => expect(jobs).toHaveLength(2));
    expect(jobs[0].options.signal?.aborted).toBe(true);
    act(() => {
      jobs[1].options.onProgress?.({ stage: 'encoding', page: 1, total: 3 });
      jobs[0].options.onProgress?.({ stage: 'packing', page: 99, total: 99 });
    });
    await act(async () => jobs[0].resolve(result('old.png')));
    expect(screen.queryByText('old.png')).not.toBeInTheDocument();
    expect(screen.getByTestId('spinner')).toHaveTextContent('loading');
    expect(screen.getByRole('status')).toHaveTextContent(
      'inline.pngStage_encoding{"page":1,"total":3}'
    );
    await act(async () => jobs[1].resolve(result('new.png')));
    expect(screen.getByText('new.png')).toBeVisible();
    expect(screen.getByTestId('spinner')).toHaveTextContent('idle');
  });

  it('clear input cancels and removes old output even when an earlier task later rejects', async () => {
    render(<PdfToPng title="PDF" />);
    select('one.pdf');
    await waitFor(() => expect(jobs).toHaveLength(1));
    await act(async () => jobs[0].resolve(result('old.png')));
    select('two.pdf');
    await waitFor(() => expect(jobs).toHaveLength(2));
    expect(screen.queryByText('old.png')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Clear fixture' }));
    expect(jobs[1].options.signal?.aborted).toBe(true);
    await act(async () => jobs[1].reject(new Error('private PDF content')));
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.getByTestId('spinner')).toHaveTextContent('idle');
    expect(screen.getByRole('button', { name: 'ZIP fixture' })).toBeDisabled();
  });

  it.each(['encoding', 'timeout', 'failed'] as const)(
    'shows a safe %s error, disables ZIP and allows retry without leaving loading active',
    async (code) => {
      render(<PdfToPng title="PDF" />);
      select('one.pdf');
      await waitFor(() => expect(jobs).toHaveLength(1));
      await act(async () =>
        jobs[0].reject(
          code === 'failed'
            ? new Error('PRIVATE ORIGINAL DOCUMENT')
            : new PdfPngConversionError(code, 'encoding')
        )
      );
      expect(screen.getByRole('alert')).toHaveTextContent(
        `inline.pngError_${code}`
      );
      expect(screen.getByRole('alert')).not.toHaveTextContent('PRIVATE');
      expect(screen.getByTestId('spinner')).toHaveTextContent('idle');
      expect(
        screen.getByRole('button', { name: 'ZIP fixture' })
      ).toBeDisabled();
      fireEvent.click(screen.getByRole('button', { name: 'inline.pngRetry' }));
      await waitFor(() => expect(jobs).toHaveLength(2));
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    }
  );

  it('unmount aborts the current work and ignores its late completion', async () => {
    const view = render(<PdfToPng title="PDF" />);
    select('one.pdf');
    await waitFor(() => expect(jobs).toHaveLength(1));
    view.unmount();
    expect(jobs[0].options.signal?.aborted).toBe(true);
    await act(async () => jobs[0].resolve(result('late.png')));
    expect(convertPdfToPngImages).toHaveBeenCalledOnce();
  });
});
