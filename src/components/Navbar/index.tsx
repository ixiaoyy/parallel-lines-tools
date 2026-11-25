import React from 'react';
import {
  AppBar,
  Box,
  FormControl,
  IconButton,
  MenuItem,
  Select,
  SelectChangeEvent,
  Stack,
  Toolbar,
  Typography,
  useTheme
} from '@mui/material';
import WbSunnyOutlinedIcon from '@mui/icons-material/WbSunnyOutlined';
import DarkModeOutlinedIcon from '@mui/icons-material/DarkModeOutlined';
import { Link, useLocation } from 'react-router-dom';
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

/** 提供工具箱品牌、语言及主题入口；不在使用界面展示项目源码或版本信息。 */
const Navbar: React.FC<NavbarProps> = ({ mode, onChangeMode }) => {
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const isHome = useLocation().pathname === '/';
  const isDark = theme.palette.mode === 'dark';
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
      <FormControl size="small" sx={{ minWidth: { xs: 96, md: 108 } }}>
        <Select
          value={i18n.resolvedLanguage || 'zh'}
          onChange={handleLanguageChange}
          inputProps={{ 'aria-label': t('navbar.language') }}
          sx={{
            height: 34,
            fontSize: 13.5,
            borderRadius: '6px',
            bgcolor: isHome
              ? isDark
                ? 'rgba(255,255,255,0.04)'
                : 'rgba(255,255,255,0.65)'
              : 'transparent',
            '& .MuiOutlinedInput-notchedOutline': {
              borderColor: isDark ? 'rgba(255,255,255,0.2)' : '#dad3c8'
            },
            '&:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: isDark ? 'rgba(255,255,255,0.38)' : '#bfb6a8'
            },
            '& .MuiSelect-select': {
              py: 0.5,
              pl: 1.5,
              pr: '28px !important'
            }
          }}
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
        sx={{
          width: 38,
          height: 38,
          color: isDark ? '#e6dfd5' : '#3a3d42'
        }}
      >
        {isDark ? (
          <DarkModeOutlinedIcon sx={{ fontSize: 21 }} />
        ) : (
          <WbSunnyOutlinedIcon sx={{ fontSize: 21 }} />
        )}
      </IconButton>
    </>
  );

  return (
    <AppBar
      position="static"
      sx={{
        background: isHome && !isDark ? '#fbf8f3' : 'transparent',
        boxShadow: 'none',
        color: 'text.primary',
        borderBottom: isHome ? 0 : '1px solid',
        borderColor: 'divider',
        px: isHome ? { xs: 2, sm: 4, md: 5 } : 0
      }}
    >
      <Toolbar
        disableGutters={isHome}
        sx={{
          justifyContent: 'space-between',
          gap: { xs: 1, md: 2 },
          px: isHome ? 0 : { xs: 1.5, sm: 3 },
          width: '100%',
          maxWidth: isHome ? 1120 : 1280,
          mx: 'auto',
          ...(isHome
            ? {
                minHeight: { xs: 56, md: 64 },
                borderBottom: '1px solid',
                borderColor: isDark ? '#8a5d4e' : '#d69b86'
              }
            : {})
        }}
      >
        <Box sx={{ minWidth: 0 }}>
          <Typography
            component={Link}
            to="/"
            sx={{
              color: isDark ? '#f3ece1' : '#23262b',
              display: 'inline-flex',
              alignItems: 'center',
              fontSize: { xs: 18, md: 21 },
              fontWeight: 700,
              letterSpacing: '0.01em',
              textDecoration: 'none',
              '&:hover': {
                color: isDark ? '#ffffff' : '#111317'
              }
            }}
          >
            {t('hero.brand')}
          </Typography>
        </Box>
        {/* 手机也常驻语言入口；切换不刷新页面，不丢弃当前工具输入。 */}
        <Stack
          direction="row"
          spacing={{ xs: 0.75, md: 1.25 }}
          alignItems="center"
          sx={{ flexShrink: 0 }}
        >
          {controls}
        </Stack>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;
