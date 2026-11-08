import {
  ChangeEvent,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Typography
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { ToolComponentProps } from '@tools/defineTool';
import { convertInWorker } from './client';
import { renderPreview } from './preview';
import {
  ConversionError,
  ConversionErrorCode,
  DOCX_MIME,
  DocumentFont,
  MAX_MARKDOWN_BYTES,
  decodeMarkdown
} from './types';

export const sampleMarkdown = `# 一份清晰的文档 / A clear document

在浏览器中把 **Markdown** 转成 Word。

## 工作清单

1. 整理内容
2. 生成文档

| 项目 | 状态 |
| --- | --- |
| 中文与 English | 已准备 |
| 表格 | 已准备 |

> 文件只在当前浏览器处理。

\`\`\`javascript
const message = '你好，世界';
\`\`\`

公式：$E = mc^2$

$$
\\frac{a+b}{c}
$$

[平行线](https://pingxingxian.space)
`;

/** 新增的 Markdown→Word 工作区；正文、预览和结果仅存于本页内存。 */
export default function MarkdownToDocx({ title }: ToolComponentProps) {
  const { t } = useTranslation('converters');
  const [markdown, setMarkdown] = useState('');
  const [font, setFont] = useState<DocumentFont>('sans');
  const [filename, setFilename] = useState('document');
  const [error, setError] = useState<ConversionErrorCode | null>(null);
  const [busy, setBusy] = useState(false);
  const [reading, setReading] = useState(false);
  const [result, setResult] = useState<ArrayBuffer | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const task = useRef<AbortController | null>(null);
  const revision = useRef(0);
  const deferredMarkdown = useDeferredValue(markdown);
  const preview = useMemo(() => {
    try {
      return renderPreview(deferredMarkdown);
    } catch {
      // 超限或二进制输入留给提交/上传边界提示；预览不继续解析这份内容。
      return '';
    }
  }, [deferredMarkdown]);

  useEffect(
    () => () => {
      revision.current += 1;
      task.current?.abort();
    },
    []
  );

  useEffect(() => {
    if (!result) {
      setDownloadUrl(null);
      return;
    }
    let url: string;
    try {
      url = URL.createObjectURL(new Blob([result], { type: DOCX_MIME }));
    } catch {
      setResult(null);
      setError('failed');
      return;
    }
    setDownloadUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [result]);

  /** 输入或设置变化时终止旧转换并废弃下载，返回新的任务版本以隔离异步回调。 */
  function invalidate(): number {
    revision.current += 1;
    task.current?.abort();
    task.current = null;
    setBusy(false);
    setReading(false);
    setResult(null);
    setError(null);
    return revision.current;
  }

  /** 只读一份大小受限的 UTF-8 Markdown 文件；读取完成后仍核对是否为当前任务。 */
  async function loadFile(file: File): Promise<void> {
    const current = invalidate();
    if (!/\.(md|markdown)$/i.test(file.name)) {
      setError('unsupportedFile');
      return;
    }
    if (file.size > MAX_MARKDOWN_BYTES) {
      setError('tooLarge');
      return;
    }
    setReading(true);
    try {
      const data = await file.arrayBuffer();
      if (revision.current !== current) return;
      const text = decodeMarkdown(data);
      setMarkdown(text);
      setFilename(file.name.replace(/\.[^.]+$/, ''));
    } catch (failure) {
      if (revision.current === current) {
        setError(
          failure instanceof ConversionError ? failure.code : 'readFailed'
        );
      }
    } finally {
      if (revision.current === current) setReading(false);
    }
  }

  /** 通过隔离 Worker 生成本次输入的文档；修改/取消后旧结果不得回填。 */
  async function convert(): Promise<void> {
    const current = invalidate();
    const controller = new AbortController();
    task.current = controller;
    setBusy(true);
    try {
      const buffer = await convertInWorker(markdown, font, controller.signal);
      if (revision.current === current) setResult(buffer);
    } catch (failure) {
      if (revision.current === current) {
        setError(failure instanceof ConversionError ? failure.code : 'failed');
      }
    } finally {
      if (revision.current === current) {
        setBusy(false);
        task.current = null;
      }
    }
  }

  /** 选择文件后复位原生输入，使用户可再次选择同名文件重试。 */
  function onFileInput(event: ChangeEvent<HTMLInputElement>): void {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = '';
    if (file) void loadFile(file);
  }

  // 文件名保留中文，仅替换控制字符和操作系统不允许的路径字符。
  const safeFilename =
    Array.from(filename, (character) =>
      character.charCodeAt(0) < 32 ? '_' : character
    )
      .join('')
      .replace(/[<>:"/\\|?*]/g, '_')
      .replace(/\.docx$/i, '')
      .trim()
      .slice(0, 80) || 'document';

  return (
    <Box id="tool" aria-label={title} sx={{ mb: 4 }}>
      <Alert severity="info" sx={{ mb: 2 }}>
        {t('markdownToDocx.privacy')}
      </Alert>
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Stack spacing={2}>
            <Paper
              variant="outlined"
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                event.preventDefault();
                if (event.dataTransfer.files.length !== 1) {
                  invalidate();
                  setError('unsupportedFile');
                  return;
                }
                void loadFile(event.dataTransfer.files[0]);
              }}
              sx={{ p: 2, textAlign: 'center', borderStyle: 'dashed' }}
            >
              <Button
                component="label"
                variant="outlined"
                sx={{ minHeight: 44 }}
              >
                {t('markdownToDocx.upload')}
                <input
                  type="file"
                  accept=".md,.markdown,text/markdown"
                  hidden
                  onChange={onFileInput}
                />
              </Button>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                {t('markdownToDocx.dropHint')}
              </Typography>
            </Paper>
            <TextField
              label={t('markdownToDocx.inputLabel')}
              placeholder={t('markdownToDocx.placeholder')}
              value={markdown}
              onChange={(event) => {
                invalidate();
                setMarkdown(event.target.value);
              }}
              multiline
              minRows={14}
              maxRows={24}
              fullWidth
              inputProps={{
                spellCheck: false,
                'data-testid': 'markdown-input'
              }}
              helperText={t('markdownToDocx.limits', {
                count: markdown.length
              })}
              sx={{
                '& textarea': {
                  fontFamily: 'Consolas, monospace',
                  fontSize: 14
                }
              }}
            />
            <Button
              onClick={() => {
                invalidate();
                setMarkdown(sampleMarkdown);
                setFilename('sample');
              }}
              sx={{ alignSelf: 'flex-start', minHeight: 44 }}
            >
              {t('markdownToDocx.sample')}
            </Button>
          </Stack>
        </Grid>
        <Grid item xs={12} md={6}>
          <Stack spacing={2}>
            <TextField
              label={t('markdownToDocx.filename')}
              value={filename}
              onChange={(event) => setFilename(event.target.value)}
              helperText={t('markdownToDocx.extensionHint')}
              inputProps={{ maxLength: 90 }}
              fullWidth
            />
            <FormControl fullWidth>
              <InputLabel id="docx-font-label">
                {t('markdownToDocx.font')}
              </InputLabel>
              <Select
                labelId="docx-font-label"
                label={t('markdownToDocx.font')}
                value={font}
                onChange={(event) => {
                  invalidate();
                  setFont(event.target.value === 'serif' ? 'serif' : 'sans');
                }}
              >
                <MenuItem value="sans">{t('markdownToDocx.fontSans')}</MenuItem>
                <MenuItem value="serif">
                  {t('markdownToDocx.fontSerif')}
                </MenuItem>
              </Select>
            </FormControl>
            <Typography variant="body2" color="text.secondary">
              {t('markdownToDocx.fontHint')}
            </Typography>
            <Alert severity="warning">{t('markdownToDocx.imageNotice')}</Alert>
            <Stack direction="row" flexWrap="wrap" gap={1}>
              <Button
                variant="contained"
                onClick={() => void convert()}
                disabled={busy || reading}
                startIcon={
                  busy ? (
                    <CircularProgress color="inherit" size={16} />
                  ) : undefined
                }
                sx={{ minHeight: 44 }}
              >
                {t(
                  busy ? 'markdownToDocx.converting' : 'markdownToDocx.convert'
                )}
              </Button>
              {busy && (
                <Button
                  onClick={() => {
                    invalidate();
                    setError('cancelled');
                  }}
                  sx={{ minHeight: 44 }}
                >
                  {t('markdownToDocx.cancel')}
                </Button>
              )}
              <Button
                onClick={() => {
                  invalidate();
                  setMarkdown('');
                  setFilename('document');
                  setFont('sans');
                }}
                sx={{ minHeight: 44 }}
              >
                {t('markdownToDocx.reset')}
              </Button>
            </Stack>
            {reading && (
              <Typography role="status">
                {t('markdownToDocx.reading')}
              </Typography>
            )}
            {busy && (
              <Typography role="status">
                {t('markdownToDocx.busyHint')}
              </Typography>
            )}
            {error && (
              <Alert severity={error === 'cancelled' ? 'info' : 'error'}>
                {t(`markdownToDocx.errors.${error}`)}
              </Alert>
            )}
            {result && downloadUrl && (
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Typography role="status" sx={{ mb: 1 }}>
                  {t('markdownToDocx.ready', {
                    size: (result.byteLength / 1024).toFixed(1)
                  })}
                </Typography>
                <Button
                  component="a"
                  variant="contained"
                  href={downloadUrl}
                  download={`${safeFilename}.docx`}
                  sx={{ minHeight: 44 }}
                >
                  {t('markdownToDocx.download')}
                </Button>
              </Paper>
            )}
            <Box>
              <Typography component="h2" variant="h6">
                {t('markdownToDocx.previewTitle')}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                {t('markdownToDocx.previewHint')}
              </Typography>
              <Paper
                variant="outlined"
                sx={{
                  p: 2,
                  minHeight: 200,
                  maxHeight: 540,
                  overflow: 'auto',
                  overflowWrap: 'anywhere',
                  '& h1': { fontSize: 26 },
                  '& h2': { fontSize: 22 },
                  '& p, & ul, & ol': { my: 1 },
                  '& ul, & ol': { pl: 3 },
                  '& pre': {
                    p: 1.5,
                    bgcolor: 'action.hover',
                    overflow: 'auto',
                    whiteSpace: 'pre-wrap'
                  },
                  '& blockquote': {
                    borderLeft: 3,
                    borderColor: 'divider',
                    pl: 2,
                    ml: 0
                  },
                  '& table': { borderCollapse: 'collapse', width: '100%' },
                  '& th, & td': {
                    border: 1,
                    borderColor: 'divider',
                    px: 1.5,
                    py: 1
                  }
                }}
              >
                {preview ? (
                  <div
                    data-testid="markdown-preview"
                    dangerouslySetInnerHTML={{ __html: preview }}
                  />
                ) : (
                  <Typography color="text.secondary">
                    {t('markdownToDocx.previewEmpty')}
                  </Typography>
                )}
              </Paper>
            </Box>
          </Stack>
        </Grid>
      </Grid>
    </Box>
  );
}
