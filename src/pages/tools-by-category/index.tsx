import {
  Box,
  Divider,
  Stack,
  styled,
  TextField,
  useTheme
} from '@mui/material';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { filterTools, getToolsByCategory } from '../../tools';
import Hero from 'components/Hero';
import { getToolCategoryTitle } from '@utils/string';
import { Icon } from '@iconify/react';
import { categoriesColors } from 'config/uiConfig';
import React, { useEffect } from 'react';
import IconButton from '@mui/material/IconButton';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SearchIcon from '@mui/icons-material/Search';
import { Helmet } from 'react-helmet';
import UserTypeFilter from '@components/UserTypeFilter';
import { useTranslation } from 'react-i18next';
import { validNamespaces } from '../../i18n';
import { useUserTypeFilter } from '../../providers/UserTypeFilterProvider';
import { getToolHref } from '@tools/defineTool';

const StyledLink = styled(Link)(({ theme }) => ({
  '&:hover': {
    color: theme.palette.mode === 'dark' ? 'white' : theme.palette.primary.light
  }
}));

export default function ToolsByCategory() {
  const navigate = useNavigate();
  const theme = useTheme();
  const mainContentRef = React.useRef<HTMLDivElement>(null);
  const { categoryName } = useParams();
  const [searchTerm, setSearchTerm] = React.useState<string>('');
  const { selectedUserTypes, setSelectedUserTypes } = useUserTypeFilter();
  const { t } = useTranslation(validNamespaces);
  const rawTitle = getToolCategoryTitle(categoryName as string, t);
  // First get tools by category without filtering
  const toolsByCategory = getToolsByCategory(selectedUserTypes, t).find(
    ({ type }) => type === categoryName
  );
  const categoryDefinedTools = toolsByCategory?.tools ?? [];

  const categoryTools = filterTools(
    categoryDefinedTools,
    searchTerm,
    selectedUserTypes,
    t
  );

  useEffect(() => {
    if (mainContentRef.current) {
      mainContentRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, []);

  return (
    <Box sx={{ backgroundColor: 'background.default' }}>
      <Helmet>
        <title>{`${rawTitle} · ${t('translation:hero.brand')}`}</title>
      </Helmet>
      <Box
        padding={{ xs: 1, md: 3, lg: 5 }}
        display={'flex'}
        flexDirection={'column'}
        alignItems={'center'}
        justifyContent={'center'}
        width={'100%'}
      >
        <Hero />
      </Box>
      <Divider sx={{ borderColor: theme.palette.primary.main }} />
      <Box ref={mainContentRef} mt={3} ml={{ xs: 1, md: 2, lg: 3 }} padding={3}>
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          justifyContent={'space-between'}
          spacing={2}
        >
          <Stack direction={'row'} alignItems={'center'} spacing={1}>
            <IconButton
              aria-label={t('translation:toolsByCategory.back')}
              onClick={() => navigate('/')}
            >
              <ArrowBackIcon color={'primary'} />
            </IconButton>
            <Typography fontSize={22} color={theme.palette.primary.main}>
              {t('translation:toolLayout.allToolsTitle', { type: rawTitle })}
            </Typography>
          </Stack>
          <TextField
            placeholder={t('translation:hero.search.placeholder')}
            aria-label={t('translation:hero.search.placeholder')}
            InputProps={{
              endAdornment: <SearchIcon />,
              sx: {
                borderRadius: 4,
                backgroundColor: 'background.paper',
                maxWidth: 400
              }
            }}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
        </Stack>
        <Box
          width={'100%'}
          display={'flex'}
          alignItems={'center'}
          justifyContent={'center'}
          my={2}
        >
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
              {t('translation:toolsByCategory.noResultsDescription')}
            </Typography>
          </Box>
        )}
        <Grid container spacing={2}>
          {categoryTools.map((tool, index) => (
            <Grid item xs={12} md={6} lg={4} key={tool.path}>
              <Stack
                sx={{
                  backgroundColor: 'background.paper',
                  boxShadow: `5px 4px 2px ${
                    theme.palette.mode === 'dark' ? 'black' : '#E9E9ED'
                  }`,
                  cursor: 'pointer',
                  height: '100%',
                  '&:hover': {
                    backgroundColor: theme.palette.background.hover
                  }
                }}
                {...(tool.externalUrl
                  ? {
                      component: 'a' as const,
                      href: getToolHref(tool),
                      target: '_blank',
                      rel: 'noopener noreferrer'
                    }
                  : { onClick: () => navigate('/' + tool.path) })}
                direction={'row'}
                alignItems={'center'}
                spacing={2}
                padding={2}
                border={`1px solid ${theme.palette.background.default}`}
                borderRadius={2}
                color="inherit"
                style={{ textDecoration: 'none' }}
              >
                <Icon
                  icon={tool.icon ?? 'ph:compass-tool-thin'}
                  fontSize={'60px'}
                  color={categoriesColors[index % categoriesColors.length]}
                />
                <Box>
                  {tool.externalUrl ? (
                    <Typography component="span" fontSize={20}>
                      {t(tool.name)}
                    </Typography>
                  ) : (
                    <StyledLink
                      style={{
                        fontSize: 20
                      }}
                      to={'/' + tool.path}
                    >
                      {/*@ts-ignore*/}
                      {t(tool.name)}
                    </StyledLink>
                  )}
                  <Typography sx={{ mt: 2 }}>
                    {/*@ts-ignore*/}
                    {t(tool.shortDescription)}
                  </Typography>
                </Box>
              </Stack>
            </Grid>
          ))}
        </Grid>
      </Box>
    </Box>
  );
}
