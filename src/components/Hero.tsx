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
import { useMemo, useState } from 'react';
import { filterTools, tools } from '@tools/index';
import { Link, useNavigate } from 'react-router-dom';
import { Icon } from '@iconify/react';
import { getToolCategoryTitle } from '@utils/string';
import { useTranslation } from 'react-i18next';
import { FullI18nKey, validNamespaces } from '../i18n';
import {
  getBookmarkedToolPaths,
  isBookmarked,
  toggleBookmarked
} from '@utils/bookmark';
import IconButton from '@mui/material/IconButton';
import { useUserTypeFilter } from '../providers/UserTypeFilterProvider';
import { getToolHref, openTool } from '@tools/defineTool';
import { mainSiteTools } from '@tools/mainSiteTools';

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
  label: FullI18nKey;
  url: string;
  external?: boolean;
  bookmarkPath?: string;
};

export default function Hero() {
  const { t } = useTranslation(validNamespaces);
  const [inputValue, setInputValue] = useState<string>('');
  const theme = useTheme();
  const { selectedUserTypes } = useUserTypeFilter();
  // 搜索结果随语言和用户类型同步计算，切换语言后不沿用旧语言的匹配结果。
  const filteredTools = useMemo(
    () => filterTools(tools, inputValue, selectedUserTypes, t),
    [inputValue, selectedUserTypes, t]
  );
  const [bookmarkedToolPaths, setBookmarkedToolPaths] = useState<string[]>(
    getBookmarkedToolPaths()
  );
  const navigate = useNavigate();

  const exampleTools: ToolInfo[] = [
    ...mainSiteTools.map((tool) => ({
      label: tool.name,
      url: getToolHref(tool),
      external: true
    })),
    {
      label: 'translation:hero.examples.markdownToDocx',
      url: '/converters/markdown-to-docx'
    },
    {
      label: 'translation:hero.examples.compressImage',
      url: '/image-generic/compress'
    },
    {
      label: 'translation:hero.examples.createTransparentImage',
      url: '/image-generic/create-transparent'
    },
    {
      label: 'translation:hero.examples.prettifyJson',
      url: '/json/prettify'
    },
    {
      label: 'translation:hero.examples.changeGifSpeed',
      url: '/gif/change-speed'
    },
    {
      label: 'translation:hero.examples.sortList',
      url: '/list/sort'
    },
    {
      label: 'translation:hero.examples.compressPng',
      url: '/png/compress-png'
    },
    {
      label: 'translation:hero.examples.splitText',
      url: '/string/split'
    },
    {
      label: 'translation:hero.examples.splitPdf',
      url: '/pdf/split-pdf'
    },
    {
      label: 'translation:hero.examples.trimVideo',
      url: '/video/trim'
    },
    {
      label: 'translation:hero.examples.calculateNumberSum',
      url: '/number/sum'
    }
  ];

  const toolsMap = new Map<string, ToolInfo>();
  for (const tool of filteredTools) {
    toolsMap.set(tool.path, {
      label: tool.name,
      url: getToolHref(tool),
      external: !!tool.externalUrl,
      bookmarkPath: tool.path
    });
  }

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
        exampleTools.filter((example) =>
          tools.some((tool) => getToolHref(tool) === example.url)
        );

  return (
    <Box width={{ xs: '90%', md: '80%', lg: '60%' }}>
      <Stack mb={1} direction={'row'} spacing={1} justifyContent={'center'}>
        <Typography
          component="h1"
          sx={{ textAlign: 'center' }}
          fontSize={{ xs: 25, md: 30 }}
        >
          {t('translation:hero.title')}{' '}
          <Typography
            fontSize={{ xs: 25, md: 30 }}
            display={'inline'}
            color={'primary'}
          >
            {t('translation:hero.brand')}
          </Typography>
        </Typography>
      </Stack>
      <Typography
        sx={{ textAlign: 'center' }}
        fontSize={{ xs: 15, md: 20 }}
        mb={2}
      >
        {t('translation:hero.description')}
      </Typography>

      <Autocomplete
        sx={{ mb: 2 }}
        autoHighlight
        options={filteredTools}
        noOptionsText={t('translation:hero.search.noResult')}
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
                borderRadius: 4,
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
      <Grid container spacing={2} mt={2}>
        {displayedTools.map((tool) => (
          <Grid item xs={12} md={6} lg={4} key={tool.label}>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                borderWidth: 1,
                padding: 1,
                borderRadius: 3,
                borderColor: theme.palette.mode === 'dark' ? '#363b41' : 'grey',
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
                        to: tool.url.startsWith('/') ? tool.url : `/${tool.url}`
                      })}
                  color="inherit"
                  sx={{ minHeight: 44, flex: 1, fontWeight: 400 }}
                >
                  {t(tool.label)}
                </Button>
                {bookmarkedToolPaths.length > 0 && (
                  <IconButton
                    aria-label={t('translation:hero.removeBookmark', {
                      title: t(tool.label)
                    })}
                    onClick={(e) => {
                      e.stopPropagation();
                      // 收藏快捷项均来自 toolsMap，使用原稳定 ID，不从外链 URL 反推。
                      const path = tool.bookmarkPath!;
                      toggleBookmarked(path);
                      setBookmarkedToolPaths(getBookmarkedToolPaths());
                    }}
                    size={'small'}
                  >
                    <Icon
                      icon={'mdi:close'}
                      color={theme.palette.grey[500]}
                      fontSize={15}
                    />
                  </IconButton>
                )}
              </Stack>
            </Box>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
