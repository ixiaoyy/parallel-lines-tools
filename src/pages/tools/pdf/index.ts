// 运行资源尚未就绪的工具保留说明路径，不加载其引擎；详见 config/deferred-tools.json。
import { tool as pdfPdfToPng } from './pdf-to-png/meta';
import { tool as pdfRotatePdf } from './rotate-pdf/meta';
import { meta as splitPdfMeta } from './split-pdf/meta';
import { meta as mergePdf } from './merge-pdf/meta';
import { DefinedTool } from '@tools/defineTool';
import { meta as pdfToEpub } from './pdf-to-epub/meta';
import { tool as convertToPdf } from './convert-to-pdf/meta';
import { meta as extractImageFromPdf } from './extract-images-from-pdf/meta';

export const pdfTools: DefinedTool[] = [
  splitPdfMeta,
  pdfRotatePdf,
  mergePdf,
  pdfToEpub,
  pdfPdfToPng,
  convertToPdf,
  extractImageFromPdf
];
