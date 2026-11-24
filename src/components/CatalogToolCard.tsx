import {
  Box,
  Button,
  Card,
  CardContent,
  Link,
  Stack,
  Typography
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { Icon } from '@iconify/react';
import { useTranslation } from 'react-i18next';
import type { DefinedTool } from '@tools/defineTool';
import { getToolActionKey, getToolHref } from '@tools/toolCatalog';
import type { I18nNamespaces } from '../i18n';
import ToolCatalogMeta from './ToolCatalogMeta';
import OfflineInstallDialog from './OfflineInstallDialog';
import { useState } from 'react';

/** 统一目录与精选卡片，先说明用途和安装条件，再把用户送往实际的官方入口。 */
export default function CatalogToolCard({
  tool,
  onRemoveBookmark
}: {
  tool: DefinedTool;
  onRemoveBookmark?: () => void;
}) {
  // 卡片只订阅它实际引用的词条，独立渲染也不要求预载整个工具箱。
  const namespaces = [
    ...new Set([
      'translation',
      ...[tool.name, tool.shortDescription, tool.notice].flatMap((key) =>
        key ? [key.split(':')[0]] : []
      )
    ])
  ] as I18nNamespaces[];
  const { t } = useTranslation(namespaces);
  const [offlineOpen, setOfflineOpen] = useState(false);
  // 只有实际列出的其他浏览器才提示对应版本，不能把官网入口误标为跨浏览器支持。
  const hasOtherBrowsers =
    tool.entryAction === 'extension-store' &&
    tool.platforms?.some(
      (platform) =>
        ['chrome', 'edge', 'firefox', 'safari'].includes(platform) &&
        platform !== tool.entryBrowser
    );
  const destination = tool.externalUrl
    ? {
        component: 'a' as const,
        href: getToolHref(tool),
        target: '_blank',
        rel: 'noopener noreferrer'
      }
    : { component: RouterLink, to: getToolHref(tool) };
  return (
    <Card
      variant="outlined"
      sx={{ height: '100%', borderRadius: 2, bgcolor: 'background.paper' }}
    >
      <CardContent
        sx={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          p: 2.5,
          '&:last-child': { pb: 2.5 }
        }}
      >
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Box sx={{ color: 'primary.main', display: 'flex', flexShrink: 0 }}>
            <Icon icon={tool.icon} fontSize={28} />
          </Box>
          <Link
            {...destination}
            underline="hover"
            color="text.primary"
            fontWeight={700}
            fontSize={18}
          >
            {t(tool.name)}
          </Link>
        </Stack>
        <Typography sx={{ mt: 1.5, lineHeight: 1.7 }}>
          {t(tool.shortDescription)}
        </Typography>
        <ToolCatalogMeta tool={tool} />
        {tool.notice && (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mt: 1.5, lineHeight: 1.7 }}
          >
            {t(tool.notice)}
          </Typography>
        )}
        <Stack
          direction="row"
          spacing={1.5}
          alignItems="center"
          flexWrap="wrap"
          useFlexGap
          sx={{ pt: 2, mt: 'auto' }}
        >
          <Button {...destination} variant="outlined" sx={{ minHeight: 44 }}>
            {t(getToolActionKey(tool))}
            {tool.externalUrl ? ' ↗' : ' →'}
          </Button>
          {tool.offlineInstall && (
            <Button onClick={() => setOfflineOpen(true)} sx={{ minHeight: 44 }}>
              {t('translation:catalog.offline.open')}
            </Button>
          )}
          {tool.officialWebsite && (
            <Link
              href={tool.officialWebsite}
              target="_blank"
              rel="noopener noreferrer"
              sx={{ py: 1.5, fontSize: 14 }}
            >
              {t(
                hasOtherBrowsers
                  ? 'catalog.otherBrowsers'
                  : 'catalog.officialWebsite'
              )}
            </Link>
          )}
          {onRemoveBookmark && (
            <Button onClick={onRemoveBookmark} sx={{ minHeight: 44 }}>
              {t('translation:hero.removeBookmark', { title: t(tool.name) })}
            </Button>
          )}
        </Stack>
      </CardContent>
      {offlineOpen && tool.offlineInstall && (
        <OfflineInstallDialog
          name={t(tool.name)}
          installation={tool.offlineInstall}
          onClose={() => setOfflineOpen(false)}
        />
      )}
    </Card>
  );
}
