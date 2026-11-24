import {
  Autocomplete,
  Box,
  darken,
  lighten,
  Stack,
  styled,
  TextField,
  Button,
  useTheme
} from '@mui/material';
import Typography from '@mui/material/Typography';
import SearchIcon from '@mui/icons-material/Search';
import Grid from '@mui/material/Grid';
import { useEffect, useMemo, useState } from 'react';
import {
  catalogTools,
  filterTools,
  filterToolsByFormat,
  tools
} from '@tools/index';
import { Link, useNavigate } from 'react-router-dom';
import { Icon } from '@iconify/react';
import { getToolCategoryTitle } from '@utils/string';
import { useTranslation } from 'react-i18next';
import { FullI18nKey, validNamespaces, type I18nNamespaces } from '../i18n';
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

type ToolInfo = {
  definition: DefinedTool;
  label: FullI18nKey;
  url: string;
  external?: boolean;
  bookmarkPath?: string;
};

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

  const defaultEntries: { path: string; label: FullI18nKey }[] = [
    {
      path: 'office/excel-formulas',
      label: 'translation:mainSiteTools.excel.title'
    },
    {
      path: 'image-generic/bead-pattern',
      label: 'translation:mainSiteTools.bead.title'
    },
    {
      path: 'converters/markdown-to-docx',
      label: 'translation:hero.examples.markdownToDocx'
    },
    {
      path: 'image-generic/compress',
      label: 'translation:hero.examples.compressImage'
    },
    { path: 'pdf/split-pdf', label: 'translation:hero.examples.splitPdf' },
    { path: 'json/prettify', label: 'translation:hero.examples.prettifyJson' }
  ];
  // 六个常用入口之外仍可搜索/分类访问；收藏保持完整，不按展示数量截断。
  const exampleTools: ToolInfo[] = defaultEntries.flatMap(({ path, label }) => {
    const tool = tools.find((item) => item.path === path);
    return tool
      ? [
          {
            definition: tool,
            label,
            url: getToolHref(tool),
            external: !!tool.externalUrl,
            bookmarkPath: tool.path
          }
        ]
      : [];
  });

  const toolsMap = new Map<string, ToolInfo>();
  // 收藏按原稳定 ID 从完整库存查找；目录合并不能让用户已有收藏消失。
  const bookmarkedTools =
    inputValue && !searchReady
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
  for (const tool of bookmarkedTools) {
    toolsMap.set(tool.path, {
      definition: tool,
      label: tool.name,
      url: getToolHref(tool),
      external: !!tool.externalUrl,
      bookmarkPath: tool.path
    });
  }

  // 安装型精选沿用当前筛选结果；存在收藏时只展示原收藏，不自动混入推荐条目。
  const displayedTools =
    bookmarkedToolPaths.length > 0
      ? bookmarkedToolPaths.flatMap((path) => {
          const tool = toolsMap.get(path);
          if (tool === undefined) {
            return [];
          }
          return [tool];
        })
      : // 暂缓开放的工具不应留在首页快捷入口中；收藏记录本身保持不变。
        format === 'desktop' || format === 'extension'
        ? filteredTools.slice(0, 6).map((tool) => ({
            definition: tool,
            label: tool.name,
            url: getToolHref(tool),
            external: !!tool.externalUrl,
            bookmarkPath: tool.path
          }))
        : exampleTools.filter((example) =>
            filterToolsByFormat(tools, format).some(
              (tool) => getToolHref(tool) === example.url
            )
          );

  return (
    <Box width="100%">
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

      <Autocomplete
        sx={{ mb: 2, maxWidth: 760, mx: 'auto' }}
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
              endAdornment: <SearchIcon />,
              sx: {
                borderRadius: 2,
                backgroundColor: 'background.paper'
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
      {showShortcuts && (
        <Box component="section" sx={{ mt: 3 }}>
          <Typography
            component="h2"
            fontSize={19}
            fontWeight={700}
            sx={{ mb: 1.5 }}
          >
            {t(
              bookmarkedToolPaths.length
                ? 'hero.bookmarksTitle'
                : format === 'desktop' || format === 'extension'
                  ? 'catalog.curatedTitle'
                  : 'hero.commonTitle'
            )}
          </Typography>
          {!!bookmarkedToolPaths.length &&
            bookmarksReady &&
            displayedTools.length === 0 && (
              <Typography role="status" color="text.secondary" sx={{ mb: 2 }}>
                {t('translation:catalog.noMatchingBookmarks')}
              </Typography>
            )}
          {!!bookmarkedToolPaths.length && !bookmarksReady && (
            <Typography color="text.secondary" fontSize={14}>
              {t(
                bookmarksFailed
                  ? 'hero.search.loadFailed'
                  : 'hero.search.loading'
              )}
            </Typography>
          )}
          <Grid container spacing={1.5}>
            {(bookmarkedToolPaths.length && !bookmarksReady
              ? []
              : displayedTools
            ).map((tool) => (
              <Grid
                item
                xs={
                  tool.definition.formats || bookmarkedToolPaths.length ? 12 : 6
                }
                md={
                  tool.definition.formats || bookmarkedToolPaths.length ? 6 : 4
                }
                key={tool.definition.path}
              >
                {tool.definition.formats || bookmarkedToolPaths.length ? (
                  <CatalogToolCard
                    tool={tool.definition}
                    onRemoveBookmark={
                      bookmarkedToolPaths.length
                        ? () => {
                            toggleBookmarked(tool.bookmarkPath!);
                            setBookmarkedToolPaths(getBookmarkedToolPaths());
                          }
                        : undefined
                    }
                  />
                ) : (
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      borderWidth: 1,
                      padding: 1,
                      borderRadius: 2,
                      borderColor: 'divider',
                      borderStyle: 'solid',
                      backgroundColor: 'background.paper',
                      cursor: 'pointer',
                      '&:hover': {
                        backgroundColor: 'background.hover'
                      },
                      height: '100%'
                    }}
                  >
                    <Stack direction={'row'} spacing={1} alignItems={'center'}>
                      <Button
                        {...(tool.external
                          ? {
                              component: 'a' as const,
                              href: tool.url,
                              target: '_blank',
                              rel: 'noopener noreferrer'
                            }
                          : {
                              component: Link,
                              to: tool.url.startsWith('/')
                                ? tool.url
                                : `/${tool.url}`
                            })}
                        color="inherit"
                        sx={{
                          minHeight: 48,
                          flex: 1,
                          fontWeight: 500,
                          lineHeight: 1.5
                        }}
                      >
                        {t(tool.label)}
                      </Button>
                    </Stack>
                  </Box>
                )}
              </Grid>
            ))}
          </Grid>
        </Box>
      )}
    </Box>
  );
}
