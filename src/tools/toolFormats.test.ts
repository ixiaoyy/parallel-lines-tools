import { createElement } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { TFunction } from 'i18next';
import type { I18nNamespaces } from '../i18n';
import { filterTools, filterToolsByFormat, getToolsByCategory } from './index';
import {
  getToolFormats,
  getToolHref,
  openTool,
  type DefinedTool,
  type ToolFormat
} from './defineTool';
import { mainSiteTools } from './mainSiteTools';
import { getBookmarkedToolPaths, toggleBookmarked } from '../utils/bookmark';

// 夹具只约束目录合同，不把首批精选产品或第三方地址固化进筛选测试。
const legacyNative: DefinedTool = {
  type: 'office',
  path: 'office/legacy-native',
  name: 'translation:mainSiteTools.excel.title',
  description: 'translation:mainSiteTools.excel.description',
  shortDescription: 'translation:mainSiteTools.excel.shortDescription',
  icon: 'mdi:file-document',
  keywords: ['document', '文档'],
  component: () => createElement('div')
};

const desktop: DefinedTool = {
  ...legacyNative,
  path: 'office/test-desktop',
  component: undefined,
  externalUrl: 'https://desktop.example/download',
  formats: ['desktop'],
  entryAction: 'download',
  keywords: ['offline editing', '离线排版'],
  userTypes: ['generalUsers']
};

const extension: DefinedTool = {
  type: 'string',
  path: 'string/test-extension',
  name: 'translation:mainSiteTools.bead.title',
  description: 'translation:mainSiteTools.bead.description',
  shortDescription: 'translation:mainSiteTools.bead.shortDescription',
  icon: 'mdi:puzzle',
  externalUrl: 'https://store.example/extension',
  formats: ['extension'],
  entryAction: 'extension-store',
  keywords: ['web archive', '网页存档'],
  userTypes: ['generalUsers']
};

const multipleFormats: DefinedTool = {
  ...desktop,
  path: 'office/test-multiple-formats',
  externalUrl: 'https://multiple.example/',
  formats: ['online', 'desktop', 'extension'],
  entryAction: 'online',
  keywords: ['developer'],
  userTypes: ['developers']
};

const source = [
  legacyNative,
  desktop,
  mainSiteTools[0],
  extension,
  multipleFormats
];

const translate = ((key: string) => key) as TFunction<I18nNamespaces[]>;

afterEach(() => {
  vi.restoreAllMocks();
  localStorage.clear();
});

describe('tool formats without changing existing tool contracts', () => {
  it('treats legacy native tools and both original main-site links as online', () => {
    for (const tool of [legacyNative, ...mainSiteTools]) {
      expect(tool.formats).toBeUndefined();
      expect(getToolFormats(tool)).toEqual(['online']);
    }
    expect(filterToolsByFormat(source, 'online')).toEqual([
      legacyNative,
      mainSiteTools[0],
      multipleFormats
    ]);
  });

  it('matches desktop, extension and any explicitly supported format', () => {
    expect(filterToolsByFormat(source, 'desktop')).toEqual([
      desktop,
      multipleFormats
    ]);
    expect(filterToolsByFormat(source, 'extension')).toEqual([
      extension,
      multipleFormats
    ]);
    expect(getToolFormats(multipleFormats)).toEqual([
      'online',
      'desktop',
      'extension'
    ]);
  });

  it('keeps source order and metadata unchanged for every filter', () => {
    const before = source.slice();
    const formatsBefore = source.map((tool) => tool.formats?.slice());
    expect(filterToolsByFormat(source, 'all')).toEqual(source);
    for (const format of ['online', 'desktop', 'extension'] as ToolFormat[]) {
      const result = filterToolsByFormat(source, format);
      expect(result).toEqual(
        before.filter((tool) => getToolFormats(tool).includes(format))
      );
    }
    expect(source).toEqual(before);
    expect(source.map((tool) => tool.formats)).toEqual(formatsBefore);
    expect(filterToolsByFormat([], 'desktop')).toEqual([]);
  });

  it('keeps purpose categories and their actual counts after format filtering', () => {
    const desktopCategories = getToolsByCategory(
      [],
      translate,
      filterToolsByFormat(source, 'desktop')
    );
    expect(desktopCategories.map(({ type }) => type)).toEqual(['office']);
    expect(desktopCategories[0].tools).toEqual([desktop, multipleFormats]);
    expect(desktopCategories[0].tools).toHaveLength(2);
    expect(desktopCategories[0].example.path).toBe(desktop.path);

    const extensionCategories = getToolsByCategory(
      [],
      translate,
      filterToolsByFormat(source, 'extension')
    );
    expect(
      extensionCategories.map(({ type, tools }) => [type, tools.length])
    ).toEqual([
      ['office', 1],
      ['string', 1]
    ]);
    expect(extensionCategories.flatMap(({ tools }) => tools)).toEqual([
      multipleFormats,
      extension
    ]);
  });

  it('combines format filtering with existing Chinese and English search', () => {
    for (const query of ['离线排版', 'offline editing']) {
      expect(
        filterTools(
          filterToolsByFormat(source, 'desktop'),
          query,
          [],
          translate
        )
      ).toEqual([desktop]);
      expect(
        filterTools(filterToolsByFormat(source, 'online'), query, [], translate)
      ).not.toContain(desktop);
    }
    for (const query of ['网页存档', 'web archive']) {
      expect(
        filterTools(
          filterToolsByFormat(source, 'extension'),
          query,
          [],
          translate
        )
      ).toEqual([extension]);
    }
  });

  it('preserves audience filtering alongside formats and categories', () => {
    const desktopTools = filterToolsByFormat(source, 'desktop');
    expect(filterTools(desktopTools, '', ['generalUsers'], translate)).toEqual([
      desktop
    ]);
    expect(filterTools(desktopTools, '', ['developers'], translate)).toEqual([
      multipleFormats
    ]);
    const categories = getToolsByCategory(
      ['developers'],
      translate,
      desktopTools
    );
    expect(categories).toHaveLength(1);
    expect(categories[0].tools).toEqual([multipleFormats]);
  });

  it('keeps old and new stable bookmark IDs separate from destination URLs', () => {
    for (const tool of [legacyNative, mainSiteTools[0], desktop, extension])
      toggleBookmarked(tool.path);

    expect(getBookmarkedToolPaths()).toEqual([
      extension.path,
      desktop.path,
      mainSiteTools[0].path,
      legacyNative.path
    ]);
    filterToolsByFormat(source, 'desktop');
    expect(getBookmarkedToolPaths()).toHaveLength(4);
    expect(localStorage.getItem('bookmarkedTools')).not.toContain('https://');
    expect(getToolHref(legacyNative)).toBe('/office/legacy-native');
    expect(getToolHref(mainSiteTools[0])).toBe(
      'https://pingxingxian.space/tools/excel-formulas'
    );
    expect(getToolHref(desktop)).toBe(desktop.externalUrl);
    expect(getToolHref(extension)).toBe(extension.externalUrl);
  });

  it('retains SPA navigation and opens each external entry once without an opener', () => {
    const navigate = vi.fn();
    const popup = vi.spyOn(window, 'open').mockReturnValue(null);
    openTool(legacyNative, navigate);
    expect(navigate).toHaveBeenCalledWith('/office/legacy-native');
    expect(navigate).toHaveBeenCalledTimes(1);
    expect(popup).not.toHaveBeenCalled();

    for (const tool of [mainSiteTools[0], desktop, extension])
      openTool(tool, navigate);

    expect(navigate).toHaveBeenCalledTimes(1);
    expect(popup.mock.calls).toEqual(
      [mainSiteTools[0], desktop, extension].map((tool) => [
        tool.externalUrl,
        '_blank',
        'noopener,noreferrer'
      ])
    );
  });
});
