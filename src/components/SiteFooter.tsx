import { Box, Link, Stack, Typography, useTheme } from '@mui/material';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

/** 与主站保持一致的四个产品入口，跨站链接均在当前标签打开。 */
export default function SiteFooter() {
  const { t } = useTranslation();
  const theme = useTheme();
  const isHome = useLocation().pathname === '/';
  return (
    <Box
      component="footer"
      sx={{
        px: 2,
        py: 2.5,
        textAlign: 'center',
        bgcolor:
          isHome && theme.palette.mode === 'light' ? '#fbf8f3' : 'transparent',
        // 窄屏为已有的固定返回顶部按钮留出空间，避免遮住聊天入口。
        '@media (max-width: 359px)': { pr: 9 }
      }}
    >
      <Stack
        component="nav"
        aria-label={t('footer.navigation')}
        direction="row"
        spacing={{ xs: 0, sm: 1.5 }}
        alignItems="center"
        justifyContent="center"
        sx={{
          color: 'text.secondary',
          fontSize: 14,
          '& a': {
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            minWidth: 44,
            minHeight: 44
          }
        }}
      >
        <Link
          href="https://pingxingxian.space/"
          color="inherit"
          underline="hover"
        >
          {t('footer.games')}
        </Link>
        <Typography component="span" aria-hidden="true">
          |
        </Typography>
        <Link
          href="https://forum.pingxingxian.space/"
          color="inherit"
          underline="hover"
        >
          {t('footer.community')}
        </Link>
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
        <Typography component="span" aria-hidden="true">
          |
        </Typography>
        <Link
          href="https://chat.pingxingxian.space/"
          color="inherit"
          underline="hover"
        >
          {t('footer.chat')}
        </Link>
      </Stack>
    </Box>
  );
}
