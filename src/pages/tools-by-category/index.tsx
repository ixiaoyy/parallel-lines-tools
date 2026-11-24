import {
  Box,
  Grid,
  Stack,
  Typography,
  TextField,
  IconButton
} from '@mui/material';
import {
  filterTools,
  filterToolsByFormat,
  getToolsByCategory
} from '@tools/index';
import Hero from 'components/Hero';
import CatalogToolCard from 'components/CatalogToolCard';
import { getToolCategoryTitle } from '@utils/string';
import React, { useEffect } from 'react';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SearchIcon from '@mui/icons-material/Search';
import { Helmet } from 'react-helmet';
import UserTypeFilter from '@components/UserTypeFilter';
import { useTranslation } from 'react-i18next';
import type { I18nNamespaces } from '../../i18n';
import { useUserTypeFilter } from '../../providers/UserTypeFilterProvider';
import { useToolFormatFilter } from '../../hooks/useToolFormatFilter';
import { useNavigate, useParams } from 'react-router-dom';

export default function ToolsByCategory() {
  const navigate = useNavigate();
  const mainContentRef = React.useRef<HTMLDivElement>(null);
  const { categoryName } = useParams();
  const [searchTerm, setSearchTerm] = React.useState('');
  const { format } = useToolFormatFilter();
  const { selectedUserTypes, setSelectedUserTypes } = useUserTypeFilter();
  const { t: uiText } = useTranslation('translation');
  const toolsByCategory = getToolsByCategory(selectedUserTypes, uiText).find(
    ({ type }) => type === categoryName
  );
  const categoryDefinedTools = toolsByCategory?.tools ?? [];
  // 分类页只取当前用途实际引用的译文；形式筛选不改变用途，也不为整个工具箱预载语言包。
  const namespaces = [
    ...new Set([
      'translation',
      ...categoryDefinedTools.flatMap((tool) =>
        [tool.name, tool.description, tool.shortDescription].map(
          (key) => key.split(':')[0]
        )
      )
    ])
  ] as I18nNamespaces[];
  const { t } = useTranslation(namespaces);
  const rawTitle = getToolCategoryTitle(categoryName as string, t);
  const categoryTools = filterTools(
    filterToolsByFormat(categoryDefinedTools, format),
    searchTerm,
    selectedUserTypes,
    t
  );

  useEffect(() => {
    mainContentRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

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
        <title>{`${rawTitle} · ${t('translation:hero.brand')}`}</title>
        <meta
          name="description"
          content={
            toolsByCategory?.description ?? t('translation:hero.description')
          }
        />
      </Helmet>
      <Box sx={{ maxWidth: 1180, mx: 'auto' }}>
        <Hero showShortcuts={false} />
        <Box ref={mainContentRef} sx={{ mt: 4 }}>
          <Stack
            direction={{ xs: 'column', md: 'row' }}
            justifyContent="space-between"
            spacing={2}
          >
            <Stack direction="row" alignItems="center" spacing={1}>
              <IconButton
                aria-label={t('translation:toolsByCategory.back')}
                onClick={() =>
                  navigate('/' + (format === 'all' ? '' : `?format=${format}`))
                }
              >
                <ArrowBackIcon />
              </IconButton>
              <Typography component="h2" fontSize={22} fontWeight={700}>
                {rawTitle}
              </Typography>
              <Typography color="text.secondary">
                {categoryTools.length}
              </Typography>
            </Stack>
            <TextField
              size="small"
              value={searchTerm}
              placeholder={t('translation:catalog.searchCategory')}
              inputProps={{
                'aria-label': t('translation:catalog.searchCategory')
              }}
              InputProps={{
                endAdornment: <SearchIcon />,
                sx: { bgcolor: 'background.paper', borderRadius: 2 }
              }}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
          </Stack>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', my: 2 }}>
            <UserTypeFilter
              userTypes={toolsByCategory?.userTypes ?? undefined}
              selectedUserTypes={selectedUserTypes}
              onUserTypesChange={setSelectedUserTypes}
            />
          </Box>
          {categoryTools.length === 0 && (
            <Box role="status" sx={{ py: 6, textAlign: 'center' }}>
              <Typography variant="h6">
                {t('translation:toolsByCategory.noResultsTitle')}
              </Typography>
              <Typography color="text.secondary">
                {t('translation:catalog.noResultsDescription')}
              </Typography>
            </Box>
          )}
          <Grid container spacing={2}>
            {categoryTools.map((tool) => (
              <Grid item xs={12} md={6} key={tool.path}>
                <CatalogToolCard tool={tool} />
              </Grid>
            ))}
          </Grid>
        </Box>
      </Box>
    </Box>
  );
}
