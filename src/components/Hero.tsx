import {
  Autocomplete,
  Box,
  darken,
  lighten,
  Stack,
  styled,
  TextField,
  useTheme
} from '@mui/material';
import Typography from '@mui/material/Typography';
import SearchIcon from '@mui/icons-material/Search';
import Grid from '@mui/material/Grid';
import { Fragment, useEffect, useMemo, useState } from 'react';
import {
  catalogTools,
  filterTools,
  filterToolsByFormat,
  filterToolsByUserTypes,
  tools
} from '@tools/index';
import { Link, useNavigate } from 'react-router-dom';
import { Icon } from '@iconify/react';
import { getToolCategoryTitle } from '@utils/string';
import { useTranslation } from 'react-i18next';
import { validNamespaces, type I18nNamespaces } from '../i18n';
import type { TFunction } from 'i18next';
import {
  getBookmarkedToolPaths,
  isBookmarked,
  toggleBookmarked
} from '@utils/bookmark';
import IconButton from '@mui/material/IconButton';
import { useUserTypeFilter } from '../providers/UserTypeFilterProvider';
import {
  getToolHref,
  getToolActionKey,
  openTool,
  type DefinedTool
} from '@tools/defineTool';
import { useToolFormatFilter } from '../hooks/useToolFormatFilter';
import ToolFormatFilter from './ToolFormatFilter';
import ToolCatalogMeta from './ToolCatalogMeta';
import CatalogToolCard from './CatalogToolCard';
import WorkbenchPreview from './WorkbenchPreview';
import { getCreativeHighlights } from '@tools/homeDiscovery';

const GroupHeader = styled('div')(({ theme }) => ({
  position: 'sticky',
  top: '-8px',
  padding: '4px 10px',
  color: theme.palette.primary.main,
  backgroundColor: lighten(theme.palette.primary.light, 0.85),
  ...theme.applyStyles('dark', {
    backgroundColor: darken(theme.palette.primary.main, 0.8)
  })
}));

const GroupItems = styled('ul')({
  padding: 0
});

function CreativeToolIcon({ tool }: { tool: DefinedTool }) {
  if (tool.path === 'ai-creative/jimeng') {
    return (
      <svg
        aria-hidden="true"
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
      >
        <path
          d="M6.5 4.8L19.5 12L6.5 19.2V4.8Z"
          stroke="#2575d6"
          strokeWidth="2.1"
          strokeLinejoin="round"
        />
        <path
          d="M6.5 9.2L12.5 12L6.5 14.8"
          stroke="#2575d6"
          strokeWidth="1.9"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }
  if (tool.path === 'ai-creative/kling') {
    return (
      <svg
        aria-hidden="true"
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
      >
        <path
          d="M12 4C7.8 4 4.5 7.1 4.5 11.2C4.5 13.8 6 16.1 8.4 17.3"
          stroke="#2575d6"
          strokeWidth="2.1"
          strokeLinecap="round"
        />
        <path
          d="M12 20C16.2 20 19.5 16.9 19.5 12.8C19.5 10.2 18 7.9 15.6 6.7"
          stroke="#2575d6"
          strokeWidth="2.1"
          strokeLinecap="round"
        />
        <path
          d="M8.5 11.5C8.5 9.6 10.1 8 12 8C13.9 8 15.5 9.6 15.5 11.5C15.5 13.4 13.9 15 12 15"
          stroke="#4c9be8"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </svg>
    );
  }
  if (tool.path === 'ai-creative/haimian-music') {
    return (
      <svg
        aria-hidden="true"
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
      >
        <path
          d="M9 17.5V6.5L18.5 4.8V15.5"
          stroke="#985bc7"
          strokeWidth="2.1"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="6.8" cy="17.5" r="2.3" stroke="#985bc7" strokeWidth="2" />
        <circle cx="16.3" cy="15.7" r="2.3" stroke="#985bc7" strokeWidth="2" />
      </svg>
    );
  }
  if (tool.path === 'image-generic/photopea') {
    return (
      <svg
        aria-hidden="true"
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
      >
        <rect x="3" y="3" width="18" height="18" rx="4.5" fill="#2aa89c" />
        <path
          d="M9.5 16.5V8.5H12.8C14.6 8.5 15.7 9.5 15.7 11.1C15.7 12.7 14.6 13.7 12.8 13.7H11"
          stroke="#ffffff"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }
  return (
    <Icon
      aria-hidden="true"
      icon={tool.icon}
      fontSize={20}
      color="#2575d6"
    />
  );
}

export default function Hero({
  showShortcuts = true
}: {
  showShortcuts?: boolean;
}) {
  const { t: globalText, i18n } = useTranslation('translation');
  // 加载只订阅全局 UI，查询仍允许已按需取得的显式命名空间 key。
  const t = globalText as unknown as TFunction<I18nNamespaces[]>;
  const [inputValue, setInputValue] = useState<string>('');
  const [searchReady, setSearchReady] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchFailed, setSearchFailed] = useState(false);
  const [searchRequest, setSearchRequest] = useState(0);
  const [bookmarksReady, setBookmarksReady] = useState(false);
  const [bookmarksFailed, setBookmarksFailed] = useState(false);

  // 完整目录译文仅在打开搜索时加载，切换语言后也不沿用旧请求结果。
  const loadSearch = () => {
    if (!searchReady && !searchLoading) setSearchRequest((value) => value + 1);
  };
  useEffect(() => {
    let active = true;
    setSearchReady(false);
    if (!searchRequest) return;
    setSearchLoading(true);
    setSearchFailed(false);
    i18n.loadNamespaces([...validNamespaces], (errors) => {
      if (!active) return;
      setSearchLoading(false);
      setSearchReady(!errors);
      setSearchFailed(!!errors);
    });
    return () => {
      active = false;
    };
  }, [searchRequest, i18n, i18n.resolvedLanguage]);

  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const { selectedUserTypes } = useUserTypeFilter();
  const { format } = useToolFormatFilter();

  // 搜索结果同时遵守语言、人群和使用形式；不让安装型条目混进在线筛选。
  const filteredTools = useMemo(
    () =>
      inputValue && !searchReady
        ? []
        : filterTools(
            filterToolsByFormat(catalogTools, format),
            inputValue,
            selectedUserTypes,
            t
          ),
    [inputValue, selectedUserTypes, t, searchReady, format]
  );
  const [bookmarkedToolPaths, setBookmarkedToolPaths] = useState<string[]>(
    getBookmarkedToolPaths()
  );

  // 已有收藏只取它实际需要的命名空间，不为其余工具预载界面。
  useEffect(() => {
    let active = true;
    const selected = tools.filter((tool) =>
      bookmarkedToolPaths.includes(tool.path)
    );
    const namespaces = [
      ...new Set(
        selected.flatMap((tool) =>
          [tool.name, tool.description, tool.shortDescription].map(
            (key) => key.split(':')[0]
          )
        )
      )
    ];
    setBookmarksReady(namespaces.length === 0);
    setBookmarksFailed(false);
    if (namespaces.length)
      i18n.loadNamespaces(namespaces, (errors) => {
        if (active) {
          setBookmarksReady(!errors);
          setBookmarksFailed(!!errors);
        }
      });
    return () => {
      active = false;
    };
  }, [bookmarkedToolPaths, i18n, i18n.resolvedLanguage]);
  const navigate = useNavigate();

  const hasBookmarks = bookmarkedToolPaths.length > 0;
  const installationFormat = format === 'desktop' || format === 'extension';
  // 旧收藏从完整库存按原 ID 查找，首页精选仍只消费当前公开目录。
  const matchingBookmarks =
    !hasBookmarks || (inputValue && !searchReady)
      ? []
      : filterTools(
          filterToolsByFormat(
            tools.filter((tool) => bookmarkedToolPaths.includes(tool.path)),
            format
          ),
          inputValue,
          selectedUserTypes,
          t
        );
  const displayedTools = hasBookmarks
    ? bookmarkedToolPaths.flatMap((path) => {
        const tool = matchingBookmarks.find((entry) => entry.path === path);
        return tool ? [tool] : [];
      })
    : installationFormat
      ? filteredTools.slice(0, 6)
      : [];
  const shortlist = filterToolsByUserTypes(
    filterToolsByFormat(catalogTools, format),
    selectedUserTypes
  );
  const editorial = showShortcuts && !hasBookmarks && !installationFormat;
  const creative = editorial ? getCreativeHighlights(shortlist) : [];

  const searchControl = (
    <Autocomplete
      sx={
        showShortcuts ? { width: '100%' } : { mb: 2, maxWidth: 760, mx: 'auto' }
      }
      forcePopupIcon={!showShortcuts}
      autoHighlight
      options={searchReady ? filteredTools : []}
      onOpen={loadSearch}
      loading={searchLoading}
      loadingText={t('hero.search.loading')}
      noOptionsText={t(
        searchFailed
          ? 'hero.search.loadFailed'
          : 'translation:hero.search.noResult'
      )}
      // Disable default MUI filtering since we already apply custom filterTools
      filterOptions={(options) => options}
      groupBy={(option) => option.type}
      renderGroup={(params) => {
        return (
          <li key={params.key}>
            <GroupHeader>{getToolCategoryTitle(params.group, t)}</GroupHeader>
            <GroupItems>{params.children}</GroupItems>
          </li>
        );
      }}
      inputValue={inputValue}
      getOptionLabel={(option) => t(option.name)}
      renderInput={(params) => (
        <TextField
          {...params}
          inputProps={{
            ...params.inputProps,
            'aria-label': t('translation:hero.search.placeholder')
          }}
          fullWidth
          placeholder={t('translation:hero.search.placeholder')}
          InputProps={{
            ...params.InputProps,
            endAdornment: (
              <SearchIcon
                sx={
                  showShortcuts
                    ? {
                        mr: 0.75,
                        fontSize: 22,
                        color: isDark ? 'text.secondary' : '#3a3d42'
                      }
                    : undefined
                }
              />
            ),
            sx: {
              borderRadius: showShortcuts ? '10px' : 2,
              backgroundColor: showShortcuts
                ? isDark
                  ? 'rgba(255,255,255,0.03)'
                  : 'rgba(255,255,255,0.58)'
                : 'background.paper',
              ...(showShortcuts
                ? {
                    height: { xs: 46, md: 48 },
                    fontSize: { xs: 15, md: 16 },
                    pr: '12px !important',
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: isDark
                        ? 'rgba(255,255,255,0.18)'
                        : '#d0cac0'
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: isDark
                        ? 'rgba(255,255,255,0.36)'
                        : '#b6afa3'
                    },
                    '& input::placeholder': {
                      color: isDark ? undefined : '#8b867e',
                      opacity: 1
                    }
                  }
                : {})
            }
          }}
          onChange={(event) => setInputValue(event.target.value)}
        />
      )}
      renderOption={(props, option) => (
        <Box
          component="li"
          {...props}
          onClick={() => openTool(option, navigate)}
        >
          <Stack
            direction={'row'}
            alignItems={'center'}
            justifyContent={'space-between'}
            width={'100%'}
          >
            <Stack direction={'row'} spacing={2} alignItems={'center'}>
              <Icon fontSize={20} icon={option.icon} />
              <Box>
                <Typography fontWeight={'bold'}>{t(option.name)}</Typography>
                <Typography fontSize={12}>
                  {t(option.shortDescription)}
                </Typography>
                <ToolCatalogMeta tool={option} compact />
                <Typography variant="caption" color="text.secondary">
                  {t(getToolActionKey(option))}
                </Typography>
              </Box>
            </Stack>
            <IconButton
              aria-label={t(
                isBookmarked(option.path)
                  ? 'translation:toolHeader.unbookmark'
                  : 'translation:toolHeader.bookmark'
              )}
              onClick={(e) => {
                e.stopPropagation();
                toggleBookmarked(option.path);
                setBookmarkedToolPaths(getBookmarkedToolPaths());
              }}
            >
              <Icon
                fontSize={20}
                color={
                  isBookmarked(option.path)
                    ? theme.palette.primary.main
                    : theme.palette.grey[500]
                }
                icon={
                  isBookmarked(option.path)
                    ? 'mdi:bookmark'
                    : 'mdi:bookmark-plus-outline'
                }
              />
            </IconButton>
          </Stack>
        </Box>
      )}
      onChange={(_event, newValue) => {
        if (newValue) {
          openTool(newValue, navigate);
        }
      }}
    />
  );

  return (
    <Box width="100%">
      {showShortcuts ? (
        <>
          <Typography
            component="h1"
            sx={{
              position: 'absolute',
              width: '1px',
              height: '1px',
              p: 0,
              overflow: 'hidden',
              clipPath: 'inset(50%)',
              whiteSpace: 'nowrap'
            }}
          >
            {t('hero.brand')}
          </Typography>
          {searchControl}
          <ToolFormatFilter editorial />
          {editorial && <WorkbenchPreview catalog={shortlist} />}
        </>
      ) : (
        <>
          <Typography
            component="h1"
            sx={{ textAlign: 'center', mb: 1 }}
            fontSize={{ xs: 23, md: 28 }}
          >
            {t('translation:hero.title')}
          </Typography>
          <Typography sx={{ textAlign: 'center' }} fontSize={15} mb={2}>
            {t('translation:hero.description')}
          </Typography>
          <ToolFormatFilter />
          {searchControl}
        </>
      )}

      {creative.length > 0 && (
        <Box
          component="section"
          aria-labelledby="home-creative-title"
          sx={{ mt: { xs: 2.25, md: 2.5 } }}
        >
          <Typography
            id="home-creative-title"
            component="h2"
            sx={{
              fontSize: { xs: 16, md: 17.5 },
              fontWeight: 700,
              color: 'var(--home-ink)',
              mb: 0.75
            }}
          >
            {t('hero.workbench.creative')}
          </Typography>
          <Stack
            direction="row"
            alignItems="center"
            useFlexGap
            flexWrap="wrap"
            rowGap={0.5}
          >
            {creative.map((tool, index) => (
              <Fragment key={tool.path}>
                {index > 0 && (
                  <Box
                    aria-hidden="true"
                    sx={{
                      display: { xs: 'none', sm: 'block' },
                      width: '1px',
                      height: 15,
                      bgcolor: 'var(--home-pipe)',
                      mx: { sm: 2.5, md: 3.5 }
                    }}
                  />
                )}
                <Box
                  {...(tool.externalUrl
                    ? {
                        component: 'a' as const,
                        href: getToolHref(tool),
                        target: '_blank',
                        rel: 'noopener noreferrer'
                      }
                    : { component: Link, to: getToolHref(tool) })}
                  sx={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    minHeight: 38,
                    gap: 1,
                    pr: { xs: 2.5, sm: 0 },
                    color: 'var(--home-ink)',
                    textDecoration: 'none',
                    fontSize: { xs: 14.5, md: 15.5 },
                    fontWeight: 500,
                    '&:hover': {
                      color: 'primary.main',
                      textDecoration: 'underline'
                    }
                  }}
                >
                  <CreativeToolIcon tool={tool} />
                  {t(tool.name)}
                </Box>
              </Fragment>
            ))}
          </Stack>
        </Box>
      )}

      {showShortcuts && (hasBookmarks || installationFormat) && (
        <Box component="section" sx={{ mt: 3 }}>
          <Typography
            component="h2"
            fontSize={19}
            fontWeight={700}
            sx={{ mb: 1.5 }}
          >
            {t(hasBookmarks ? 'hero.bookmarksTitle' : 'catalog.curatedTitle')}
          </Typography>
          {hasBookmarks && bookmarksReady && displayedTools.length === 0 && (
            <Typography role="status" color="text.secondary" sx={{ mb: 2 }}>
              {t('translation:catalog.noMatchingBookmarks')}
            </Typography>
          )}
          {hasBookmarks && !bookmarksReady && (
            <Typography color="text.secondary" fontSize={14}>
              {t(
                bookmarksFailed
                  ? 'hero.search.loadFailed'
                  : 'hero.search.loading'
              )}
            </Typography>
          )}
          <Grid container spacing={1.5}>
            {(hasBookmarks && !bookmarksReady ? [] : displayedTools).map(
              (tool) => (
                <Grid item xs={12} md={6} key={tool.path}>
                  <CatalogToolCard
                    tool={tool}
                    onRemoveBookmark={
                      hasBookmarks
                        ? () => {
                            toggleBookmarked(tool.path);
                            setBookmarkedToolPaths(getBookmarkedToolPaths());
                          }
                        : undefined
                    }
                  />
                </Grid>
              )
            )}
          </Grid>
        </Box>
      )}
    </Box>
  );
}
