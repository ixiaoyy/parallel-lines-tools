import { Box, Button, Stack, Typography } from '@mui/material';
import KeyboardArrowDownRoundedIcon from '@mui/icons-material/KeyboardArrowDownRounded';
import {
  catalogTools,
  filterToolsByFormat,
  getToolsByCategory
} from '@tools/index';
import { Link } from 'react-router-dom';
import { Icon, type IconifyIcon } from '@iconify/react';
import { useState } from 'react';
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

/** 按当前形式和人群显示分类与项目数；默认保留简短索引，可展开全部。 */
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
  const canExpand = categories.length > preferred.length;
  // 形式筛选后，常用分类不足六项时用该形式下的其他分类补足。
  const visible = expanded ? categories : categories.slice(0, preferred.length);

  return (
    <Box
      component="section"
      aria-labelledby="home-category-heading"
      sx={{ mt: { xs: 2.25, md: 2.75 } }}
    >
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        flexWrap="wrap"
        useFlexGap
        sx={{ gap: 1, mb: 0.75 }}
      >
        <Typography
          id="home-category-heading"
          component="h2"
          fontWeight={700}
          fontSize={{ xs: 16, md: 17.5 }}
          color="var(--home-ink)"
        >
          {t('catalog.browseByPurpose')}
        </Typography>
        {(canExpand || expanded) && (
          <Button
            variant="outlined"
            size="small"
            endIcon={
              <KeyboardArrowDownRoundedIcon
                sx={{ transform: expanded ? 'rotate(180deg)' : undefined }}
              />
            }
            onClick={() => setExpanded((open) => !open)}
            aria-expanded={expanded}
            aria-controls="home-category-index"
            sx={{ minHeight: 44, px: 1.5, fontWeight: 700 }}
          >
            {expanded
              ? t('catalog.collapseCategories')
              : t('catalog.viewAllCategories', { count: categories.length })}
          </Button>
        )}
      </Stack>
      {(expanded || !canExpand) && (
        <Stack direction="row" sx={{ mb: 1 }}>
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
          display: 'grid',
          gridTemplateColumns: {
            xs: 'repeat(2, minmax(0, 1fr))',
            sm: 'repeat(3, minmax(0, 1fr))',
            lg: 'repeat(6, minmax(0, 1fr))'
          },
          columnGap: { xs: 1.75, md: 2.5 },
          rowGap: 0.25
        }}
      >
        {visible.map((category) => (
          <Box
            key={category.type}
            component={Link}
            to={
              '/categories/' +
              category.type +
              (format === 'all' ? '' : '?format=' + format)
            }
            sx={{
              display: 'grid',
              gridTemplateColumns: '20px minmax(0, 1fr) auto',
              alignItems: 'center',
              minHeight: 44,
              gap: 0.85,
              py: 0.5,
              borderBottom: '1px solid',
              borderColor: 'divider',
              color: 'var(--home-ink)',
              textDecoration: 'none',
              fontSize: { xs: 14, md: 15 },
              fontWeight: 500,
              '&:hover, &:focus-visible': {
                color: 'primary.main',
                borderColor: 'primary.main'
              },
              '&:focus-visible': { outline: '2px solid currentColor' }
            }}
          >
            <CategoryIcon type={category.type} fallback={category.icon} />
            <Box component="span" sx={{ overflowWrap: 'anywhere' }}>
              {category.rawTitle}
            </Box>
            <Box
              component="span"
              sx={{
                fontSize: 12,
                fontVariantNumeric: 'tabular-nums',
                color: 'text.secondary',
                pr: 0.25
              }}
            >
              {category.tools.length}
            </Box>
          </Box>
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
