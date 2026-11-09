import { Box, Link, Stack, Typography } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

/** 统一展示实际开源归属、发行许可和延期工具说明，不嵌入第三方组件或跟踪脚本。 */
export default function SiteFooter() {
  const { t } = useTranslation();
  return (
    <Box component="footer" sx={{ px: 3, py: 4, textAlign: 'center' }}>
      <Typography variant="body2" color="text.secondary">
        {t('footer.attribution')}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ my: 1 }}>
        {t('footer.privacy')}
      </Typography>
      <Stack
        direction="row"
        spacing={2}
        justifyContent="center"
        flexWrap="wrap"
        useFlexGap
      >
        <Link component={RouterLink} to="/deferred-tools">
          {t('release.link')}
        </Link>
        <Link href="/THIRD_PARTY_NOTICES.txt">{t('footer.licenses')}</Link>
        <Link href="/toolbox-source-local-20261109.zip">
          {t('footer.modifiedSource')}
        </Link>
        {__MEDIA_CORE_SOURCE_URL__ && (
          <Link href={__MEDIA_CORE_SOURCE_URL__}>
            {t('footer.mediaSource')}
          </Link>
        )}
        <Link
          href="https://pingxingxian.space/tools"
          target="_blank"
          rel="noopener noreferrer"
        >
          平行线
        </Link>
      </Stack>
    </Box>
  );
}
