import { Box } from '@mui/material';
import React, { ReactNode, useEffect, useRef, useState } from 'react';
import { Helmet } from 'react-helmet';
import ToolHeader from './ToolHeader';
import Separator from './Separator';
import AllTools from './allTools/AllTools';
import { getToolsByCategory } from '@tools/index';
import {
  capitalizeFirstLetter,
  getI18nNamespaceFromToolCategory
} from '../utils/string';
import { IconifyIcon } from '@iconify/react';
import { useTranslation } from 'react-i18next';
import { ToolCategory, getToolHref } from '@tools/defineTool';
import { FullI18nKey } from '../i18n';

export default function ToolLayout({
  children,
  icon,
  i18n,
  type,
  fullPath
}: {
  icon?: IconifyIcon | string;
  type: ToolCategory;
  fullPath: string;
  children: ReactNode;
  i18n?: {
    name: FullI18nKey;
    description: FullI18nKey;
    shortDescription: FullI18nKey;
  };
}) {
  const { t, i18n: language } = useTranslation([
    'translation',
    getI18nNamespaceFromToolCategory(type)
  ]);

  const toolTitle = t(i18n!.name);
  const toolDescription = t(i18n!.description);

  const related =
    getToolsByCategory([], t).find((category) => category.type === type)
      ?.tools ?? [];
  const otherCategoryTools = related
    .filter((tool) => t(tool.name) !== toolTitle)
    .map((tool) => ({
      title: tool.name,
      description: tool.shortDescription,
      link: getToolHref(tool),
      external: !!tool.externalUrl,
      icon: tool.icon
    }));
  const relatedRef = useRef<HTMLDivElement>(null);
  const [relatedReady, setRelatedReady] = useState(false);
  useEffect(() => {
    let active = true;
    setRelatedReady(false);
    const target = relatedRef.current;
    if (!target) return;
    // 推荐工具靠近视口才加载其跨分类译文，不影响当前工具首屏。
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        observer.disconnect();
        const namespaces = [
          ...new Set(
            related.flatMap((tool) =>
              [tool.name, tool.shortDescription].map((key) => key.split(':')[0])
            )
          )
        ];
        language.loadNamespaces(namespaces, (errors) => {
          if (active && !errors) setRelatedReady(true);
        });
      },
      { rootMargin: '180px' }
    );
    observer.observe(target);
    return () => {
      active = false;
      observer.disconnect();
    };
  }, [fullPath, language, language.resolvedLanguage]);

  return (
    <Box
      width={'100%'}
      display={'flex'}
      flexDirection={'column'}
      alignItems={'center'}
      sx={{ backgroundColor: 'background.default' }}
    >
      <Helmet>
        <title>{`${toolTitle} · ${t('translation:hero.brand')}`}</title>
        <meta name="description" content={toolDescription} />
      </Helmet>
      <Box width={{ xs: '94%', md: '85%' }}>
        <ToolHeader
          title={toolTitle}
          description={toolDescription}
          icon={icon}
          type={type}
          path={fullPath}
        />
        {children}
        <Separator backgroundColor="#5581b5" margin="50px" />
        <Box ref={relatedRef} sx={{ minHeight: 80 }}>
          {relatedReady && (
            <AllTools
              title={t('translation:toolLayout.allToolsTitle', '', {
                type: capitalizeFirstLetter(
                  getToolsByCategory([], t).find(
                    (category) => category.type === type
                  )!.title
                )
              })}
              toolCards={otherCategoryTools}
            />
          )}
        </Box>
      </Box>
    </Box>
  );
}
