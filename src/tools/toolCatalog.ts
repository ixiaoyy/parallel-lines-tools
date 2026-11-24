import type { DefinedTool, ToolFormat } from './defineTool';
import type { FullI18nKey } from '../i18n';

type ToolActionKey = Extract<
  FullI18nKey,
  | `translation:catalog.actions.${string}`
  | `translation:catalog.stores.${string}`
>;

/** 返回真实入口；纯目录消费者不依赖页面工厂，path 仍是原收藏 ID。 */
export const getToolHref = (tool: DefinedTool): string =>
  tool.externalUrl ?? `/${tool.path}`;

/** 读取目录形态；旧条目缺省为在线工具，不推断其费用、平台或隐私。 */
export const getToolFormats = (tool: DefinedTool): ToolFormat[] =>
  tool.formats ?? ['online'];

/** 读取实际入口的动作键；此模块不加载工具页面，避免卡片与工具工厂循环引用。 */
export const getToolActionKey = (tool: DefinedTool): ToolActionKey => {
  if (tool.entryAction === 'extension-store' && tool.entryBrowser)
    return `translation:catalog.stores.${tool.entryBrowser}`;
  return `translation:catalog.actions.${tool.entryAction ?? 'online'}`;
};
