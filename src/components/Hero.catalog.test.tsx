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
import { catalogTools, filterToolsByFormat, getToolsByCategory } from '../tools';
import Categories from '../pages/home/Categories';

const translations = vi.hoisted(() => ({
  t: (key: string, options?: { count?: number }) =>
    options?.count === undefined ? key : key + ' ' + options.count,
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

it('shows a counted category index and reveals the new groups on demand', () => {
  render(
    <ThemeProvider theme={lightTheme}>
      <MemoryRouter>
        <Hero>
          <Categories />
        </Hero>
      </MemoryRouter>
    </ThemeProvider>
  );
  const index = within(
    screen.getByRole('navigation', { name: 'hero.categoriesTitle' })
  );
  const categoryCount = getToolsByCategory(
    [],
    translations.t as Parameters<typeof getToolsByCategory>[1]
  ).length;
  expect(index.getAllByRole('link')).toHaveLength(6);
  expect(
    index.queryByRole('link', { name: /^translation:categories.security.title/ })
  ).not.toBeInTheDocument();
  fireEvent.click(
    screen.getByRole('button', {
      name: 'catalog.viewAllCategories ' + categoryCount
    })
  );
  expect(index.getAllByRole('link')).toHaveLength(categoryCount);
  const link = index.getByRole('link', {
    name: /^translation:categories.security.title \d+$/
  });
  expect(link).toHaveAttribute('href', '/categories/security');

  const collapse = screen.getByRole('button', {
    name: 'catalog.collapseCategories'
  });
  expect(collapse).toHaveAttribute('aria-expanded', 'true');
  fireEvent.click(collapse);
  expect(index.getAllByRole('link')).toHaveLength(6);
});

it('expands only the selected installation format and can return to its six featured entries', () => {
  render(
    <ThemeProvider theme={lightTheme}>
      <MemoryRouter initialEntries={['/?format=extension']}>
        <Hero>
          <Categories />
        </Hero>
      </MemoryRouter>
    </ThemeProvider>
  );
  const extensionCount = filterToolsByFormat(catalogTools, 'extension').length;
  const lastExtension = 'translation:externalApps.vimium.title';
  expect(screen.queryByRole('link', { name: lastExtension })).toBeNull();
  fireEvent.click(
    screen.getByRole('button', {
      name: 'catalog.viewAllEntries ' + extensionCount
    })
  );
  expect(screen.getByRole('link', { name: lastExtension })).toBeVisible();
  expect(
    screen.queryByRole('link', {
      name: 'translation:externalApps.libreoffice.title'
    })
  ).not.toBeInTheDocument();
  const groups = within(
    screen.getByRole('navigation', { name: 'hero.categoriesTitle' })
  );
  expect(
    groups.getByRole('link', { name: /^translation:categories.security.title/ })
  ).toHaveAttribute('href', '/categories/security?format=extension');
  fireEvent.click(screen.getByRole('button', { name: 'catalog.showFeatured' }));
  expect(screen.queryByRole('link', { name: lastExtension })).toBeNull();
});

it('can browse all desktop apps even when the current format has no bookmarks', async () => {
  const saved = 'number/sum,office/singlefile';
  localStorage.setItem('bookmarkedTools', saved);
  render(
    <ThemeProvider theme={lightTheme}>
      <MemoryRouter initialEntries={['/?format=desktop']}>
        <Hero />
      </MemoryRouter>
    </ThemeProvider>
  );
  expect(await screen.findByText('catalog.noMatchingBookmarks')).toBeVisible();
  fireEvent.click(
    screen.getByRole('button', {
      name:
        'catalog.viewAllEntries ' +
        filterToolsByFormat(catalogTools, 'desktop').length
    })
  );
  expect(
    screen.getByRole('link', { name: 'translation:externalApps.wiztree.title' })
  ).toBeVisible();
  fireEvent.click(screen.getByRole('button', { name: 'catalog.showBookmarks' }));
  expect(screen.getByText('catalog.noMatchingBookmarks')).toBeVisible();
  expect(localStorage.getItem('bookmarkedTools')).toBe(saved);
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
