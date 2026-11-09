import type { DefinedTool } from './defineTool';

// 原主站功能仍由其独立深链接承载；这里只合并真实菜单、搜索和收藏元信息。
export const mainSiteTools: DefinedTool[] = [
  {
    type: 'office',
    path: 'office/excel-formulas',
    externalUrl: 'https://pingxingxian.space/tools/excel-formulas',
    name: 'translation:mainSiteTools.excel.title',
    description: 'translation:mainSiteTools.excel.description',
    shortDescription: 'translation:mainSiteTools.excel.shortDescription',
    icon: 'fluent:document-landscape-data-24-filled',
    keywords: [
      'Excel',
      'spreadsheet',
      'formula',
      'office',
      '公式',
      '办公',
      '两列比对',
      '查重',
      '表格清洗'
    ],
    userTypes: ['generalUsers']
  },
  {
    type: 'image-generic',
    path: 'image-generic/bead-pattern',
    externalUrl: 'https://pingxingxian.space/tools/bead-pattern',
    name: 'translation:mainSiteTools.bead.title',
    description: 'translation:mainSiteTools.bead.description',
    shortDescription: 'translation:mainSiteTools.bead.shortDescription',
    icon: 'material-symbols-light:image-outline-rounded',
    keywords: [
      'bead',
      'perler',
      'pattern',
      'pixel',
      '拼豆',
      '图纸',
      '色号',
      '用量',
      '创作'
    ],
    userTypes: ['generalUsers']
  }
];
