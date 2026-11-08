import {
  Alert,
  Box,
  Button,
  Container,
  List,
  ListItem,
  ListItemText,
  Typography
} from '@mui/material';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import deferred from '../../config/deferred-tools.json';

/** 展示延期工具的实际原因；旧深链接仍可打开说明，不执行原引擎或加载外部资源。 */
export default function DeferredTools() {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const current = deferred.find(
    (tool) => `/${tool.path}` === location.pathname
  );
  const tools = current ? [current] : deferred;
  const chinese = i18n.language.startsWith('zh');
  return (
    <Container maxWidth="md" sx={{ py: 5 }}>
      <Typography component="h1" variant="h4" gutterBottom>
        {t('release.title')}
      </Typography>
      <Alert severity="info">{t('release.intro')}</Alert>
      <List>
        {tools.map((tool) => (
          <ListItem key={tool.path} divider disableGutters>
            <ListItemText
              primary={chinese ? tool.zhName : tool.name}
              secondary={t(
                tool.reason === 'binary'
                  ? 'release.binary'
                  : 'release.resources'
              )}
            />
          </ListItem>
        ))}
      </List>
      <Box mt={3}>
        <Button component={Link} to="/" variant="contained">
          {t('release.back')}
        </Button>
      </Box>
    </Container>
  );
}
