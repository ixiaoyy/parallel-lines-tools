import 'monaco-editor/esm/nls.messages.zh-cn.js';
import englishMessages from 'monaco-editor/esm/nls.messages.json';
import { readFileSync } from 'node:fs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const language = vi.hoisted(() => ({ language: '', resolvedLanguage: '' }));
vi.mock('../i18n', () => ({ default: language }));

const environment: typeof globalThis & {
  _VSCODE_NLS_MESSAGES?: string[];
  _VSCODE_NLS_LANGUAGE?: string;
} = globalThis;
const officialChinese = environment._VSCODE_NLS_MESSAGES;

beforeEach(() => {
  vi.resetModules();
  language.language = '';
  language.resolvedLanguage = '';
  window.localStorage.clear();
  // 官方语言脚本在同一 Node 模块缓存中只执行一次，逐例恢复其原始消息表以隔离语言状态。
  environment._VSCODE_NLS_MESSAGES = officialChinese;
  environment._VSCODE_NLS_LANGUAGE = 'zh-cn';
});
afterEach(() => {
  vi.restoreAllMocks();
  window.localStorage.clear();
  environment._VSCODE_NLS_MESSAGES = officialChinese;
  environment._VSCODE_NLS_LANGUAGE = 'zh-cn';
});

describe('official local Monaco NLS bootstrap', () => {
  it('uses the installed Chinese table by default without a saved language', async () => {
    const result = await import('./monaco-nls');
    expect(result.initialMonacoLanguage).toBe('zh');
    expect(environment._VSCODE_NLS_LANGUAGE).toBe('zh-cn');
    expect(environment._VSCODE_NLS_MESSAGES?.length).toBe(
      englishMessages.length
    );
    expect(environment._VSCODE_NLS_MESSAGES?.[1]).toBe('输入');
  });

  it('restores saved English before asynchronous i18n initialization completes', async () => {
    window.localStorage.setItem('lang', 'en');
    const result = await import('./monaco-nls');
    expect(result.initialMonacoLanguage).toBe('en');
    expect(environment._VSCODE_NLS_MESSAGES).toEqual(englishMessages);
    expect(environment._VSCODE_NLS_LANGUAGE).toBe('en');
  });

  it('uses the current language before an older resolved language or saved cache', async () => {
    language.language = 'zh';
    language.resolvedLanguage = 'en';
    window.localStorage.setItem('lang', 'en');
    const result = await import('./monaco-nls');
    expect(result.initialMonacoLanguage).toBe('zh');
    expect(environment._VSCODE_NLS_MESSAGES?.[1]).toBe('输入');
  });

  it('keeps English internal menus for other existing interface languages', async () => {
    language.language = 'de';
    const result = await import('./monaco-nls');
    expect(result.initialMonacoLanguage).toBe('en');
    expect(environment._VSCODE_NLS_MESSAGES?.[1]).toBe('input');
  });

  it('uses Chinese when optional browser storage is inaccessible', async () => {
    vi.spyOn(window.localStorage, 'getItem').mockImplementation(() => {
      throw new DOMException('Storage disabled', 'SecurityError');
    });
    const result = await import('./monaco-nls');
    expect(result.initialMonacoLanguage).toBe('zh');
  });

  it('does not pretend initialized editor menus change with later interface language changes', async () => {
    language.language = 'en';
    const result = await import('./monaco-nls');
    language.language = 'zh';
    expect(result.initialMonacoLanguage).toBe('en');
    expect(environment._VSCODE_NLS_MESSAGES?.[1]).toBe('input');
  });

  it('places NLS bootstrapping before the editor module import', () => {
    const source = readFileSync('src/lib/local-monaco.ts', 'utf8');
    expect(source.indexOf("import './monaco-nls';")).toBeLessThan(
      source.indexOf("import * as monaco from 'monaco-editor';")
    );
  });
});
