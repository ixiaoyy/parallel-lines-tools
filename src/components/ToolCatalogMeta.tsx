import { Box, Chip, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import type { DefinedTool } from '@tools/defineTool';
import { getToolFormats } from '@tools/toolCatalog';

/** 只展示条目明确声明的平台和收费信息；旧在线工具不被追加未经核实的承诺。 */
export default function ToolCatalogMeta({
  tool,
  compact = false
}: {
  tool: DefinedTool;
  compact?: boolean;
}) {
  const { t } = useTranslation('translation');
  return (
    <Box sx={{ mt: 1 }}>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
        {getToolFormats(tool).map((format) => (
          <Chip
            key={format}
            label={t(`catalog.formats.${format}`)}
            size="small"
            variant="outlined"
          />
        ))}
        {tool.pricing && (
          <Chip label={t(`catalog.pricing.${tool.pricing}`)} size="small" />
        )}
      </Box>
      {!compact && tool.platforms?.length ? (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          {t('catalog.platformLabel')}：
          {tool.platforms
            .map((platform) => t(`catalog.platforms.${platform}`))
            .join(' / ')}
        </Typography>
      ) : null}
      {!compact && tool.publisher && (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          {t('catalog.publisherLabel')}：{tool.publisher}
        </Typography>
      )}
    </Box>
  );
}
