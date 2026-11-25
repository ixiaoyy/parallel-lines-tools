import { Box, Button, Stack, Typography } from '@mui/material';
import {
  catalogTools,
  filterToolsByFormat,
  getToolsByCategory
} from '@tools/index';
import { Link } from 'react-router-dom';
import { Icon, type IconifyIcon } from '@iconify/react';
import { Fragment, useState } from 'react';
import { useTranslation } from 'react-i18next';
import UserTypeFilter from '@components/UserTypeFilter';
import { useUserTypeFilter } from '../../providers/UserTypeFilterProvider';
import { useToolFormatFilter } from '../../hooks/useToolFormatFilter';

const preferred = [
  'ai-creative',
  'image-generic',
  'office',
  'pdf',
  'string',
  'network'
];

const order = (type: string) => {
  const index = preferred.indexOf(type);
  return index === -1 ? preferred.length : index;
};

function CategoryIcon({
  type,
  fallback
}: {
  type: string;
  fallback: string | IconifyIcon;
}) {
  if (type === 'ai-creative') {
    return (
      <svg
        aria-hidden="true"
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
      >
        <circle cx="12" cy="5.5" r="2" stroke="#3d9be0" strokeWidth="1.9" />
        <path
          d="M11 7.5L6.5 19M13 7.5L17.5 19M7.2 14.5H16.8"
          stroke="#3d9be0"
          strokeWidth="1.9"
          strokeLinecap="round"
        />
      </svg>
    );
  }
  if (type === 'image-generic') {
    return (
      <svg
        aria-hidden="true"
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
      >
        <rect
          x="3"
          y="4.5"
          width="18"
          height="15"
          rx="2.5"
          stroke="#e3ae2c"
          strokeWidth="2"
        />
        <circle cx="8.5" cy="9.5" r="1.5" fill="#e3ae2c" />
        <path
          d="M4.5 17L9.5 12.2L13 15.5L15.8 12.8L19.5 17"
          stroke="#e3ae2c"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }
  if (type === 'office') {
    return (
      <svg
        aria-hidden="true"
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
      >
        <rect x="3" y="4" width="18" height="16" rx="3" fill="#69a944" />
        <path
          d="M8.5 15.5V12M12 15.5V8.5M15.5 15.5V10.5"
          stroke="#ffffff"
          strokeWidth="2.1"
          strokeLinecap="round"
        />
      </svg>
    );
  }
  if (type === 'pdf') {
    return (
      <Box
        component="span"
        aria-hidden="true"
        sx={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 12,
          fontWeight: 800,
          letterSpacing: '-0.02em',
          color: '#a24fa8',
          lineHeight: 1
        }}
      >
        PDF
      </Box>
    );
  }
  if (type === 'string') {
    return (
      <svg
        aria-hidden="true"
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
      >
        <path
          d="M5.5 6.5H18.5M12 6.5V18.5M9 18.5H15"
          stroke="#67a542"
          strokeWidth="2.1"
          strokeLinecap="round"
        />
      </svg>
    );
  }
  if (type === 'network') {
    return (
      <svg
        aria-hidden="true"
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
      >
        <rect x="3.5" y="4.5" width="17" height="11.5" rx="2" fill="#b4784a" />
        <path
          d="M8.5 19.5H15.5M12 16V19.5"
          stroke="#b4784a"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    );
  }
  return (
    <Icon aria-hidden="true" icon={fallback} fontSize={20} color="#6d7680" />
  );
}

/** 首页只露出参考稿中的分类行；展开标题后仍可查看全部分类和使用原人群筛选。 */
export default function Categories() {
  const { selectedUserTypes, setSelectedUserTypes } = useUserTypeFilter();
  const { t } = useTranslation();
  const { format } = useToolFormatFilter();
  const [expanded, setExpanded] = useState(false);
  const categories = getToolsByCategory(
    selectedUserTypes,
    t,
    filterToolsByFormat(catalogTools, format)
  ).sort((a, b) => order(a.type) - order(b.type));
  const firstRow = categories.filter(({ type }) => preferred.includes(type));
  const visible = expanded
    ? categories
    : firstRow.length
      ? firstRow
      : categories.slice(0, preferred.length);

  return (
    <Box component="section">
      <Typography component="h2" sx={{ m: 0, mb: 0.5 }}>
        <Button
          color="inherit"
          onClick={() => setExpanded(!expanded)}
          aria-expanded={expanded}
          aria-controls="home-category-index"
          sx={{
            minHeight: 34,
            minWidth: 0,
            p: 0,
            fontSize: { xs: 16, md: 17.5 },
            fontWeight: 700,
            lineHeight: 1.4,
            color: 'var(--home-ink)',
            '&:hover': {
              bgcolor: 'transparent',
              textDecoration: 'underline'
            }
          }}
        >
          {t('hero.categoriesTitle')}
        </Button>
      </Typography>
      {expanded && (
        <Stack direction="row" sx={{ mt: 0.75, mb: 1 }}>
          <UserTypeFilter
            selectedUserTypes={selectedUserTypes}
            onUserTypesChange={setSelectedUserTypes}
          />
        </Stack>
      )}
      <Box
        id="home-category-index"
        component="nav"
        aria-label={t('hero.categoriesTitle')}
        sx={{
          display: 'flex',
          alignItems: 'center',
          flexWrap: 'wrap',
          rowGap: 0.5
        }}
      >
        {visible.map((category, index) => (
          <Fragment key={category.type}>
            {index > 0 && (
              <Box
                aria-hidden="true"
                sx={{
                  display: { xs: 'none', md: 'block' },
                  width: '1px',
                  height: 15,
                  bgcolor: 'var(--home-pipe)',
                  mx: { md: 2.25, lg: 3 }
                }}
              />
            )}
            <Box
              component={Link}
              to={
                '/categories/' +
                category.type +
                (format === 'all' ? '' : '?format=' + format)
              }
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                minHeight: 38,
                gap: 0.9,
                pr: { xs: 2.5, md: 0 },
                textDecoration: 'none',
                color: 'var(--home-ink)',
                fontWeight: 500,
                fontSize: { xs: 14.5, md: 15.5 },
                '&:hover': {
                  color: 'primary.main',
                  textDecoration: 'underline'
                }
              }}
            >
              <CategoryIcon type={category.type} fallback={category.icon} />
              {category.rawTitle}
            </Box>
          </Fragment>
        ))}
      </Box>
      {!categories.length && (
        <Typography role="status" color="text.secondary" sx={{ mt: 1 }}>
          {t('catalog.noMatchingCategories')}
        </Typography>
      )}
    </Box>
  );
}
