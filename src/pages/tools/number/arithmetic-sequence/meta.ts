import { defineTool } from '@tools/defineTool';
import { lazy } from 'react';

export const tool = defineTool('number', {
  path: 'arithmetic-sequence',
  icon: 'material-symbols:functions',

  keywords: [
    'arithmetic',
    'sequence',
    'math',
    'progression',
    'generate',
    'numbers',
    '生成数字',
    '数字序列',
    '等差',
    '首项',
    '步长'
  ],
  component: lazy(() => import('./index')),
  i18n: {
    name: 'number:arithmeticSequence.title',
    description: 'number:arithmeticSequence.description',
    shortDescription: 'number:arithmeticSequence.shortDescription',
    // 合并的旧生成器对两类用户均可见，统一入口保留这一发现范围。
    userTypes: ['generalUsers', 'developers']
  }
});
