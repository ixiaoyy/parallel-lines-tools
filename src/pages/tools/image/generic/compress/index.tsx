import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Alert,
  Box,
  Button,
  Checkbox,
  FormControlLabel,
  Grid,
  LinearProgress,
  MenuItem,
  Paper,
  Slider,
  Stack,
  TextField,
  Typography
} from '@mui/material';
import { ToolComponentProps } from '@tools/defineTool';
import { InitialValuesType } from './types';
import {
  compressImages,
  IMAGE_LIMITS,
  ImageCompressionError,
  validateImageBatch,
  validateImageDimensions
} from './service';

interface PreviewFile {
  file: File;
  url: string;
}
const initialValues: InitialValuesType = {
  maxFileSizeInMB: 1,
  quality: 80,
  format: 'keep',
  maxWidthOrHeight: 1920
};

/** 释放本页持有的预览/下载资源；只处理传入对象，不触及浏览器其他页面。 */
function release(files: PreviewFile[]): void {
  files.forEach(({ url }) => URL.revokeObjectURL(url));
}

/** 检测浏览器实际编码格式，避免不支持 WebP 时悄悄输出 PNG。 */
function supportedFormat(format: string): boolean {
  const canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 1;
  return canvas.toDataURL(format).startsWith(`data:${format};`);
}

/** 原入口的显式批量压缩工作区：文件留在内存，修改设置后需重新执行，取消和重置不会保留旧结果。 */
export default function CompressImage({ title }: ToolComponentProps) {
  const { t } = useTranslation('image');
  const [input, setInput] = useState<PreviewFile[]>([]);
  const [results, setResults] = useState<PreviewFile[]>([]);
  const [zip, setZip] = useState<PreviewFile | null>(null);
  const [values, setValues] = useState<InitialValuesType>(initialValues);
  const [processing, setProcessing] = useState(false);
  const [validating, setValidating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const [dragging, setDragging] = useState(false);
  const [jpegConsent, setJpegConsent] = useState(false);
  const resources = useRef<{
    input: PreviewFile[];
    results: PreviewFile[];
    zip: PreviewFile | null;
  }>({ input: [], results: [], zip: null });
  const controller = useRef<AbortController | null>(null);
  const generation = useRef(0);
  const mounted = useRef(true);
  const fileInput = useRef<HTMLInputElement>(null);
  const webpSupported = useState(() => supportedFormat('image/webp'))[0];

  useEffect(
    () => () => {
      mounted.current = false;
      generation.current++;
      controller.current?.abort();
      release(resources.current.input);
      release(resources.current.results);
      if (resources.current.zip) release([resources.current.zip]);
    },
    []
  );

  /** 使旧结果失效；更改输入/设置后不能再误下载上一轮产物。 */
  function clearResults(): void {
    release(resources.current.results);
    if (resources.current.zip) release([resources.current.zip]);
    resources.current.results = [];
    resources.current.zip = null;
    setResults([]);
    setZip(null);
    setProgress(0);
  }

  /** 更新设置并清除旧产物，不自动触发昂贵的图片编码。 */
  function updateValues(patch: Partial<InitialValuesType>): void {
    clearResults();
    setError('');
    setValues((previous) => ({ ...previous, ...patch }));
    if (patch.format !== undefined) setJpegConsent(false);
  }

  /** 校验替换选择，失败不丢弃旧输入；限制文件头读取和像素，所有文件通过后才建立预览 URL。 */
  async function selectFiles(files: File[]): Promise<void> {
    if (processing || !files.length) return;
    const current = ++generation.current;
    // 新选择即使校验失败也废弃旧下载，只保留仍合法的旧输入供用户重新处理。
    clearResults();
    setValidating(true);
    setError('');
    try {
      validateImageBatch(files);
      for (const file of files) await validateImageDimensions(file);
      if (!mounted.current || current !== generation.current) return;
      const selected = files.map((file) => ({
        file,
        url: URL.createObjectURL(file)
      }));
      release(resources.current.input);
      resources.current.input = selected;
      setInput(selected);
      setJpegConsent(false);
    } catch (cause) {
      if (mounted.current && current === generation.current)
        setError(
          t(
            `compress.errors.${
              cause instanceof ImageCompressionError
                ? cause.code
                : 'invalidImage'
            }`
          )
        );
    } finally {
      if (mounted.current && current === generation.current)
        setValidating(false);
    }
  }

  /** 仅在点击后处理输入快照；总超时和取消由服务统一管理，失败不展示不完整批次。 */
  async function run(): Promise<void> {
    if (!input.length || processing || validating) return;
    const current = ++generation.current;
    clearResults();
    setError('');
    setProcessing(true);
    const active = new AbortController();
    controller.current = active;
    try {
      const output = await compressImages(
        input.map(({ file }) => file),
        values,
        {
          signal: active.signal,
          onProgress: (percent) => {
            if (mounted.current && current === generation.current)
              setProgress(percent);
          }
        }
      );
      if (!output || !mounted.current || current !== generation.current) return;
      const completed = output.results.map((file) => ({
        file,
        url: URL.createObjectURL(file)
      }));
      const archive = output.zipFile
        ? { file: output.zipFile, url: URL.createObjectURL(output.zipFile) }
        : null;
      resources.current.results = completed;
      resources.current.zip = archive;
      setResults(completed);
      setZip(archive);
    } catch (cause) {
      if (mounted.current && current === generation.current)
        setError(
          t(
            `compress.errors.${
              cause instanceof ImageCompressionError ? cause.code : 'failed'
            }`
          )
        );
    } finally {
      if (mounted.current && current === generation.current) {
        setProcessing(false);
        controller.current = null;
      }
    }
  }

  /** 取消当前任务并恢复空工作区；同时使尚未完成的选择校验失效。 */
  function reset(): void {
    generation.current++;
    controller.current?.abort();
    controller.current = null;
    release(resources.current.input);
    resources.current.input = [];
    setInput([]);
    clearResults();
    setError('');
    setProcessing(false);
    setValidating(false);
    setJpegConsent(false);
    if (fileInput.current) fileInput.current.value = '';
  }

  /** 触发浏览器下载；系统取消保存不视为已下载，无法启动时在当前工作区提示。 */
  function download(item: PreviewFile): void {
    try {
      const anchor = document.createElement('a');
      anchor.href = item.url;
      anchor.download = item.file.name;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
    } catch {
      setError(t('compress.downloadFailed'));
    }
  }

  const originalSize = input.reduce((total, { file }) => total + file.size, 0);
  const compressedSize = results.reduce(
    (total, { file }) => total + file.size,
    0
  );
  const lossyJpeg =
    values.format === 'image/jpeg' &&
    input.some(({ file }) => file.type !== 'image/jpeg');
  const busy = processing || validating;
  const settingsValid =
    Number.isFinite(values.maxFileSizeInMB) &&
    values.maxFileSizeInMB >= 0.1 &&
    values.maxFileSizeInMB <= 20 &&
    Number.isInteger(values.maxWidthOrHeight) &&
    (values.maxWidthOrHeight ?? 0) >= 1 &&
    (values.maxWidthOrHeight ?? 0) <= IMAGE_LIMITS.dimension;

  return (
    <Stack spacing={3} id="tool" aria-label={title} mb={4}>
      <Alert severity="info">{t('compress.localNotice')}</Alert>
      <Paper
        variant="outlined"
        sx={{
          p: { xs: 2, md: 3 },
          borderStyle: dragging ? 'dashed' : 'solid',
          borderColor: dragging ? 'primary.main' : 'divider'
        }}
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          if (!busy) void selectFiles(Array.from(event.dataTransfer.files));
        }}
      >
        <Stack spacing={1.5} alignItems="flex-start">
          <Typography component="h2" variant="h6">
            {t('compress.inputTitle')}
          </Typography>
          <Typography color="text.secondary">
            {t('compress.dropHint')}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {t('compress.limits')}
          </Typography>
          <Button
            component="label"
            variant="outlined"
            disabled={busy}
            sx={{ minHeight: 44 }}
          >
            {t('compress.chooseFiles')}
            <input
              ref={fileInput}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              hidden
              disabled={busy}
              onChange={(event) => {
                const files = Array.from(event.target.files ?? []);
                event.target.value = '';
                void selectFiles(files);
              }}
            />
          </Button>
          {input.length > 0 && (
            <Typography role="status">
              {t('compress.selected', { count: input.length })} ·{' '}
              {(originalSize / 1024).toFixed(2)} KB
            </Typography>
          )}
        </Stack>
      </Paper>
      <Paper variant="outlined" sx={{ p: { xs: 2, md: 3 } }}>
        <Typography component="h2" variant="h6" mb={2}>
          {t('compress.compressionOptions')}
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <TextField
              select
              fullWidth
              label={t('compress.outputFormat')}
              value={values.format}
              disabled={busy}
              onChange={(event) =>
                updateValues({
                  format: event.target.value as InitialValuesType['format']
                })
              }
            >
              <MenuItem value="keep">{t('compress.keepFormat')}</MenuItem>
              <MenuItem value="image/jpeg">JPEG</MenuItem>
              <MenuItem value="image/png">PNG</MenuItem>
              <MenuItem value="image/webp" disabled={!webpSupported}>
                WebP{!webpSupported ? ` · ${t('compress.unsupported')}` : ''}
              </MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              type="number"
              fullWidth
              label={t('compress.maxEdge')}
              helperText={t('compress.maxEdgeHint')}
              value={values.maxWidthOrHeight}
              disabled={busy}
              inputProps={{ min: 1, max: IMAGE_LIMITS.dimension, step: 1 }}
              onChange={(event) =>
                updateValues({ maxWidthOrHeight: Number(event.target.value) })
              }
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              type="number"
              fullWidth
              label={t('compress.targetSize')}
              helperText={t('compress.targetSizeHint')}
              value={values.maxFileSizeInMB}
              disabled={busy}
              inputProps={{ min: 0.1, max: 20, step: 0.1 }}
              onChange={(event) =>
                updateValues({ maxFileSizeInMB: Number(event.target.value) })
              }
            />
          </Grid>
          <Grid item xs={12}>
            <Typography id="compression-quality-label">
              {t('compress.qualityLabel', { quality: values.quality })}
            </Typography>
            <Slider
              aria-labelledby="compression-quality-label"
              value={values.quality}
              min={10}
              max={100}
              step={1}
              valueLabelDisplay="auto"
              disabled={busy}
              onChange={(_, quality) =>
                updateValues({ quality: Number(quality) })
              }
            />
            <Typography variant="body2" color="text.secondary">
              {t('compress.qualityHint')}
            </Typography>
          </Grid>
        </Grid>
        <Typography variant="body2" color="text.secondary" mt={1}>
          {t('compress.exifNotice')}
        </Typography>
        {lossyJpeg && (
          <Stack mt={2}>
            <Alert severity="warning">{t('compress.jpegNotice')}</Alert>
            <FormControlLabel
              control={
                <Checkbox
                  checked={jpegConsent}
                  disabled={busy}
                  onChange={(event) => setJpegConsent(event.target.checked)}
                />
              }
              label={t('compress.jpegConsent')}
            />
          </Stack>
        )}
      </Paper>
      {error && (
        <Alert
          severity={error === t('compress.errors.cancelled') ? 'info' : 'error'}
          role="alert"
        >
          {error}
        </Alert>
      )}
      {processing && (
        <Box role="status" aria-live="polite">
          <Typography mb={1}>
            {t('compress.compressing')} {progress}%
          </Typography>
          <LinearProgress
            variant="determinate"
            value={progress}
            aria-label={t('compress.compressing')}
          />
        </Box>
      )}
      {validating && (
        <Typography role="status">{t('compress.validating')}</Typography>
      )}
      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
        <Button
          variant="contained"
          sx={{ minHeight: 44 }}
          disabled={
            !input.length ||
            busy ||
            !settingsValid ||
            (lossyJpeg && !jpegConsent)
          }
          onClick={() => void run()}
        >
          {t('compress.start')}
        </Button>
        {processing && (
          <Button
            variant="outlined"
            sx={{ minHeight: 44 }}
            onClick={() => controller.current?.abort()}
          >
            {t('compress.cancel')}
          </Button>
        )}
        <Button
          variant="outlined"
          sx={{ minHeight: 44 }}
          disabled={!input.length && !busy}
          onClick={reset}
        >
          {t('compress.reset')}
        </Button>
        {zip && (
          <Button
            variant="outlined"
            sx={{ minHeight: 44 }}
            onClick={() => download(zip)}
          >
            {t('compress.downloadZip')}
          </Button>
        )}
      </Stack>
      {results.length > 0 && (
        <Alert severity={compressedSize < originalSize ? 'success' : 'warning'}>
          {t('compress.originalSize')}: {(originalSize / 1024).toFixed(2)} KB ·{' '}
          {t('compress.compressedSize')}: {(compressedSize / 1024).toFixed(2)}{' '}
          KB ·{' '}
          {compressedSize < originalSize
            ? t('compress.saved', {
                percent: ((1 - compressedSize / originalSize) * 100).toFixed(1)
              })
            : t('compress.noSaving')}
        </Alert>
      )}
      {input.map((item, index) => {
        const output = results[index];
        return (
          <Paper variant="outlined" key={item.url} sx={{ p: 2, minWidth: 0 }}>
            <Typography
              component="h3"
              variant="subtitle1"
              sx={{ overflowWrap: 'anywhere' }}
            >
              {item.file.name}
            </Typography>
            <Grid container spacing={2} mt={0}>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" mb={1}>
                  {t('compress.before')} · {(item.file.size / 1024).toFixed(2)}{' '}
                  KB
                </Typography>
                <Box
                  component="img"
                  src={item.url}
                  alt={t('compress.before')}
                  sx={{
                    display: 'block',
                    maxWidth: '100%',
                    width: '100%',
                    height: 200,
                    objectFit: 'contain',
                    bgcolor: 'background.default',
                    borderRadius: 1
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                {output ? (
                  <Stack spacing={1}>
                    <Typography variant="body2">
                      {t('compress.after')} ·{' '}
                      {(output.file.size / 1024).toFixed(2)} KB ·{' '}
                      {output.file.type}
                    </Typography>
                    <Box
                      component="img"
                      src={output.url}
                      alt={t('compress.after')}
                      sx={{
                        display: 'block',
                        maxWidth: '100%',
                        width: '100%',
                        height: 200,
                        objectFit: 'contain',
                        bgcolor: 'background.default',
                        borderRadius: 1
                      }}
                    />
                    {output.file.size >
                      values.maxFileSizeInMB * 1024 * 1024 && (
                      <Alert severity="warning">
                        {t('compress.targetNotReached')}
                      </Alert>
                    )}
                    <Button
                      variant="outlined"
                      sx={{ alignSelf: 'flex-start', minHeight: 44 }}
                      onClick={() => download(output)}
                    >
                      {t('compress.download')}
                    </Button>
                  </Stack>
                ) : (
                  <Box
                    sx={{
                      height: 224,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      bgcolor: 'background.default',
                      borderRadius: 1
                    }}
                  >
                    <Typography color="text.secondary">
                      {t('compress.pendingResult')}
                    </Typography>
                  </Box>
                )}
              </Grid>
            </Grid>
          </Paper>
        );
      })}
    </Stack>
  );
}
