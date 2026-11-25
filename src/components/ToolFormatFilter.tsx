import { Box, Button } from '@mui/material';
import { useTranslation } from 'react-i18next';
import {
  useToolFormatFilter,
  type ToolFormatFilterValue
} from '../hooks/useToolFormatFilter';

const formats: ToolFormatFilterValue[] = [
  'all',
  'online',
  'desktop',
  'extension'
];

/** 形式筛选不替代用途分类；按钮可用键盘操作，选中状态同时提供给读屏。 */
export default function ToolFormatFilter({
  editorial = false
}: {
  editorial?: boolean;
}) {
  const { t } = useTranslation('translation');
  const { format, setFormat } = useToolFormatFilter();
  return (
    <Box
      role="group"
      aria-label={t('catalog.formatLabel')}
      sx={{
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: editorial ? 'flex-start' : 'center',
        gap: editorial ? { xs: 1.25, sm: 3, md: 4.25 } : 1,
        mt: editorial ? 1.75 : 2,
        mb: editorial ? 2.25 : 2
      }}
    >
      {formats.map((value) => {
        const active = value === format;
        return (
          <Button
            key={value}
            variant={editorial ? 'text' : active ? 'contained' : 'outlined'}
            aria-pressed={active}
            onClick={() => setFormat(value)}
            sx={
              editorial
                ? {
                    position: 'relative',
                    minHeight: 40,
                    minWidth: 0,
                    px: { xs: 0.75, md: 1.25 },
                    pb: 0.85,
                    fontSize: { xs: 15, md: 16.5 },
                    borderRadius: 0,
                    color: active ? 'primary.main' : 'var(--home-ink)',
                    fontWeight: active ? 700 : 500,
                    '&:hover': {
                      bgcolor: 'transparent',
                      color: 'primary.main'
                    },
                    '&::after': active
                      ? {
                          content: '""',
                          position: 'absolute',
                          left: 0,
                          right: 0,
                          bottom: 0,
                          height: '2.5px',
                          borderRadius: '2px',
                          bgcolor: 'primary.main'
                        }
                      : undefined
                  }
                : { minHeight: 44, borderRadius: 2 }
            }
          >
            {t(`catalog.formats.${value}`)}
          </Button>
        );
      })}
    </Box>
  );
}
