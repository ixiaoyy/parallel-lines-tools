import { afterEach, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ThemeProvider } from '@mui/material';
import { lightTheme } from '../config/muiConfig';
import Hero from './Hero';

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
});
