import { Box } from '@mui/material';
import Hero from 'components/Hero';
import Categories from './Categories';
import { Helmet } from 'react-helmet';
import { useTranslation } from 'react-i18next';

export default function Home() {
  const { t } = useTranslation();

  return (
    <Box
      component="main"
      sx={(theme) => ({
        '--home-rule': theme.palette.mode === 'dark' ? '#8a5d4e' : '#d69b86',
        '--home-paper-tag':
          theme.palette.mode === 'dark' ? '#4e4133' : '#efe3ca',
        '--home-ink': theme.palette.mode === 'dark' ? '#f3ece1' : '#23262b',
        '--home-ink-note':
          theme.palette.mode === 'dark' ? '#e8a38b' : '#a84a32',
        '--home-pipe':
          theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.22)' : '#c9c2b8',
        bgcolor:
          theme.palette.mode === 'dark' ? 'background.default' : '#fbf8f3',
        px: { xs: 2, sm: 4, md: 5 },
        pt: { xs: 2.25, md: 3 },
        pb: { xs: 3, md: 4.5 },
        minHeight: 'calc(100svh - 148px)'
      })}
    >
      <Helmet>
        <title>{t('hero.brand')}</title>
        <meta name="description" content={t('hero.description')} />
      </Helmet>
      <Box sx={{ width: '100%', maxWidth: 1120, mx: 'auto' }}>
        <Hero />
        <Box sx={{ mt: { xs: 2.25, md: 2.75 } }}>
          <Categories />
        </Box>
      </Box>
    </Box>
  );
}
