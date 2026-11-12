import { defineTool } from '@tools/defineTool';
import { lazy } from 'react';

export const tool = defineTool('number', {
  path: 'statistics',
  icon: 'material-symbols:functions',
  keywords: [
    'statistics',
    'sum',
    'add',
    'calculate',
    'total',
    'average',
    'mean',
    'median',
    'minimum',
    'maximum',
    'count',
    'running sum',
    'text extraction',
    'custom separator',
    '统计',
    '求和',
    // 保留旧独立入口的完整中文标题，避免合并后按原名称搜索不到。
    '数字求和',
    '相加',
    '总和',
    '平均',
    '中位数',
    '最小值',
    '最大值',
    '计数',
    '累计',
    '逐行累计',
    '文本提取',
    '分隔符',
    '一列数字'
  ],
  component: lazy(() => import('./index')),
  i18n: {
    name: 'number:statistics.title',
    description: 'number:statistics.description',
    shortDescription: 'number:statistics.shortDescription',
    userTypes: ['generalUsers']
  }
});
