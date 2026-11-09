import { Box, Stack, Typography } from '@mui/material';
import Hero from 'components/Hero';
import { lazy, Suspense, useEffect, useRef, useState } from 'react';
const Categories = lazy(() => import('./Categories'));
import { Helmet } from 'react-helmet';
import { useUserTypeFilter } from 'providers/UserTypeFilterProvider';
import UserTypeFilter from '@components/UserTypeFilter';
import { useTranslation } from 'react-i18next';

export default function Home() {
  const { t } = useTranslation();
  const categorySentinel = useRef<HTMLDivElement>(null);
  const [showCategories, setShowCategories] = useState(false);
  useEffect(() => {
    const target = categorySentinel.current;
    if (!target) return;
    // 下方分类接近可视区后才挂载；工具页面仍由各自路由按需加载。
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShowCategories(true);
          observer.disconnect();
        }
      },
      { rootMargin: '180px' }
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, []);
  const { selectedUserTypes, setSelectedUserTypes } = useUserTypeFilter();
  return (
    <Box
      component="main"
      sx={{
        bgcolor: 'background.default',
        px: { xs: 2, md: 3 },
        py: { xs: 3, md: 4 }
      }}
    >
      <Helmet>
        <title>{t('hero.brand')}</title>
        <meta name="description" content={t('hero.description')} />
      </Helmet>
      <Box sx={{ width: '100%', maxWidth: 1180, mx: 'auto' }}>
        <Hero />
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          sx={{ mt: 4, mb: 2, gap: 2, flexWrap: 'wrap' }}
        >
          <Typography component="h2" fontSize={19} fontWeight={700}>
            {t('hero.categoriesTitle')}
          </Typography>
          <UserTypeFilter
            selectedUserTypes={selectedUserTypes}
            onUserTypesChange={setSelectedUserTypes}
          />
        </Stack>
        <Box ref={categorySentinel} sx={{ minHeight: 120 }}>
          {showCategories && (
            <Suspense fallback={null}>
              <Categories />
            </Suspense>
          )}
        </Box>
      </Box>
    </Box>
  );
}
