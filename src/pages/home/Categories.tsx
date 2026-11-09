import { getToolsByCategory } from '@tools/index';
import Grid from '@mui/material/Grid';
import { Card, CardContent, Stack, Typography } from '@mui/material';
import { Link } from 'react-router-dom';
import { categoriesColors } from 'config/uiConfig';
import { Icon } from '@iconify/react';
import { useTranslation } from 'react-i18next';
import { useUserTypeFilter } from '../../providers/UserTypeFilterProvider';

/** 分类保留一个清晰入口，不再重复堆叠两套操作按钮。 */
export default function Categories() {
  const { selectedUserTypes } = useUserTypeFilter();
  const { t } = useTranslation();
  const categories = getToolsByCategory(selectedUserTypes, t);
  return (
    <Grid container spacing={2}>
      {categories.map((category, index) => (
        <Grid item xs={12} sm={6} md={4} key={category.type}>
          <Card
            component={Link}
            to={'/categories/' + category.type}
            aria-label={category.rawTitle}
            variant="outlined"
            sx={{
              display: 'block',
              height: '100%',
              textDecoration: 'none',
              color: 'text.primary',
              borderRadius: 2,
              '&:hover': {
                borderColor: 'primary.main',
                bgcolor: 'background.hover'
              },
              '&:focus-visible': {
                outline: '2px solid',
                outlineColor: 'primary.main',
                outlineOffset: 3
              }
            }}
          >
            <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
              <Stack direction="row" alignItems="center" spacing={1.5}>
                <Icon
                  icon={category.icon}
                  fontSize={30}
                  color={categoriesColors[index % categoriesColors.length]}
                />
                <Typography
                  component="h3"
                  fontSize={17}
                  fontWeight={700}
                  sx={{ flex: 1 }}
                >
                  {category.rawTitle}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {category.tools.length}
                </Typography>
              </Stack>
              <Typography
                color="text.secondary"
                fontSize={14}
                sx={{
                  mt: 1.5,
                  lineHeight: 1.7,
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden'
                }}
              >
                {category.description}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
}
