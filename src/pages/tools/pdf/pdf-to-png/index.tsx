import { useTranslation as useInlineTranslation } from 'react-i18next';
import { useState } from 'react';
import ToolContent from '@components/ToolContent';
import ToolPdfInput from '@components/input/ToolPdfInput';
import { ToolComponentProps } from '@tools/defineTool';
import { convertPdfToPngImages } from './service';
import ToolMultiFileResult from '@components/result/ToolMultiFileResult';

type ImagePreview = {
  blob: Blob;
  url: string;
  filename: string;
};

export default function PdfToPng({ title }: ToolComponentProps) {
  // 本工具的展示文案随语言切换更新；示例原始数据与计算参数保持不变。
  const { t: inlineText } = useInlineTranslation('pdf');

  const [input, setInput] = useState<File | null>(null);
  const [images, setImages] = useState<ImagePreview[]>([]);
  const [zipBlob, setZipBlob] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const compute = async (_: {}, file: File | null) => {
    if (!file) return;
    setLoading(true);
    setImages([]);
    setZipBlob(null);
    try {
      const { images, zipFile } = await convertPdfToPngImages(file);
      setImages(images);
      setZipBlob(zipFile);
    } catch (err) {
      console.error('Conversion failed:', err);
    } finally {
      setLoading(false);
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
          onChange={setInput}
          accept={['application/pdf']}
          title={inlineText('inline.uploadAPdf')}
        />
      }
      resultComponent={
        <ToolMultiFileResult
          title={inlineText('inline.convertedPngPages')}
          value={images.map((img) => {
            return new File([img.blob], img.filename, { type: 'image/png' });
          })}
          zipFile={zipBlob}
          loading={loading}
          loadingText={inlineText('inline.convertingPdfPages')}
        />
      }
      getGroups={null}
      toolInfo={{
        title: inlineText('inline.convertPdfPagesIntoPngImages'),
        description: inlineText('inline.uploadYourPdfAndGetEachPage')
      }}
    />
  );
}
