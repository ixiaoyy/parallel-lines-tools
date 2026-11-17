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
  Typography
} from '@mui/material';
import Brightness6Icon from '@mui/icons-material/Brightness6';
import { Link } from 'react-router-dom';
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
      <FormControl size="small" sx={{ minWidth: { xs: 104, md: 120 } }}>
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
    </>
  );

  return (
    <AppBar
      position="static"
      sx={{
        background: 'transparent',
        boxShadow: 'none',
        color: 'text.primary',
        borderBottom: '1px solid',
        borderColor: 'divider'
      }}
    >
      <Toolbar
        sx={{
          justifyContent: 'space-between',
          gap: { xs: 1, md: 2 },
          px: { xs: 1.5, sm: 3 },
          width: '100%',
          maxWidth: 1280,
          mx: 'auto'
        }}
      >
        <Box sx={{ minWidth: 0 }}>
          <Typography
            component={Link}
            to="/"
            sx={{
              color: 'text.primary',
              fontSize: { xs: 18, md: 24 },
              fontWeight: 700,
              textDecoration: 'none'
            }}
          >
            {t('hero.brand')}
          </Typography>
        </Box>
        {/* 手机也常驻语言入口；切换不刷新页面，不丢弃当前工具输入。 */}
        <Stack
          direction="row"
          spacing={{ xs: 0.5, md: 1.5 }}
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
