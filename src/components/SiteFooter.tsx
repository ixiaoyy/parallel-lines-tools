import { Box, Link, Stack, Typography } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

/** 与主站保持一致的三个使用入口，圈子沿用尚未开放状态。 */
export default function SiteFooter() {
  const { t } = useTranslation();
  return (
    <Box component="footer" sx={{ px: 2, py: 3, textAlign: 'center' }}>
      <Stack
        component="nav"
        aria-label={t('footer.navigation')}
        direction="row"
        spacing={1.5}
        alignItems="center"
        justifyContent="center"
        sx={{ color: 'text.secondary', fontSize: 14 }}
      >
        <Link
          href="https://pingxingxian.space/"
          target="_blank"
          rel="noopener noreferrer"
          color="inherit"
          underline="hover"
        >
          {t('footer.games')}
        </Link>
        <Typography component="span" aria-hidden="true">
          |
        </Typography>
        <Box
          component="button"
          type="button"
          disabled
          aria-label={t('footer.communityUnavailable')}
          sx={{
            border: 0,
            p: 0,
            bgcolor: 'transparent',
            color: 'text.disabled',
            font: 'inherit'
          }}
        >
          {t('footer.community')}
        </Box>
        <Typography component="span" aria-hidden="true">
          |
        </Typography>
        <Link
          component={RouterLink}
          to="/"
          aria-current="page"
          color="inherit"
          underline="hover"
          fontWeight={700}
        >
          {t('footer.tools')}
        </Link>
      </Stack>
    </Box>
  );
}
