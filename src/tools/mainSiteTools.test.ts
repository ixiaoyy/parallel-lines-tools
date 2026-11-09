import { describe, expect, it, vi } from 'vitest';
import type { TFunction } from 'i18next';
import type { I18nNamespaces } from '../i18n';
import zh from '../../public/locales/zh/translation.json';
import en from '../../public/locales/en/translation.json';
import { filterTools, getToolsByCategory } from './index';
import { mainSiteTools } from './mainSiteTools';
import { getToolHref, openTool, type DefinedTool } from './defineTool';

const translate = (data: typeof zh | typeof en) =>
  ((key: string) =>
    key
      .replace('translation:', '')
      .split('.')
      .reduce<unknown>(
        (value, name) => (value as Record<string, unknown>)?.[name],
        data
      ) ?? key) as TFunction<I18nNamespaces[]>;

describe('main-site tool menu integration', () => {
  it('keeps the two original destinations and stable bookmark IDs without fake page components', () => {
    expect(
      mainSiteTools.map(({ path, externalUrl, component }) => ({
        path,
        externalUrl,
        component
      }))
    ).toEqual([
      {
        path: 'office/excel-formulas',
        externalUrl: 'https://pingxingxian.space/tools/excel-formulas',
        component: undefined
      },
      {
        path: 'image-generic/bead-pattern',
        externalUrl: 'https://pingxingxian.space/tools/bead-pattern',
        component: undefined
      }
    ]);
  });

  it('finds both old menus in Chinese and English and places them in their categories', () => {
    expect(filterTools(mainSiteTools, '公式', [], translate(zh))).toContain(
      mainSiteTools[0]
    );
    expect(filterTools(mainSiteTools, 'Excel', [], translate(en))).toContain(
      mainSiteTools[0]
    );
    expect(filterTools(mainSiteTools, '拼豆', [], translate(zh))).toContain(
      mainSiteTools[1]
    );
    expect(filterTools(mainSiteTools, 'bead', [], translate(en))).toContain(
      mainSiteTools[1]
    );
    const categories = getToolsByCategory([], translate(zh), mainSiteTools);
    expect(
      categories.find(({ type }) => type === 'office')?.example.externalUrl
    ).toBe(mainSiteTools[0].externalUrl);
    expect(
      categories.find(({ type }) => type === 'image-generic')?.tools
    ).toContain(mainSiteTools[1]);
  });

  it('opens external searches once without an opener while internal navigation remains unchanged', () => {
    const navigate = vi.fn();
    const popup = vi.spyOn(window, 'open').mockReturnValue(null);
    try {
      openTool(mainSiteTools[0], navigate);
      expect(popup).toHaveBeenCalledWith(
        getToolHref(mainSiteTools[0]),
        '_blank',
        'noopener,noreferrer'
      );
      expect(navigate).not.toHaveBeenCalled();
      const native = {
        ...mainSiteTools[0],
        path: 'json/prettify',
        type: 'json',
        externalUrl: undefined,
        component: () => null
      } as unknown as DefinedTool;
      openTool(native, navigate);
      expect(popup).toHaveBeenCalledTimes(1);
      expect(navigate).toHaveBeenCalledWith('/json/prettify');
      expect(navigate).toHaveBeenCalledTimes(1);
      expect(
        getToolsByCategory([], translate(en), [native])[0].example
      ).toEqual({ title: native.name, path: native.path });
    } finally {
      popup.mockRestore();
    }
  });
});
