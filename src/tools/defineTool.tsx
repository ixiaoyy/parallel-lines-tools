import ToolLayout from '../components/ToolLayout';
import React, { JSXElementConstructor, LazyExoticComponent } from 'react';
import { IconifyIcon } from '@iconify/react';
import { FullI18nKey, validNamespaces } from '../i18n';
import { useTranslation } from 'react-i18next';

export type UserType = 'generalUsers' | 'developers';

export interface ToolMeta {
  path: string;
  component: LazyExoticComponent<JSXElementConstructor<ToolComponentProps>>;
  keywords: string[];
  icon: IconifyIcon | string;
  alternativeCategories?: ToolCategory[];
  i18n: {
    name: FullI18nKey;
    description: FullI18nKey;
    shortDescription: FullI18nKey;
    longDescription?: FullI18nKey;
    userTypes?: UserType[];
  };
}

export type ToolCategory =
  | 'string'
  | 'image-generic'
  | 'png'
  | 'number'
  | 'gif'
  | 'list'
  | 'json'
  | 'time'
  | 'csv'
  | 'video'
  | 'pdf'
  | 'audio'
  | 'xml'
  | 'office'
  | 'converters';

interface ToolDefinition {
  type: ToolCategory;
  alternativeCategories?: ToolCategory[];
  path: string;
  name: FullI18nKey;
  description: FullI18nKey;
  shortDescription: FullI18nKey;
  icon: IconifyIcon | string;
  keywords: string[];
  userTypes?: UserType[];
}

// 已有工具继续由本应用渲染；收录入口只提供原站地址，不加载或复制另一套工具实现。
export type DefinedTool = ToolDefinition &
  (
    | { component: () => JSX.Element; externalUrl?: never }
    | { externalUrl: string; component?: never }
  );

/** 返回菜单的实际目标；path 仍作为稳定收藏 ID，不将旧站地址写入收藏存储。 */
export const getToolHref = (tool: DefinedTool): string =>
  tool.externalUrl ?? `/${tool.path}`;

/** 从用户点击/键盘选择打开工具；外链另页且不携 opener，原站内工具沿用 SPA 导航。 */
export function openTool(
  tool: DefinedTool,
  navigate: (path: string) => void
): void {
  if (tool.externalUrl)
    window.open(tool.externalUrl, '_blank', 'noopener,noreferrer');
  else navigate(`/${tool.path}`);
}

export interface ToolComponentProps {
  title: string;
  longDescription?: string;
}

export const defineTool = (
  basePath: ToolCategory,
  options: ToolMeta
): DefinedTool => {
  const { icon, path, keywords, component, i18n, alternativeCategories } =
    options;
  const Component = component;
  return {
    type: basePath,
    alternativeCategories,
    path: `${basePath}/${path}`,
    name: i18n.name,
    icon,
    description: i18n.description,
    shortDescription: i18n.shortDescription,
    keywords,
    userTypes: i18n.userTypes,
    component: function ToolComponent() {
      const { t } = useTranslation(validNamespaces);
      return (
        <ToolLayout
          icon={icon}
          type={basePath}
          i18n={i18n}
          fullPath={`${basePath}/${path}`}
        >
          <Component
            title={t(i18n.name)}
            longDescription={
              i18n.longDescription ? t(i18n.longDescription) : undefined
            }
          />
        </ToolLayout>
      );
    }
  };
};
