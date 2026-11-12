import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import NumberStatistics from './index';
import { CustomSnackBarContext } from '../../../../contexts/CustomSnackBarContext';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, values?: unknown) =>
      key + (values ? JSON.stringify(values) : '')
  })
}));
beforeEach(() => {
  // 与已有 Markdown 测试一致：浏览器忽略 -1，happy-dom 12 的取消实现会误传给 clearImmediate。
  const cancel = globalThis.cancelAnimationFrame;
  vi.stubGlobal('cancelAnimationFrame', (handle: number) => {
    if (handle !== -1) cancel(handle);
  });
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('column statistics workspace', () => {
  it('calculates the example, clears stale output on invalid input and resets without mutating old pages', () => {
    render(
      <MemoryRouter>
        <NumberStatistics />
      </MemoryRouter>
    );
    expect(screen.getByText('statistics.empty')).toBeInTheDocument();
    fireEvent.click(screen.getByText('statistics.example'));
    expect(screen.getByText('35')).toBeInTheDocument();
    expect(screen.getByText('8.75')).toBeInTheDocument();
    fireEvent.change(screen.getByTestId('statistics-input'), {
      target: { value: '1\nbad\n3' }
    });
    expect(screen.getByRole('alert').textContent).toContain(
      'statistics.errors.invalidNumber'
    );
    expect(screen.queryByText('35')).not.toBeInTheDocument();
    expect(screen.queryByText('statistics.copy')).not.toBeInTheDocument();
    fireEvent.click(screen.getByText('statistics.clear'));
    expect(screen.getByText('statistics.empty')).toBeInTheDocument();
    expect(
      screen
        .getByRole('link', { name: 'statistics.advanced' })
        .getAttribute('href')
    ).toBe('/number/sum');
  });

  it('reports clipboard failure rather than silently claiming copied', async () => {
    const showSnackBar = vi.fn();
    const original = Object.getOwnPropertyDescriptor(navigator, 'clipboard');
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: vi.fn().mockRejectedValue(new Error('denied')) }
    });
    try {
      render(
        <CustomSnackBarContext.Provider value={{ showSnackBar }}>
          <MemoryRouter>
            <NumberStatistics />
          </MemoryRouter>
        </CustomSnackBarContext.Provider>
      );
      fireEvent.click(screen.getByText('statistics.example'));
      fireEvent.click(screen.getByText('statistics.copy'));
      await vi.waitFor(() =>
        expect(showSnackBar).toHaveBeenCalledWith(
          'statistics.copyFailed',
          'error'
        )
      );
    } finally {
      if (original) Object.defineProperty(navigator, 'clipboard', original);
      else Reflect.deleteProperty(navigator, 'clipboard');
    }
  });
});
