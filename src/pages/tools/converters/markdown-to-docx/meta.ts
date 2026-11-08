import { lazy } from 'react';
import { defineTool } from '@tools/defineTool';

export const tool = defineTool('converters', {
  path: 'markdown-to-docx',
  icon: 'mdi:file-word-outline',
  keywords: ['markdown', 'md', 'word', 'docx', '文档', '转换', '导出'],
  i18n: {
    name: 'converters:markdownToDocx.title',
    description: 'converters:markdownToDocx.description',
    shortDescription: 'converters:markdownToDocx.shortDescription',
    userTypes: ['generalUsers', 'developers']
  },
  component: lazy(() => import('./index'))
});
