import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Link,
  Stack,
  TextField,
  Typography
} from '@mui/material';
import { useId, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { DefinedTool } from '@tools/defineTool';

interface OfflineInstallDialogProps {
  name: string;
  installation: NonNullable<DefinedTool['offlineInstall']>;
  onClose: () => void;
}

/** 三步手动安装向导；本站原包紧邻对应源码与许可入口，不执行安装或修改设置。 */
export default function OfflineInstallDialog({
  name,
  installation,
  onClose
}: OfflineInstallDialogProps) {
  const { t } = useTranslation('translation');
  const titleId = useId();
  const [copyStatus, setCopyStatus] = useState<
    'idle' | 'copying' | 'copied' | 'failed'
  >('idle');

  /** 只复制公开的扩展页地址；失败时保留可手动复制的字段，不伪装成功或改用脚本。 */
  const copyAddress = async () => {
    setCopyStatus('copying');
    try {
      await navigator.clipboard.writeText('chrome://extensions');
      setCopyStatus('copied');
    } catch {
      setCopyStatus('failed');
    }
  };

  return (
    <Dialog
      open
      onClose={onClose}
      aria-labelledby={titleId}
      fullWidth
      maxWidth="sm"
    >
      <DialogTitle id={titleId}>
        {t('catalog.offline.title', { name })}
      </DialogTitle>
      <DialogContent dividers>
        <Alert severity="warning" sx={{ mb: 2 }}>
          {t('catalog.offline.warning')}
        </Alert>
        <Stack spacing={3}>
          <Box>
            <Typography component="h3" fontWeight={700}>
              {t('catalog.offline.step1Title')}
            </Typography>
            <Typography sx={{ mt: 1, lineHeight: 1.7 }}>
              {t('catalog.offline.step1')}
            </Typography>
            <Button
              component="a"
              href={installation.packageUrl}
              target="_blank"
              rel="noopener noreferrer"
              variant="contained"
              sx={{ mt: 1, minHeight: 44 }}
            >
              {t(
                installation.selfHosted
                  ? 'catalog.offline.downloadHosted'
                  : 'catalog.offline.download'
              )}
            </Button>
            {installation.version && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                {t('catalog.offline.version', {
                  version: installation.version
                })}
              </Typography>
            )}
            {installation.selfHosted && (
              <Stack
                direction="row"
                spacing={2}
                useFlexGap
                flexWrap="wrap"
                sx={{ mt: 1 }}
              >
                <Link href={installation.selfHosted.sourceUrl}>
                  {t('catalog.offline.source')}
                </Link>
                <Link
                  href={installation.selfHosted.licenseUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {t('catalog.offline.license')}
                </Link>
                <Link
                  href={installation.selfHosted.noticeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {t('catalog.offline.notices')}
                </Link>
              </Stack>
            )}
          </Box>
          <Box>
            <Typography component="h3" fontWeight={700}>
              {t('catalog.offline.step2Title')}
            </Typography>
            <Typography sx={{ mt: 1, lineHeight: 1.7 }}>
              {t('catalog.offline.step2')}
            </Typography>
            <TextField
              label={t('catalog.offline.addressLabel')}
              value="chrome://extensions"
              inputProps={{ readOnly: true }}
              fullWidth
              size="small"
              sx={{ mt: 2 }}
            />
            <Button
              onClick={copyAddress}
              disabled={copyStatus === 'copying'}
              sx={{ mt: 1, minHeight: 44 }}
            >
              {t(
                copyStatus === 'copying'
                  ? 'catalog.offline.copying'
                  : 'catalog.offline.copy'
              )}
            </Button>
            {copyStatus === 'copied' && (
              <Alert severity="success" role="status">
                {t('catalog.offline.copied')}
              </Alert>
            )}
            {copyStatus === 'failed' && (
              <Alert severity="error">{t('catalog.offline.copyFailed')}</Alert>
            )}
          </Box>
          <Box>
            <Typography component="h3" fontWeight={700}>
              {t('catalog.offline.step3Title')}
            </Typography>
            <Typography sx={{ mt: 1, lineHeight: 1.7 }}>
              {t('catalog.offline.step3')}
            </Typography>
          </Box>
        </Stack>
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ mt: 3, lineHeight: 1.7 }}
        >
          {t('catalog.offline.updateNotice')}
        </Typography>
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ mt: 1, lineHeight: 1.7 }}
        >
          {t(
            installation.selfHosted
              ? 'catalog.offline.hostedNotice'
              : 'catalog.offline.networkNotice'
          )}
        </Typography>
        <Link
          href={installation.instructionsUrl}
          target="_blank"
          rel="noopener noreferrer"
          sx={{ display: 'inline-block', py: 1.5 }}
        >
          {t('catalog.offline.guide')}
        </Link>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} sx={{ minHeight: 44 }}>
          {t('catalog.offline.close')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
