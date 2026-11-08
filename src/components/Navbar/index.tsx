import React, { useState } from 'react';
import {
  AppBar,
  Box,
  Button,
  Drawer,
  FormControl,
  IconButton,
  MenuItem,
  Select,
  SelectChangeEvent,
  Stack,
  Toolbar,
  Typography
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import Brightness6Icon from '@mui/icons-material/Brightness6';
import { Link } from 'react-router-dom';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import { Mode } from 'components/App';
import { useTranslation } from 'react-i18next';

interface NavbarProps {
  mode: Mode;
  onChangeMode: () => void;
}

const languages = [
  { code: 'zh', label: '简体中文' },
  { code: 'en', label: 'English' },
  { code: 'de', label: 'Deutsch' },
  { code: 'es', label: 'Español' },
  { code: 'fr', label: 'Français' },
  { code: 'pt', label: 'Português' },
  { code: 'ja', label: '日本語' },
  { code: 'hi', label: 'हिंदी' },
  { code: 'nl', label: 'Nederlands' },
  { code: 'ru', label: 'Русский' },
  { code: 'uk', label: 'Українська' }
];

/** 提供工具箱品牌、语言及主题入口；外部归属仅以普通链接呈现，不自动请求第三方。 */
const Navbar: React.FC<NavbarProps> = ({ mode, onChangeMode }) => {
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [drawerOpen, setDrawerOpen] = useState(false);
  const modeLabel = t(
    mode === 'light'
      ? 'navbar.themeLight'
      : mode === 'dark'
        ? 'navbar.themeDark'
        : 'navbar.themeSystem'
  );

  // i18next 的本地语言缓存只保存语言代码，不保存工具输入。
  const handleLanguageChange = (event: SelectChangeEvent) => {
    void i18n.changeLanguage(event.target.value);
  };
  const controls = (
    <>
      <FormControl size="small" sx={{ minWidth: 120 }}>
        <Select
          value={i18n.resolvedLanguage || 'zh'}
          onChange={handleLanguageChange}
          inputProps={{ 'aria-label': t('navbar.language') }}
        >
          {languages.map((language) => (
            <MenuItem key={language.code} value={language.code}>
              {language.label}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      <IconButton
        aria-label={t('navbar.theme', { mode: modeLabel })}
        title={t('navbar.theme', { mode: modeLabel })}
        onClick={onChangeMode}
        sx={{ minWidth: 44, minHeight: 44 }}
      >
        <Brightness6Icon />
      </IconButton>
      <Button
        component="a"
        href="https://pingxingxian.space/tools"
        color="inherit"
      >
        {t('navbar.mainTools')}
      </Button>
      <Button
        component="a"
        href="https://github.com/iib0011/omni-tools"
        target="_blank"
        rel="noopener noreferrer"
        color="inherit"
      >
        {t('navbar.source')}
      </Button>
    </>
  );

  return (
    <AppBar
      position="static"
      sx={{
        background: 'transparent',
        boxShadow: 'none',
        color: 'text.primary',
        pt: 2
      }}
    >
      <Toolbar
        sx={{
          justifyContent: 'space-between',
          gap: 2,
          width: '100%',
          maxWidth: 1280,
          mx: 'auto'
        }}
      >
        <Box>
          <Typography
            component={Link}
            to="/"
            sx={{
              color: 'text.primary',
              fontSize: { xs: 20, md: 24 },
              fontWeight: 700,
              textDecoration: 'none'
            }}
          >
            {t('hero.brand')}
          </Typography>
          <Typography variant="caption" display="block" color="text.secondary">
            OmniTools · v{__APP_VERSION__}
          </Typography>
        </Box>
        {isMobile ? (
          <>
            <IconButton
              aria-label={t('navbar.menu')}
              onClick={() => setDrawerOpen(true)}
              sx={{ minWidth: 44, minHeight: 44 }}
            >
              <MenuIcon />
            </IconButton>
            <Drawer
              anchor="right"
              open={drawerOpen}
              onClose={() => setDrawerOpen(false)}
            >
              <Stack
                spacing={2}
                alignItems="stretch"
                sx={{ p: 3, minWidth: 240 }}
              >
                {controls}
              </Stack>
            </Drawer>
          </>
        ) : (
          <Stack direction="row" spacing={1.5} alignItems="center">
            {controls}
          </Stack>
        )}
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;
