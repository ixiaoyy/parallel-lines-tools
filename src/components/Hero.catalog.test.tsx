import { afterEach, expect, it, vi } from 'vitest';
import {
  cleanup,
  fireEvent,
  render,
  screen,
  within
} from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ThemeProvider } from '@mui/material';
import { lightTheme } from '../config/muiConfig';
import Hero from './Hero';
import {
  pickWorkbenchTools,
  untilWorkbenchDayChanges,
  workbenchDay
} from '../tools/homeDiscovery';
import { catalogTools } from '../tools';

const translations = vi.hoisted(() => ({
  t: (key: string) => key,
  i18n: {
    resolvedLanguage: 'zh',
    loadNamespaces: (_names: unknown, callback: (errors?: unknown) => void) =>
      callback()
  }
}));
vi.mock('react-i18next', async (importOriginal) => ({
  ...(await importOriginal<typeof import('react-i18next')>()),
  useTranslation: () => translations
}));
vi.mock('@iconify/react', () => ({ Icon: () => null }));
vi.mock('../providers/UserTypeFilterProvider', () => ({
  useUserTypeFilter: () => ({ selectedUserTypes: [] })
}));

afterEach(() => {
  cleanup();
  localStorage.clear();
  vi.restoreAllMocks();
});

it('still renders bookmarked legacy tools even though ordinary catalog search excludes them', async () => {
  localStorage.setItem('bookmarkedTools', 'number/sum,number/generate');
  render(
    <ThemeProvider theme={lightTheme}>
      <MemoryRouter>
        <Hero />
      </MemoryRouter>
    </ThemeProvider>
  );
  expect(
    (
      await screen.findByRole('link', { name: 'number:sum.title' })
    ).getAttribute('href')
  ).toBe('/number/sum');
  expect(
    (
      await screen.findByRole('link', { name: 'number:generate.title' })
    ).getAttribute('href')
  ).toBe('/number/generate');
  expect(localStorage.getItem('bookmarkedTools')).toBe(
    'number/sum,number/generate'
  );
  expect(
    screen.queryByRole('region', { name: 'hero.workbench.label' })
  ).not.toBeInTheDocument();
});

it('keeps the same shortlist for a Beijing date and changes it at midnight', () => {
  const before = Date.parse('2026-11-26T15:59:59Z');
  const after = before + 1000;
  const paths = (now: number) =>
    pickWorkbenchTools(catalogTools, workbenchDay(now)).map(
      (tool) => tool.path
    );
  expect(untilWorkbenchDayChanges(before)).toBe(1000);
  expect(paths(before)).toEqual(paths(before - 60_000));
  expect(new Set(paths(before)).size).toBe(2);
  expect(paths(after)).not.toEqual(paths(before));
  expect(pickWorkbenchTools([], workbenchDay(before))).toEqual([]);
  const one = catalogTools.find(({ path }) => path === 'image-generic/photopea')!;
  expect(pickWorkbenchTools([one], workbenchDay(before))).toEqual([one]);
});

it('lets users switch the first display between two tools without navigating', () => {
  vi.spyOn(Date, 'now').mockReturnValue(Date.parse('2026-11-26T09:00:00Z'));
  render(
    <ThemeProvider theme={lightTheme}>
      <MemoryRouter>
        <Hero />
      </MemoryRouter>
    </ThemeProvider>
  );
  const preview = within(
    screen.getByRole('region', { name: 'hero.workbench.label' })
  );
  const modelTab = preview.getByRole('button', {
    name: 'translation:externalApps.hunyuan3d.title'
  });
  const beadTab = preview.getByRole('button', {
    name: 'hero.workbench.bead.tab'
  });
  expect(beadTab).toHaveAttribute('aria-pressed', 'true');
  const beadLink = preview.getByRole('link', {
    name: 'hero.workbench.bead.action'
  });
  expect(beadLink).toHaveAttribute(
    'href',
    'https://pingxingxian.space/tools/bead-pattern'
  );
  expect(beadLink).toHaveAttribute('target', '_blank');
  fireEvent.click(modelTab);
  expect(modelTab).toHaveAttribute('aria-pressed', 'true');
  expect(
    preview.getByRole('link', { name: 'hero.workbench.model.action' })
  ).toHaveAttribute('href', 'https://3d.hunyuan.tencent.com/');
  expect(beadLink).not.toBeInTheDocument();
});

it('shows neither home samples nor task shortcuts when viewing a category', () => {
  render(
    <ThemeProvider theme={lightTheme}>
      <MemoryRouter>
        <Hero showShortcuts={false} />
      </MemoryRouter>
    </ThemeProvider>
  );
  expect(
    screen.queryByRole('region', { name: 'hero.workbench.label' })
  ).not.toBeInTheDocument();
  expect(
    screen.queryByRole('region', { name: 'hero.workbench.creative' })
  ).not.toBeInTheDocument();
});
