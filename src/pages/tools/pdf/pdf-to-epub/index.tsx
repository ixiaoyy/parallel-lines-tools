import { useTranslation as useInlineTranslation } from 'react-i18next';
import { useState, useEffect } from 'react';
import ToolFileResult from '@components/result/ToolFileResult';
import ToolContent from '@components/ToolContent';
import { ToolComponentProps } from '@tools/defineTool';
import ToolPdfInput from '@components/input/ToolPdfInput';
import { convertPdfToEpub } from './service';

export default function PdfToEpub({ title }: ToolComponentProps) {
  // 本工具的展示文案随语言切换更新；示例原始数据与计算参数保持不变。
  const { t: inlineText } = useInlineTranslation('pdf');

  const [input, setInput] = useState<File | null>(null);
  const [result, setResult] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  const compute = async (options: {}, input: File | null) => {
    if (!input) return;
    try {
      setIsProcessing(true);
      setResult(null);
      const epub = await convertPdfToEpub(input);
      setResult(epub);
    } catch (error) {
      console.error('Failed to convert PDF to EPUB:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <ToolContent
      title={title}
      input={input}
      setInput={setInput}
      initialValues={{}}
      compute={compute}
      inputComponent={
        <ToolPdfInput
          value={input}
          onChange={(file) => setInput(file)}
          accept={['application/pdf']}
          title={inlineText('compressPdf.inputTitle')}
        />
      }
      getGroups={null}
      resultComponent={
        <ToolFileResult
          title={inlineText('inline.epubOutput')}
          value={result}
          extension={'epub'}
          loading={isProcessing}
          loadingText={inlineText('inline.convertingPdfToEpub')}
        />
      }
      toolInfo={{
        title: inlineText('inline.howToUsePdfToEpub'),
        description: `Upload a PDF file and this tool will convert it into an EPUB format, suitable for most e-reader devices.`
      }}
    />
  );
}
