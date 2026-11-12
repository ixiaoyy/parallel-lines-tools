import { useTranslation as useInlineTranslation } from 'react-i18next';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Box, Button, Typography } from '@mui/material';
import ToolContent from '@components/ToolContent';
import ToolPdfInput from '@components/input/ToolPdfInput';
import { ToolComponentProps } from '@tools/defineTool';
import {
  ConversionProgress,
  ImagePreview,
  convertPdfToPngImages,
  PdfPngConversionError,
  PdfPngFailureCode
} from './service';
import ToolMultiFileResult from '@components/result/ToolMultiFileResult';

const noAutomaticCompute = () => {};
type Failure = Exclude<PdfPngFailureCode, 'cancelled'>;
const failureMessages = {
  timeout: 'inline.pngError_timeout',
  encoding: 'inline.pngError_encoding',
  canvas: 'inline.pngError_canvas',
  failed: 'inline.pngError_failed',
  cleanup: 'inline.pngError_cleanup'
} as const satisfies Record<Failure, string>;

export default function PdfToPng({ title }: ToolComponentProps) {
  // 本工具的展示文案随语言切换更新；示例原始数据与计算参数保持不变。
  const { t: inlineText } = useInlineTranslation('pdf');

  const [input, setInput] = useState<File | null>(null);
  const [images, setImages] = useState<ImagePreview[]>([]);
  const [zipBlob, setZipBlob] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState<ConversionProgress | null>(null);
  const [failure, setFailure] = useState<Failure | null>(null);
  const [cancelled, setCancelled] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const generation = useRef(0);
  const active = useRef<AbortController | null>(null);

  // 选择/清空在事件边界立即作废旧任务；不等 React effect 才阻止迟到结果。
  const changeInput = useCallback((file: File | null) => {
    generation.current += 1;
    active.current?.abort();
    active.current = null;
    setImages([]);
    setZipBlob(null);
    setLoading(false);
    setProgress(null);
    setFailure(null);
    setCancelled(false);
    setInput(file);
  }, []);

  useEffect(() => {
    if (!input) return;
    const ownGeneration = ++generation.current;
    const controller = new AbortController();
    const isCurrent = () => generation.current === ownGeneration;
    active.current = controller;
    setLoading(true);
    setImages([]);
    setZipBlob(null);
    setFailure(null);
    setCancelled(false);
    setProgress({ stage: 'loading', page: 0, total: 0 });
    // 本工具独占异步生命周期，保留公共 ToolContent 的其他消费者和原同步合同。
    void convertPdfToPngImages(input, {
      signal: controller.signal,
      onProgress: (next) => {
        if (isCurrent()) setProgress(next);
      }
    })
      .then((result) => {
        if (!isCurrent()) return;
        setImages(result.images);
        setZipBlob(result.zipFile);
      })
      .catch((error: unknown) => {
        if (!isCurrent()) return;
        const code =
          error instanceof PdfPngConversionError ? error.code : 'failed';
        if (code === 'cancelled') setCancelled(true);
        else setFailure(code);
      })
      .finally(() => {
        if (!isCurrent()) return;
        active.current = null;
        setLoading(false);
      });
    return () => {
      generation.current += 1;
      controller.abort();
    };
  }, [input, attempt]);

  /** 主动取消后立即退出等待；服务停止 worker/ZIP，并忽略不可取消的原生编码迟到回调。 */
  const cancel = () => {
    generation.current += 1;
    active.current?.abort();
    active.current = null;
    setLoading(false);
    setCancelled(true);
    setProgress(null);
  };
  const resultFiles = useMemo(
    () =>
      images.map(
        (image) => new File([image.blob], image.filename, { type: 'image/png' })
      ),
    [images]
  );
  const progressText = progress
    ? inlineText(`inline.pngStage_${progress.stage}`, {
        page: progress.page,
        total: progress.total
      })
    : inlineText('inline.convertingPdfPages');

  return (
    <ToolContent
      title={title}
      input={input}
      initialValues={{}}
      compute={noAutomaticCompute}
      inputComponent={
        <ToolPdfInput
          value={input}
          onChange={changeInput}
          accept={['application/pdf']}
          title={inlineText('inline.uploadAPdf')}
        />
      }
      resultComponent={
        <>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 1 }}>
            <Typography role="status" variant="body2" sx={{ flex: 1 }}>
              {loading
                ? progressText
                : cancelled
                  ? inlineText('inline.pngCancelled')
                  : zipBlob
                    ? inlineText('inline.pngDone', { total: images.length })
                    : ''}
            </Typography>
            {loading && (
              <Button onClick={cancel}>{inlineText('inline.pngCancel')}</Button>
            )}
            {!loading && input && (cancelled || failure) && (
              <Button onClick={() => setAttempt((value) => value + 1)}>
                {inlineText('inline.pngRetry')}
              </Button>
            )}
          </Box>
          {failure && (
            <Alert severity="error" sx={{ mb: 1 }}>
              {inlineText(failureMessages[failure])}
            </Alert>
          )}
          <ToolMultiFileResult
            title={inlineText('inline.convertedPngPages')}
            value={resultFiles}
            zipFile={zipBlob}
            loading={loading}
            loadingText={progressText}
          />
          <Typography variant="caption" component="p" sx={{ mt: 1 }}>
            {inlineText('inline.pngLimits')}
          </Typography>
        </>
      }
      getGroups={null}
      toolInfo={{
        title: inlineText('inline.convertPdfPagesIntoPngImages'),
        description: inlineText('inline.uploadYourPdfAndGetEachPage')
      }}
    />
  );
}
