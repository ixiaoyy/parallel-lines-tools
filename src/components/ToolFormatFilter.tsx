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
export default function ToolFormatFilter() {
  const { t } = useTranslation('translation');
  const { format, setFormat } = useToolFormatFilter();
  return (
    <Box
      role="group"
      aria-label={t('catalog.formatLabel')}
      sx={{
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: 1,
        my: 2
      }}
    >
      {formats.map((value) => (
        <Button
          key={value}
          variant={value === format ? 'contained' : 'outlined'}
          aria-pressed={value === format}
          onClick={() => setFormat(value)}
          sx={{ minHeight: 44, borderRadius: 2 }}
        >
          {t(`catalog.formats.${value}`)}
        </Button>
      ))}
    </Box>
  );
}
