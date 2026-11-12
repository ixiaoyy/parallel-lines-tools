import { describe, expect, it } from 'vitest';
import type { TFunction } from 'i18next';
import type { I18nNamespaces } from '../i18n';
import {
  catalogTools,
  filterTools,
  getCatalogTools,
  getToolsByCategory,
  tools
} from './index';
import { getToolHref } from './defineTool';
import zh from '../../public/locales/zh/number.json';
import en from '../../public/locales/en/number.json';
import { compute } from '../pages/tools/number/sum/service';
import { listOfIntegers } from '../pages/tools/number/generate/service';
import { generateArithmeticSequence } from '../pages/tools/number/arithmetic-sequence/service';

const translator = (locale: typeof zh | typeof en) =>
  ((key: string) =>
    key
      .replace('number:', '')
      .split('.')
      .reduce<unknown>(
        (value, part) => (value as Record<string, unknown>)?.[part],
        locale
      ) ?? key) as TFunction<I18nNamespaces[]>;

describe('independent catalog entries and compatible tool inventory', () => {
  it('merges only the two reviewed duplicate/basic entries and points to existing parents', () => {
    expect(
      tools
        .filter((tool) => tool.catalogParent)
        .map(({ path, catalogParent }) => ({ path, catalogParent }))
    ).toEqual([
      { path: 'number/sum', catalogParent: 'number/statistics' },
      { path: 'number/generate', catalogParent: 'number/arithmetic-sequence' }
    ]);
    for (const tool of tools.filter((item) => item.catalogParent))
      expect(
        catalogTools.some((parent) => parent.path === tool.catalogParent)
      ).toBe(true);
    expect(catalogTools).toEqual(tools.filter((tool) => !tool.catalogParent));
    expect(
      getCatalogTools(tools.filter((tool) => tool.type !== 'number'))
    ).toEqual(tools.filter((tool) => tool.type !== 'number'));
  });

  it('keeps legacy path IDs, route components and links in the full inventory', () => {
    for (const path of [
      'number/sum',
      'number/generate',
      'number/arithmetic-sequence'
    ]) {
      const tool = tools.find((item) => item.path === path)!;
      expect(tool).toBeDefined();
      expect(typeof tool.component).toBe('function');
      expect(getToolHref(tool)).toBe('/' + path);
    }
  });

  it('counts actual independent category entries and uses the same list for related tools', () => {
    const numberCategory = getToolsByCategory([], translator(zh)).find(
      (category) => category.type === 'number'
    )!;
    expect(numberCategory.tools).toEqual(
      catalogTools.filter((tool) => tool.type === 'number')
    );
    expect(numberCategory.tools.map((tool) => tool.path)).not.toContain(
      'number/sum'
    );
    expect(numberCategory.tools.map((tool) => tool.path)).not.toContain(
      'number/generate'
    );
    expect(numberCategory.example.path).toBe('number/statistics');
  });

  it('finds the unified entries through the Chinese/English keywords they cover', () => {
    for (const [query, parent] of [
      ['求和', 'number/statistics'],
      ['平均', 'number/statistics'],
      ['累计', 'number/statistics'],
      ['sum', 'number/statistics'],
      ['average', 'number/statistics'],
      ['生成数字', 'number/arithmetic-sequence'],
      ['generate numbers', 'number/arithmetic-sequence']
    ]) {
      const result = filterTools(
        catalogTools,
        query,
        [],
        translator(query.charCodeAt(0) > 127 ? zh : en)
      );
      expect(result.map((tool) => tool.path)).toContain(parent);
      expect(result.every((tool) => !tool.catalogParent)).toBe(true);
    }
  });

  it('keeps the merged generator discoverable to both previous audiences', () => {
    for (const audience of ['generalUsers', 'developers'] as const) {
      const result = filterTools(
        catalogTools,
        'generate numbers',
        [audience],
        translator(en)
      );
      expect(result.map((tool) => tool.path)).toContain(
        'number/arithmetic-sequence'
      );
    }
  });

  it('finds the unified entry first for every legacy full Chinese/English title', () => {
    for (const titles of [zh, en]) {
      for (const [name, parent] of [
        ['sum', 'number/statistics'],
        ['generate', 'number/arithmetic-sequence']
      ] as const) {
        for (const locale of [zh, en]) {
          const result = filterTools(
            catalogTools,
            titles[name].title,
            [],
            translator(locale)
          );
          expect(result[0]?.path).toBe(parent);
          expect(result.every((tool) => !tool.catalogParent)).toBe(true);
        }
      }
    }
  });

  it('retains specialized generators, converters and engineering tools', () => {
    for (const tool of tools.filter(
      (item) => item.type === 'number' && !item.catalogParent
    ))
      expect(catalogTools).toContain(tool);
    for (const path of [
      'number/random-number-generator',
      'number/random-port-generator',
      'number/byte-converter',
      'number/number-to-words'
    ])
      expect(catalogTools.some((tool) => tool.path === path)).toBe(true);
  });

  it('preserves the old advanced sum and both old sequence computation contracts', () => {
    expect(compute('2 cats and 4 kittens', 'smart', true, ',')).toBe('2\n6\n');
    expect(compute('2,a,4', 'delimiter', false, ',')).toBe('6');
    expect(listOfIntegers(0.5, 3, 0.5, ', ')).toBe('0.5, 1, 1.5');
    expect(generateArithmeticSequence(0.5, 0.5, 3, ', ')).toBe('0.5, 1, 1.5');
  });
});
