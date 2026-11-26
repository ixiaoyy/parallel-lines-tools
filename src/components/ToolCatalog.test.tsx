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
import {
  catalogTools,
  filterTools,
  filterToolsByFormat,
  getToolsByCategory,
  tools
} from '../tools';
import { mainSiteTools } from '../tools/mainSiteTools';
import type { DefinedTool } from '../tools/defineTool';
import zh from '../../public/locales/zh/translation.json';
import en from '../../public/locales/en/translation.json';
import localIcons from '../assets/local-icons.json';

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

it('uses only locally registered icons for the catalog cards and categories', () => {
  const bundled = new Set(
    localIcons.flatMap(({ prefix, icons, aliases }) =>
      [...Object.keys(icons), ...Object.keys(aliases)].map(
        (name) => prefix + ':' + name
      )
    )
  );
  const categories = getToolsByCategory(
    [],
    ((key: string) => text('zh', key)) as Parameters<typeof getToolsByCategory>[1]
  );
  const missing = [...externalApps, ...categories].flatMap(({ icon }) =>
    typeof icon === 'string' && !bundled.has(icon) ? [icon] : []
  );
  expect(missing).toEqual([]);
});

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
      'network/ghelper': 'nonmafimegllfoonjgplbabhmgfanaka',
      'office/dark-reader': 'eimadpbcbfnmbkopoojfekhnkhdbieeh',
      'office/tab-session-manager': 'iaiomicjabeggjcfkbimgmglanimpnae',
      'network/ublock-origin-lite': 'ddkjiahejlhfcafbddmgiahcphecmpfh',
      'office/bitwarden': 'nngceckbapebfimnlniiiahkandclblb',
      'office/vimium': 'dbepggeogbaibhgnhhndojpepiihcmeb'
    };
    expect(
      filterToolsByFormat(externalApps, 'desktop').map(({ path }) => path)
    ).toEqual([
      'office/libreoffice',
      'image-generic/sharex',
      'network/localsend',
      'pdf/pdf24-creator',
      'office/obsidian',
      'office/7-zip',
      'office/powertoys',
      'image-generic/inkscape',
      'video/kdenlive',
      'audio/audacity',
      'video/obs-studio',
      'video/vlc',
      'video/handbrake',
      'image-generic/blender',
      'office/everything',
      'office/keepassxc',
      'pdf/sumatrapdf',
      'office/calibre',
      'system/wiztree',
      'system/ventoy',
      'system/copyq',
      'security/ente-auth',
      'security/veracrypt',
      'learning/anki',
      'learning/zotero',
      'developer/vscode'
    ]);
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

  it('lists the AI creation sites as searchable online cards with official destinations', async () => {
    const expected = [
      {
        path: 'ai-creative/jimeng',
        url: 'https://jimeng.jianying.com/ai-tool/tools',
        query: { zh: 'AI绘图', en: 'text to image' }
      },
      {
        path: 'ai-creative/kling',
        url: 'https://klingai.kuaishou.com/',
        query: { zh: '图生视频', en: 'image to video' }
      },
      {
        path: 'ai-creative/biling-novel',
        url: 'https://ibiling.cn/novel-workbench',
        query: { zh: 'AI小说', en: 'fiction writing' }
      },
      {
        path: 'ai-creative/haimian-music',
        url: 'https://www.haimian.com/',
        query: { zh: '配乐', en: 'song generator' }
      },
      {
        path: 'ai-creative/hunyuan-3d',
        url: 'https://3d.hunyuan.tencent.com/',
        query: { zh: '图生3D', en: 'image to 3D' }
      },
      {
        path: 'ai-creative/adobe-enhance-speech',
        url: 'https://podcast.adobe.com/en/enhance',
        query: { zh: '录音降噪', en: 'speech enhancement' }
      },
      {
        path: 'ai-creative/tingwu',
        url: 'https://tingwu.aliyun.com/',
        query: { zh: '录音转写', en: 'audio transcription' }
      },
      {
        path: 'ai-creative/remove-bg',
        url: 'https://www.remove.bg/zh',
        query: { zh: '自动抠图', en: 'background removal' }
      }
    ];
    const translate = ((key: string) =>
      text(language, key)) as Parameters<typeof getToolsByCategory>[1];
    const categories = getToolsByCategory([], translate);
    const group = categories.find(({ type }) => type === 'ai-creative')!;
    expect(group.rawTitle).toBe(language === 'zh' ? 'AI 创作' : 'AI Creation');
    expect(group.tools.map(({ path }) => path)).toEqual(
      expected.map(({ path }) => path)
    );
    expect(filterToolsByFormat(group.tools, 'online')).toEqual(group.tools);
    expect(filterToolsByFormat(group.tools, 'desktop')).toEqual([]);
    expect(filterToolsByFormat(group.tools, 'extension')).toEqual([]);
    expect(categories.find(({ type }) => type === 'audio')!.tools).toContain(
      group.tools.find(({ path }) => path === 'ai-creative/tingwu')
    );
    expect(
      categories.find(({ type }) => type === 'image-generic')!.tools
    ).toContain(group.tools.find(({ path }) => path === 'ai-creative/remove-bg'));

    for (const { path, url, query } of expected) {
      const tool = group.tools.find((entry) => entry.path === path)!;
      expect(
        filterTools(group.tools, query[language], [], translate)
      ).toContain(tool);
      expect(tool.offlineInstall).toBeUndefined();
      await renderUi(<CatalogToolCard tool={tool} />, language);
      expect(
        screen.getByText(text(language, tool.notice!))
      ).toBeInTheDocument();
      for (const name of [
        text(language, tool.name),
        text(language, 'catalog.actions.online') + ' ↗'
      ]) {
        const link = screen.getByRole('link', { name });
        expect(link).toHaveAttribute('href', url);
        expect(link).toHaveAttribute('target', '_blank');
        expect(link).toHaveAttribute('rel', 'noopener noreferrer');
      }
      cleanup();
    }
  });

  it('lists everyday tools under their existing categories and distinguishes online use from an official download', async () => {
    const entries = [
      {
        path: 'office/excalidraw',
        category: 'office',
        format: 'online',
        action: 'online',
        url: 'https://excalidraw.com/',
        query: { zh: '流程图', en: 'whiteboard' },
        hasNotice: true
      },
      {
        path: 'image-generic/photopea',
        category: 'image-generic',
        format: 'online',
        action: 'online',
        url: 'https://www.photopea.com/',
        query: { zh: '蒙版', en: 'PSD editor' },
        hasNotice: true
      },
      {
        path: 'network/localsend',
        category: 'network',
        format: 'desktop',
        action: 'download',
        url: 'https://localsend.org/download',
        query: { zh: '文件互传', en: 'file transfer' },
        hasNotice: true,
        platforms: ['windows', 'macos', 'linux'],
        pricing: 'free'
      },
      {
        path: 'office/markmap',
        category: 'office',
        format: 'online',
        action: 'online',
        url: 'https://markmap.js.org/editor',
        query: { zh: '思维导图', en: 'mind map' }
      },
      {
        path: 'string/regex101',
        category: 'string',
        format: 'online',
        action: 'online',
        url: 'https://regex101.com/',
        query: { zh: '正则测试', en: 'regex tester' },
        hasNotice: true
      },
      {
        path: 'image-generic/svgomg',
        category: 'image-generic',
        format: 'online',
        action: 'online',
        url: 'https://jakearchibald.github.io/svgomg/',
        query: { zh: 'SVG压缩', en: 'SVG optimizer' },
        hasNotice: true
      },
      {
        path: 'image-generic/webaim-contrast-checker',
        category: 'image-generic',
        format: 'online',
        action: 'online',
        url: 'https://webaim.org/resources/contrastchecker/',
        query: { zh: '文字对比度', en: 'contrast ratio' }
      },
      {
        path: 'pdf/pdf24-creator',
        category: 'pdf',
        format: 'desktop',
        action: 'download',
        url: 'https://tools.pdf24.org/zh/creator',
        query: { zh: '扫描件识字', en: 'PDF OCR' },
        platforms: ['windows'],
        pricing: 'free'
      },
      {
        path: 'office/obsidian',
        category: 'office',
        format: 'desktop',
        action: 'download',
        url: 'https://obsidian.md/download',
        query: { zh: '本地笔记', en: 'local notes' },
        hasNotice: true,
        platforms: ['windows', 'macos', 'linux'],
        pricing: 'freemium'
      },
      {
        path: 'office/7-zip',
        category: 'office',
        format: 'desktop',
        action: 'download',
        url: 'https://www.7-zip.org/download.html',
        query: { zh: '解压缩', en: 'file archiver' },
        hasNotice: true,
        platforms: ['windows'],
        pricing: 'free'
      },
      {
        path: 'office/powertoys',
        category: 'office',
        format: 'desktop',
        action: 'download',
        url: 'https://learn.microsoft.com/windows/powertoys/install',
        query: { zh: '批量改名', en: 'batch rename' },
        platforms: ['windows'],
        pricing: 'free'
      },
      {
        path: 'image-generic/inkscape',
        category: 'image-generic',
        format: 'desktop',
        action: 'download',
        url: 'https://inkscape.org/release/',
        query: { zh: '矢量绘图', en: 'vector graphics' },
        platforms: ['windows', 'macos', 'linux'],
        pricing: 'free'
      },
      {
        path: 'video/kdenlive',
        category: 'video',
        format: 'desktop',
        action: 'download',
        url: 'https://kdenlive.org/download/',
        query: { zh: '多轨剪辑', en: 'multitrack video' },
        platforms: ['windows', 'macos', 'linux'],
        pricing: 'free'
      },
      {
        path: 'audio/audacity',
        category: 'audio',
        format: 'desktop',
        action: 'download',
        url: 'https://www.audacityteam.org/download/',
        query: { zh: '声音录制', en: 'audio recording' },
        platforms: ['windows', 'macos', 'linux'],
        pricing: 'free'
      },
      {
        path: 'office/drawio',
        category: 'office',
        format: 'online',
        action: 'online',
        url: 'https://app.diagrams.net/',
        query: { zh: '架构图', en: 'architecture diagram' },
        hasNotice: true
      },
      {
        path: 'office/mermaid-live',
        category: 'office',
        format: 'online',
        action: 'online',
        url: 'https://mermaid.live/',
        query: { zh: '时序图', en: 'sequence diagram' },
        hasNotice: true
      },
      {
        path: 'image-generic/squoosh',
        category: 'image-generic',
        format: 'online',
        action: 'online',
        url: 'https://squoosh.app/',
        query: { zh: '图片压缩', en: 'image compression' },
        hasNotice: true
      },
      {
        path: 'network/hoppscotch',
        category: 'network',
        format: 'online',
        action: 'online',
        url: 'https://hoppscotch.io/',
        query: { zh: '接口调试', en: 'API client' },
        hasNotice: true
      },
      {
        path: 'network/cloudflare-speed',
        category: 'network',
        format: 'online',
        action: 'online',
        url: 'https://speed.cloudflare.com/',
        query: { zh: '网速测试', en: 'speed test' },
        hasNotice: true
      },
      {
        path: 'video/obs-studio',
        category: 'video',
        format: 'desktop',
        action: 'download',
        url: 'https://obsproject.com/download',
        query: { zh: '直播推流', en: 'live streaming' },
        platforms: ['windows', 'macos', 'linux'],
        pricing: 'free'
      },
      {
        path: 'video/vlc',
        category: 'video',
        format: 'desktop',
        action: 'download',
        url: 'https://www.videolan.org/vlc/',
        query: { zh: '本地视频', en: 'media player' },
        platforms: ['windows', 'macos', 'linux'],
        pricing: 'free'
      },
      {
        path: 'video/handbrake',
        category: 'video',
        format: 'desktop',
        action: 'download',
        url: 'https://handbrake.fr/downloads.php',
        query: { zh: '视频转码', en: 'video transcoder' },
        platforms: ['windows', 'macos', 'linux'],
        pricing: 'free'
      },
      {
        path: 'image-generic/blender',
        category: 'image-generic',
        format: 'desktop',
        action: 'download',
        url: 'https://www.blender.org/download/',
        query: { zh: '3D建模', en: '3D modeling' },
        platforms: ['windows', 'macos', 'linux'],
        pricing: 'free'
      },
      {
        path: 'office/everything',
        category: 'office',
        format: 'desktop',
        action: 'download',
        url: 'https://www.voidtools.com/downloads/',
        query: { zh: '文件搜索', en: 'instant search' },
        hasNotice: true,
        platforms: ['windows'],
        pricing: 'free'
      },
      {
        path: 'office/keepassxc',
        category: 'security',
        format: 'desktop',
        action: 'download',
        url: 'https://keepassxc.org/download/',
        query: { zh: '本地密码管理', en: 'offline vault' },
        hasNotice: true,
        platforms: ['windows', 'macos', 'linux'],
        pricing: 'free'
      },
      {
        path: 'pdf/sumatrapdf',
        category: 'pdf',
        format: 'desktop',
        action: 'download',
        url: 'https://www.sumatrapdfreader.org/download-free-pdf-viewer',
        query: { zh: 'PDF阅读器', en: 'PDF reader' },
        platforms: ['windows'],
        pricing: 'free'
      },
      {
        path: 'office/calibre',
        category: 'learning',
        format: 'desktop',
        action: 'download',
        url: 'https://calibre-ebook.com/download',
        query: { zh: '电子书管理', en: 'ebook manager' },
        platforms: ['windows', 'macos', 'linux'],
        pricing: 'free'
      },
      {
        path: 'system/wiztree',
        category: 'system',
        format: 'desktop',
        action: 'download',
        url: 'https://diskanalyzer.com/download',
        query: { zh: '磁盘空间分析', en: 'disk space' },
        hasNotice: true,
        platforms: ['windows'],
        pricing: 'freemium'
      },
      {
        path: 'system/ventoy',
        category: 'system',
        format: 'desktop',
        action: 'download',
        url: 'https://www.ventoy.net/en/download.html',
        query: { zh: '启动U盘', en: 'bootable USB' },
        hasNotice: true,
        platforms: ['windows', 'linux'],
        pricing: 'free'
      },
      {
        path: 'system/copyq',
        category: 'system',
        format: 'desktop',
        action: 'download',
        url: 'https://hluk.github.io/CopyQ/',
        query: { zh: '剪贴板历史', en: 'clipboard history' },
        platforms: ['windows', 'macos', 'linux'],
        pricing: 'free'
      },
      {
        path: 'design/coolors',
        category: 'design',
        format: 'online',
        action: 'online',
        url: 'https://coolors.co/',
        query: { zh: '配色方案', en: 'color palette' },
        hasNotice: true
      },
      {
        path: 'design/google-fonts',
        category: 'design',
        format: 'online',
        action: 'online',
        url: 'https://fonts.google.com/',
        query: { zh: '开源字体', en: 'typography' }
      },
      {
        path: 'design/iconify',
        category: 'design',
        format: 'online',
        action: 'online',
        url: 'https://icon-sets.iconify.design/',
        query: { zh: '矢量图标', en: 'SVG icons' }
      },
      {
        path: 'design/figma',
        category: 'design',
        format: 'online',
        action: 'online',
        url: 'https://www.figma.com/',
        query: { zh: '原型设计', en: 'prototyping' },
        hasNotice: true
      },
      {
        path: 'security/virustotal',
        category: 'security',
        format: 'online',
        action: 'online',
        url: 'https://www.virustotal.com/',
        query: { zh: '文件查毒', en: 'malware scan' },
        hasNotice: true
      },
      {
        path: 'security/ente-auth',
        category: 'security',
        format: 'desktop',
        action: 'download',
        url: 'https://ente.io/auth/',
        query: { zh: '两步验证', en: 'authenticator' },
        hasNotice: true,
        platforms: ['windows', 'macos', 'linux'],
        pricing: 'free'
      },
      {
        path: 'security/veracrypt',
        category: 'security',
        format: 'desktop',
        action: 'download',
        url: 'https://veracrypt.fr/en/Downloads.html',
        query: { zh: '磁盘加密', en: 'disk encryption' },
        hasNotice: true,
        platforms: ['windows', 'macos', 'linux'],
        pricing: 'free'
      },
      {
        path: 'learning/anki',
        category: 'learning',
        format: 'desktop',
        action: 'download',
        url: 'https://apps.ankiweb.net/',
        query: { zh: '记忆卡片', en: 'flashcards' },
        hasNotice: true,
        platforms: ['windows', 'macos', 'linux'],
        pricing: 'free'
      },
      {
        path: 'learning/zotero',
        category: 'learning',
        format: 'desktop',
        action: 'download',
        url: 'https://www.zotero.org/download/',
        query: { zh: '文献管理', en: 'reference manager' },
        hasNotice: true,
        platforms: ['windows', 'macos', 'linux'],
        pricing: 'freemium'
      },
      {
        path: 'learning/desmos',
        category: 'learning',
        format: 'online',
        action: 'online',
        url: 'https://www.desmos.com/calculator',
        query: { zh: '图形计算器', en: 'graphing calculator' }
      },
      {
        path: 'developer/vscode',
        category: 'developer',
        format: 'desktop',
        action: 'download',
        url: 'https://code.visualstudio.com/download',
        query: { zh: '代码编辑器', en: 'code editor' },
        platforms: ['windows', 'macos', 'linux'],
        pricing: 'free'
      },
      {
        path: 'developer/transform-tools',
        category: 'developer',
        format: 'online',
        action: 'online',
        url: 'https://transform.tools/',
        query: { zh: '代码互转', en: 'code converter' }
      },
      {
        path: 'developer/caniuse',
        category: 'developer',
        format: 'online',
        action: 'online',
        url: 'https://caniuse.com/',
        query: { zh: '浏览器兼容性', en: 'browser compatibility' }
      },
      {
        path: 'life/pomofocus',
        category: 'life',
        format: 'online',
        action: 'online',
        url: 'https://pomofocus.io/',
        query: { zh: '番茄钟', en: 'focus timer' }
      },
      {
        path: 'life/windy',
        category: 'life',
        format: 'online',
        action: 'online',
        url: 'https://www.windy.com/',
        query: { zh: '天气地图', en: 'weather map' }
      },
      {
        path: 'life/timeanddate',
        category: 'life',
        format: 'online',
        action: 'online',
        url: 'https://www.timeanddate.com/worldclock/',
        query: { zh: '世界时钟', en: 'world clock' }
      },
      {
        path: 'life/asoftmurmur',
        category: 'life',
        format: 'online',
        action: 'online',
        url: 'https://asoftmurmur.com/',
        query: { zh: '白噪音', en: 'ambient noise' }
      }
    ] as const;
    const translate = ((key: string) =>
      text(language, key)) as Parameters<typeof getToolsByCategory>[1];
    const categories = getToolsByCategory([], translate);

    for (const entry of entries) {
      const { path, category, format, action, url, query } = entry;
      const group = categories.find(({ type }) => type === category)!;
      const tool = group.tools.find((entry) => entry.path === path)!;
      const formatTools = filterToolsByFormat(group.tools, format);
      expect(formatTools).toContain(tool);
      // 此测试只加载目录词条；站内编辑器的独立词条由真实页面验证。
      expect(
        filterTools(
          formatTools.filter(({ externalUrl }) => Boolean(externalUrl)),
          query[language],
          [],
          translate
        )
      ).toContain(tool);
      expect(
        filterToolsByFormat(
          group.tools,
          format === 'online' ? 'desktop' : 'online'
        )
      ).not.toContain(tool);
      expect(filterToolsByFormat(group.tools, 'extension')).not.toContain(tool);
      expect(tool.offlineInstall).toBeUndefined();
      await renderUi(<CatalogToolCard tool={tool} />, language);
      expect(
        screen.getByText(text(language, tool.shortDescription))
      ).toBeInTheDocument();
      expect(
        screen.getByText(text(language, `catalog.formats.${format}`))
      ).toBeInTheDocument();
      if ('hasNotice' in entry)
        expect(
          screen.getByText(text(language, tool.notice!))
        ).toBeInTheDocument();
      for (const name of [
        text(language, tool.name),
        `${text(language, `catalog.actions.${action}`)} ↗`
      ]) {
        const link = screen.getByRole('link', { name });
        expect(link).toHaveAttribute('href', url);
        expect(link).toHaveAttribute('target', '_blank');
        expect(link).toHaveAttribute('rel', 'noopener noreferrer');
      }
      if (format === 'desktop') {
        expect(tool.platforms).toEqual(entry.platforms);
        expect(tool.pricing).toBe(entry.pricing);
      }
      cleanup();
    }
  });

  it('does not advertise an offline package for store-only extensions', async () => {
    for (const path of [
      'string/simple-translate',
      'image-generic/gofullpage',
      'office/markdown-reader',
      'network/ghelper',
      'office/dark-reader',
      'office/tab-session-manager'
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
