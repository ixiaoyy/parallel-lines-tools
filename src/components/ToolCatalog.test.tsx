import { createElement, type ReactNode } from 'react';
import { existsSync, statSync } from 'node:fs';
import { posix } from 'node:path';
import { fileURLToPath, URL as NodeURL } from 'node:url';
import { createInstance } from 'i18next';
import { I18nextProvider } from 'react-i18next';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within
} from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { ThemeProvider } from '@mui/material';
import { lightTheme } from '../config/muiConfig';
import ToolFormatFilter from './ToolFormatFilter';
import CatalogToolCard from './CatalogToolCard';
import { externalApps } from '../tools/externalApps';
import downloads from '../tools/extensionDownloads.json';
import { catalogTools, tools } from '../tools';
import { mainSiteTools } from '../tools/mainSiteTools';
import type { DefinedTool } from '../tools/defineTool';
import zh from '../../public/locales/zh/translation.json';
import en from '../../public/locales/en/translation.json';

vi.mock('@iconify/react', () => ({ Icon: () => null }));

const locales = { zh, en };
type Language = keyof typeof locales;

/** 测试使用真实词条；缺少译文时明确失败，避免把原始 key 当成可用文案。 */
function text(language: Language, key: string): string {
  const value = key
    .replace(/^translation:/, '')
    .split('.')
    .reduce<unknown>(
      (entry, name) => (entry as Record<string, unknown>)?.[name],
      locales[language]
    );
  if (typeof value !== 'string') throw new Error(`Missing ${language}: ${key}`);
  return value;
}

function LocationProbe() {
  const { pathname, search } = useLocation();
  return <output data-testid="location">{pathname + search}</output>;
}

async function renderUi(
  children: ReactNode,
  language: Language,
  initialEntry = '/'
) {
  const i18n = createInstance();
  await i18n.init({
    lng: language,
    fallbackLng: false,
    defaultNS: 'translation',
    resources: { [language]: { translation: locales[language] } },
    interpolation: { escapeValue: false }
  });
  return render(
    <I18nextProvider i18n={i18n}>
      <ThemeProvider theme={lightTheme}>
        <MemoryRouter initialEntries={[initialEntry]}>
          {children}
          <LocationProbe />
        </MemoryRouter>
      </ThemeProvider>
    </I18nextProvider>
  );
}

const currentUrl = () =>
  new URL(screen.getByTestId('location').textContent!, 'https://toolbox.test');

/** 每例只替换剪贴板对象，不调用系统剪贴板；结束后恢复原描述符。 */
function mockClipboard(writeText: (value: string) => Promise<void>) {
  const original = Object.getOwnPropertyDescriptor(navigator, 'clipboard');
  Object.defineProperty(navigator, 'clipboard', {
    configurable: true,
    value: { writeText }
  });
  return () => {
    if (original) Object.defineProperty(navigator, 'clipboard', original);
    else Reflect.deleteProperty(navigator, 'clipboard');
  };
}

afterEach(cleanup);

it('keeps the hosted SingleFile package and required materials in the same public version directory', () => {
  const installation = externalApps.find(
    (tool) => tool.path === 'office/singlefile'
  )!.offlineInstall!;
  expect(installation.version).toBe('1.37.0');
  expect(installation.version).toBe(downloads.singlefile.version);
  expect(installation.selfHosted).toBeDefined();
  const resources = [
    [installation.packageUrl, downloads.singlefile.packagePath],
    [installation.selfHosted!.sourceUrl, downloads.singlefile.sourcePath],
    [installation.selfHosted!.licenseUrl, downloads.singlefile.licensePath],
    [installation.selfHosted!.noticeUrl, downloads.singlefile.noticePath]
  ];
  const directory = posix.dirname(installation.packageUrl);
  expect(directory).toContain(`/${installation.version}`);
  for (const [url, publicPath] of resources) {
    expect(url).toBe(`/${publicPath}`);
    expect(posix.dirname(url)).toBe(directory);
    expect(new URL(url, 'https://toolbox.test').origin).toBe(
      'https://toolbox.test'
    );
    // 文件定位使用 Node URL；happy-dom 的浏览器 URL 会错误解析 Windows file: 相对路径。
    const file = fileURLToPath(
      new NodeURL(`../../public/${publicPath}`, import.meta.url)
    );
    expect(existsSync(file), publicPath).toBe(true);
    const info = statSync(file);
    expect(info.isFile(), publicPath).toBe(true);
    expect(info.size, publicPath).toBeGreaterThan(0);
  }
});

describe.each(['zh', 'en'] as const)('tool catalog UI in %s', (language) => {
  it('restores the format from the URL and preserves unrelated query parameters', async () => {
    await renderUi(
      <ToolFormatFilter />,
      language,
      '/categories/office?format=extension&query=invoice&source=saved'
    );
    const group = screen.getByRole('group', {
      name: text(language, 'catalog.formatLabel')
    });
    expect(group.querySelectorAll('button')).toHaveLength(4);
    expect(
      screen.getByRole('button', {
        name: text(language, 'catalog.formats.extension')
      })
    ).toHaveAttribute('aria-pressed', 'true');
    expect(group.querySelectorAll('[aria-pressed="true"]')).toHaveLength(1);

    for (const format of ['desktop', 'online'] as const) {
      const button = screen.getByRole('button', {
        name: text(language, `catalog.formats.${format}`)
      });
      fireEvent.click(button);
      expect(button).toHaveAttribute('aria-pressed', 'true');
      expect(currentUrl().pathname).toBe('/categories/office');
      expect(currentUrl().searchParams.get('format')).toBe(format);
      expect(currentUrl().searchParams.get('query')).toBe('invoice');
      expect(currentUrl().searchParams.get('source')).toBe('saved');
    }

    const allButton = screen.getByRole('button', {
      name: text(language, 'catalog.formats.all')
    });
    fireEvent.click(allButton);
    expect(allButton).toHaveAttribute('aria-pressed', 'true');
    expect(currentUrl().searchParams.has('format')).toBe(false);
    expect(currentUrl().searchParams.get('query')).toBe('invoice');
    expect(currentUrl().searchParams.get('source')).toBe('saved');
    expect(group.querySelectorAll('[aria-pressed="true"]')).toHaveLength(1);
  });

  it('treats an unsupported URL format as all without inventing another option', async () => {
    await renderUi(<ToolFormatFilter />, language, '/?format=unsupported');
    expect(
      screen.getByRole('button', {
        name: text(language, 'catalog.formats.all')
      })
    ).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getAllByRole('button')).toHaveLength(4);
  });

  it('shows desktop installation conditions and the actual official download destination', async () => {
    const tool = externalApps.find(
      (entry) => entry.path === 'office/libreoffice'
    )!;
    await renderUi(<CatalogToolCard tool={tool} />, language);
    expect(
      screen.getByText(text(language, tool.shortDescription))
    ).toBeInTheDocument();
    expect(
      screen.getByText(text(language, 'catalog.formats.desktop'))
    ).toBeInTheDocument();
    expect(
      screen.getByText(text(language, 'catalog.pricing.free'))
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        `${text(language, 'catalog.platformLabel')}：${tool
          .platforms!.map((platform) =>
            text(language, `catalog.platforms.${platform}`)
          )
          .join(' / ')}`
      )
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        `${text(language, 'catalog.publisherLabel')}：${tool.publisher}`
      )
    ).toBeInTheDocument();
    expect(screen.getByText(text(language, tool.notice!))).toBeInTheDocument();

    const download = screen.getByRole('link', {
      name: `${text(language, 'catalog.actions.download')} ↗`
    });
    expect(download).toHaveAttribute('href', tool.externalUrl);
    expect(download).toHaveAttribute('target', '_blank');
    expect(download).toHaveAttribute('rel', 'noopener noreferrer');
    const website = screen.getByRole('link', {
      name: text(language, 'catalog.officialWebsite')
    });
    expect(website).toHaveAttribute('href', tool.officialWebsite);
    expect(website).toHaveAttribute('rel', 'noopener noreferrer');
    expect(
      screen.queryByRole('button', {
        name: text(language, 'catalog.offline.open')
      })
    ).not.toBeInTheDocument();
  });

  it('names the extension store browser and keeps other-browser installation separate', async () => {
    const tool = externalApps.find(
      (entry) => entry.path === 'office/singlefile'
    )!;
    await renderUi(<CatalogToolCard tool={tool} />, language);
    expect(
      screen.getByText(text(language, 'catalog.formats.extension'))
    ).toBeInTheDocument();
    const store = screen.getByRole('link', {
      name: `${text(language, `catalog.stores.${tool.entryBrowser}`)} ↗`
    });
    expect(tool.entryBrowser).toBe('chrome');
    expect(new URL(tool.externalUrl!).hostname).toBe(
      'chromewebstore.google.com'
    );
    expect(store).toHaveAttribute('href', tool.externalUrl);
    expect(store).toHaveAttribute('target', '_blank');
    expect(store).toHaveAttribute('rel', 'noopener noreferrer');
    expect(
      screen.queryByRole('link', {
        name: `${text(language, 'catalog.actions.download')} ↗`
      })
    ).not.toBeInTheDocument();
    const otherBrowsers = screen.getByRole('link', {
      name: text(language, 'catalog.otherBrowsers')
    });
    expect(otherBrowsers).toHaveAttribute('href', tool.officialWebsite);
    expect(otherBrowsers).toHaveAttribute('target', '_blank');
    expect(otherBrowsers).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('keeps reviewed extensions in the real inventory with Chrome defaults and only verified offline entries', () => {
    const extensionTools = externalApps.filter(
      (tool) => tool.formats?.includes('extension')
    );
    const storeIds: Record<string, string> = {
      'office/singlefile': 'mpiodijhokgodhhofbcjdecpffjipkle',
      'string/immersive-translate': 'bpoadfkcbjbfhfodiogcnhhhpibjhbnh',
      'string/simple-translate': 'ibplnjkanclpjokhdolnendpplpjiace',
      'image-generic/gofullpage': 'fdpohaocaechififmbbbbbknoalclacl',
      'office/markdown-reader': 'medapdbncneneejhbgcjceippjlfkmkg',
      'network/ghelper': 'nonmafimegllfoonjgplbabhmgfanaka'
    };
    expect(externalApps).toHaveLength(8);
    expect(extensionTools).toHaveLength(Object.keys(storeIds).length);
    expect(new Set(externalApps.map((tool) => tool.path)).size).toBe(
      externalApps.length
    );
    expect(
      externalApps.some((tool) => /json-viewer|chatgpt/i.test(tool.path))
    ).toBe(false);
    for (const tool of extensionTools) {
      const store = new URL(tool.externalUrl!);
      expect(tool.entryBrowser).toBe('chrome');
      expect(store.hostname).toBe('chromewebstore.google.com');
      expect(store.pathname.split('/').pop()).toBe(storeIds[tool.path]);
      expect(tools).toContain(tool);
      expect(catalogTools).toContain(tool);
      for (const key of [
        tool.name,
        tool.description,
        tool.shortDescription,
        tool.notice!
      ])
        expect(text(language, key).trim()).not.toBe('');
      expect(tool.publisher).toBeTruthy();
      expect(tool.pricing).toBeTruthy();
      expect(tool.platforms).toContain('chrome');
      if (tool.path === 'office/singlefile') {
        expect(tool.offlineInstall?.selfHosted).toBeDefined();
        expect(tool.offlineInstall!.packageUrl).toMatch(/^\/downloads\//);
      } else if (tool.path === 'string/immersive-translate') {
        expect(new URL(tool.offlineInstall!.packageUrl).protocol).toBe(
          'https:'
        );
        expect(tool.offlineInstall?.selfHosted).toBeUndefined();
      } else {
        expect(tool.offlineInstall).toBeUndefined();
      }
    }
    expect(
      extensionTools.find((tool) => tool.path === 'network/ghelper')!.type
    ).toBe('network');
  });

  it('does not advertise an offline package for the four newly listed extensions', async () => {
    for (const path of [
      'string/simple-translate',
      'image-generic/gofullpage',
      'office/markdown-reader',
      'network/ghelper'
    ]) {
      const tool = externalApps.find((entry) => entry.path === path)!;
      await renderUi(<CatalogToolCard tool={tool} />, language);
      expect(
        screen.getByRole('link', { name: text(language, tool.name) })
      ).toHaveAttribute('href', tool.externalUrl);
      expect(
        screen.getByRole('link', {
          name: `${text(language, 'catalog.stores.chrome')} ↗`
        })
      ).toHaveAttribute('href', tool.externalUrl);
      const chromeOnly =
        path === 'office/markdown-reader' || path === 'network/ghelper';
      const website = screen.getByRole('link', {
        name: text(
          language,
          chromeOnly ? 'catalog.officialWebsite' : 'catalog.otherBrowsers'
        )
      });
      expect(website).toHaveAttribute('href', tool.officialWebsite);
      expect(website).toHaveAttribute('target', '_blank');
      expect(website).toHaveAttribute('rel', 'noopener noreferrer');
      expect(
        screen.queryByRole('link', {
          name: text(
            language,
            chromeOnly ? 'catalog.otherBrowsers' : 'catalog.officialWebsite'
          )
        })
      ).not.toBeInTheDocument();
      expect(
        screen.queryByRole('button', {
          name: text(language, 'catalog.offline.open')
        })
      ).not.toBeInTheDocument();
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      cleanup();
    }
  });

  it('groups the hosted download with its source and legal materials while preserving copying and dialog reset', async () => {
    const tool = externalApps.find(
      (entry) => entry.path === 'office/singlefile'
    )!;
    const dialogTitle = text(language, 'catalog.offline.title').replace(
      '{{name}}',
      text(language, tool.name)
    );
    let completeCopy: (() => void) | undefined;
    const writeText = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          completeCopy = resolve;
        })
    );
    const restoreClipboard = mockClipboard(writeText);
    try {
      await renderUi(<CatalogToolCard tool={tool} />, language);
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      fireEvent.click(
        screen.getByRole('button', {
          name: text(language, 'catalog.offline.open')
        })
      );
      const dialog = await screen.findByRole('dialog', { name: dialogTitle });
      const content = within(dialog);
      expect(
        content.getByText(text(language, 'catalog.offline.warning'))
      ).toBeInTheDocument();
      const packageLink = content.getByRole('link', {
        name: text(language, 'catalog.offline.downloadHosted')
      });
      expect(
        content.queryByRole('link', {
          name: text(language, 'catalog.offline.download')
        })
      ).not.toBeInTheDocument();
      const sourceLink = content.getByRole('link', {
        name: text(language, 'catalog.offline.source')
      });
      const licenseLink = content.getByRole('link', {
        name: text(language, 'catalog.offline.license')
      });
      const noticeLink = content.getByRole('link', {
        name: text(language, 'catalog.offline.notices')
      });
      const materials = tool.offlineInstall!.selfHosted!;
      for (const [link, url] of [
        [sourceLink, materials.sourceUrl],
        [licenseLink, materials.licenseUrl],
        [noticeLink, materials.noticeUrl]
      ] as const) {
        expect(link).toHaveAttribute('href', url);
        expect(packageLink.parentElement).toContainElement(link);
      }
      for (const link of [licenseLink, noticeLink]) {
        expect(link).toHaveAttribute('target', '_blank');
        expect(link).toHaveAttribute('rel', 'noopener noreferrer');
      }
      expect(
        content.getByText(text(language, 'catalog.offline.hostedNotice'))
      ).toBeInTheDocument();
      expect(
        content.queryByText(text(language, 'catalog.offline.networkNotice'))
      ).not.toBeInTheDocument();
      const guideLink = content.getByRole('link', {
        name: text(language, 'catalog.offline.guide')
      });
      for (const [link, href] of [
        [packageLink, tool.offlineInstall!.packageUrl],
        [guideLink, tool.offlineInstall!.instructionsUrl]
      ] as const) {
        expect(link).toHaveAttribute('href', href);
        expect(link).toHaveAttribute('target', '_blank');
        expect(link).toHaveAttribute('rel', 'noopener noreferrer');
      }
      const address = content.getByRole('textbox', {
        name: text(language, 'catalog.offline.addressLabel')
      });
      expect(address).toHaveValue('chrome://extensions');
      expect(address).toHaveAttribute('readonly');
      expect(dialog.querySelector('a[href^="chrome:"]')).toBeNull();
      expect(writeText).not.toHaveBeenCalled();
      fireEvent.click(
        content.getByRole('button', {
          name: text(language, 'catalog.offline.copy')
        })
      );
      expect(writeText).toHaveBeenCalledWith('chrome://extensions');
      expect(writeText).toHaveBeenCalledTimes(1);
      expect(
        content.getByRole('button', {
          name: text(language, 'catalog.offline.copying')
        })
      ).toBeDisabled();
      await act(async () => {
        completeCopy!();
      });
      expect(await content.findByRole('status')).toHaveTextContent(
        text(language, 'catalog.offline.copied')
      );
      expect(
        content.getByRole('button', {
          name: text(language, 'catalog.offline.copy')
        })
      ).toBeEnabled();

      fireEvent.click(
        content.getByRole('button', {
          name: text(language, 'catalog.offline.close')
        })
      );
      await waitFor(() =>
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
      );
      fireEvent.click(
        screen.getByRole('button', {
          name: text(language, 'catalog.offline.open')
        })
      );
      const reopened = within(
        await screen.findByRole('dialog', { name: dialogTitle })
      );
      expect(reopened.queryByRole('status')).not.toBeInTheDocument();
      expect(
        reopened.queryByText(text(language, 'catalog.offline.copyFailed'))
      ).not.toBeInTheDocument();
      expect(
        reopened.getByRole('button', {
          name: text(language, 'catalog.offline.copy')
        })
      ).toBeEnabled();
      expect(writeText).toHaveBeenCalledTimes(1);
    } finally {
      restoreClipboard();
    }
  });

  it('shows a clipboard failure without hiding the manually copyable address or carrying the failure into a reopened guide', async () => {
    const tool = externalApps.find(
      (entry) => entry.path === 'string/immersive-translate'
    )!;
    const dialogTitle = text(language, 'catalog.offline.title').replace(
      '{{name}}',
      text(language, tool.name)
    );
    const writeText = vi.fn().mockRejectedValue(new Error('Clipboard denied'));
    const restoreClipboard = mockClipboard(writeText);
    try {
      await renderUi(<CatalogToolCard tool={tool} />, language);
      fireEvent.click(
        screen.getByRole('button', {
          name: text(language, 'catalog.offline.open')
        })
      );
      const content = within(
        await screen.findByRole('dialog', { name: dialogTitle })
      );
      const packageLink = content.getByRole('link', {
        name: text(language, 'catalog.offline.download')
      });
      expect(packageLink).toHaveAttribute(
        'href',
        tool.offlineInstall!.packageUrl
      );
      expect(packageLink).toHaveAttribute('target', '_blank');
      expect(packageLink).toHaveAttribute('rel', 'noopener noreferrer');
      expect(
        content.queryByRole('link', {
          name: text(language, 'catalog.offline.downloadHosted')
        })
      ).not.toBeInTheDocument();
      expect(
        content.queryByRole('link', {
          name: text(language, 'catalog.offline.source')
        })
      ).not.toBeInTheDocument();
      expect(
        content.getByText(text(language, 'catalog.offline.networkNotice'))
      ).toBeInTheDocument();
      fireEvent.click(
        content.getByRole('button', {
          name: text(language, 'catalog.offline.copy')
        })
      );
      const failure = await content.findByText(
        text(language, 'catalog.offline.copyFailed')
      );
      expect(failure.closest('[role="alert"]')).not.toBeNull();
      expect(content.queryByRole('status')).not.toBeInTheDocument();
      expect(
        content.getByRole('textbox', {
          name: text(language, 'catalog.offline.addressLabel')
        })
      ).toHaveValue('chrome://extensions');
      expect(
        content.getByRole('button', {
          name: text(language, 'catalog.offline.copy')
        })
      ).toBeEnabled();
      expect(writeText).toHaveBeenCalledWith('chrome://extensions');
      expect(writeText).toHaveBeenCalledTimes(1);

      fireEvent.click(
        content.getByRole('button', {
          name: text(language, 'catalog.offline.close')
        })
      );
      await waitFor(() =>
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
      );
      fireEvent.click(
        screen.getByRole('button', {
          name: text(language, 'catalog.offline.open')
        })
      );
      const reopened = within(
        await screen.findByRole('dialog', { name: dialogTitle })
      );
      expect(
        reopened.queryByText(text(language, 'catalog.offline.copyFailed'))
      ).not.toBeInTheDocument();
      expect(reopened.queryByRole('status')).not.toBeInTheDocument();
    } finally {
      restoreClipboard();
    }
  });

  it('distinguishes a partially paid extension from entirely free desktop tools', async () => {
    const tool = externalApps.find((entry) => entry.pricing === 'freemium')!;
    await renderUi(<CatalogToolCard tool={tool} />, language);
    expect(
      screen.getByText(text(language, 'catalog.pricing.freemium'))
    ).toBeInTheDocument();
    expect(
      screen.queryByText(text(language, 'catalog.pricing.free'))
    ).not.toBeInTheDocument();
    expect(screen.getByText(text(language, tool.notice!))).toBeInTheDocument();
  });

  it('keeps old online entries usable without inferring platforms, price or publisher', async () => {
    const tool = mainSiteTools[0];
    const { container } = await renderUi(
      <CatalogToolCard tool={tool} />,
      language
    );
    expect(
      screen.getByText(text(language, 'catalog.formats.online'))
    ).toBeInTheDocument();
    const online = screen.getByRole('link', {
      name: `${text(language, 'catalog.actions.online')} ↗`
    });
    expect(online).toHaveAttribute('href', tool.externalUrl);
    expect(online).toHaveAttribute('rel', 'noopener noreferrer');
    expect(
      screen.queryByText(text(language, 'catalog.pricing.free'))
    ).not.toBeInTheDocument();
    expect(container).not.toHaveTextContent(
      text(language, 'catalog.platformLabel')
    );
    expect(container).not.toHaveTextContent(
      text(language, 'catalog.publisherLabel')
    );
    expect(
      screen.queryByRole('button', {
        name: text(language, 'catalog.offline.open')
      })
    ).not.toBeInTheDocument();
  });

  it('keeps bookmark removal inside the card and separate from all navigation links', async () => {
    const tool = externalApps.find(
      (entry) => entry.path === 'office/libreoffice'
    )!;
    const removeBookmark = vi.fn();
    const label = text(language, 'hero.removeBookmark').replace(
      '{{title}}',
      text(language, tool.name)
    );
    const popup = vi.spyOn(window, 'open').mockReturnValue(null);
    try {
      await renderUi(
        <CatalogToolCard tool={tool} onRemoveBookmark={removeBookmark} />,
        language
      );
      const removeButton = screen.getByRole('button', { name: label });
      const download = screen.getByRole('link', {
        name: `${text(language, 'catalog.actions.download')} ↗`
      });
      const card = removeButton.closest('.MuiCard-root');
      expect(card).toContainElement(removeButton);
      expect(card).toContainElement(download);
      expect(removeButton.closest('a')).toBeNull();
      expect(removeButton.querySelector('a')).toBeNull();
      fireEvent.click(removeButton);
      expect(removeBookmark).toHaveBeenCalledTimes(1);
      expect(popup).not.toHaveBeenCalled();
      expect(currentUrl().pathname).toBe('/');

      cleanup();
      await renderUi(<CatalogToolCard tool={tool} />, language);
      expect(
        screen.queryByRole('button', { name: label })
      ).not.toBeInTheDocument();
    } finally {
      popup.mockRestore();
    }
  });

  it('preserves same-tab internal routes rather than treating every card as an external link', async () => {
    const tool: DefinedTool = {
      ...mainSiteTools[0],
      path: 'office/native-example',
      externalUrl: undefined,
      component: () => createElement('div')
    };
    await renderUi(<CatalogToolCard tool={tool} />, language);
    const online = screen.getByRole('link', {
      name: `${text(language, 'catalog.actions.online')} →`
    });
    expect(online).toHaveAttribute('href', '/office/native-example');
    expect(online).not.toHaveAttribute('target');
    expect(online).not.toHaveAttribute('rel');
  });
});
