import { useContext, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Grid,
  Paper,
  Stack,
  TextField,
  Typography
} from '@mui/material';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { CustomSnackBarContext } from '../../../../contexts/CustomSnackBarContext';
import {
  computeStatistics,
  formatStatistic,
  MAX_STATISTICS_CHARACTERS,
  MAX_STATISTICS_VALUES
} from './service';

const metrics = ['count', 'sum', 'mean', 'median', 'min', 'max'] as const;

/** 一列数据一次得到常用统计；高级文本提取仍使用原求和工具，避免悄悄改变其规则。 */
export default function NumberStatistics() {
  const { t } = useTranslation(['number', 'translation']);
  const { showSnackBar } = useContext(CustomSnackBarContext);
  const [input, setInput] = useState('');
  const result = useMemo(() => computeStatistics(input), [input]);
  const copyResults = async () => {
    if (result.status !== 'ready') return;
    try {
      // 只复制本次完整校验通过的统计，不保留输入修改前的旧结果。
      await navigator.clipboard.writeText(
        metrics
          .map(
            (metric) =>
              `${t(`statistics.${metric}`)}\t${formatStatistic(result[metric])}`
          )
          .join('\n')
      );
      showSnackBar(t('translation:toolTextResult.copied'), 'success');
    } catch {
      showSnackBar(t('statistics.copyFailed'), 'error');
    }
  };

  return (
    <Box sx={{ mt: 3 }}>
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Typography component="h2" variant="h6" sx={{ mb: 1.5 }}>
            {t('statistics.inputTitle')}
          </Typography>
          <TextField
            fullWidth
            multiline
            minRows={10}
            maxRows={16}
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder={'12.5\n18\n-3\n7.5'}
            inputProps={{
              'aria-label': t('statistics.inputTitle'),
              'data-testid': 'statistics-input'
            }}
            sx={{ bgcolor: 'background.paper' }}
          />
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mt: 1.5, lineHeight: 1.7 }}
          >
            {t('statistics.inputHelp', { max: MAX_STATISTICS_VALUES })}
          </Typography>
          <Stack direction="row" spacing={1} sx={{ mt: 1.5 }}>
            <Button
              variant="outlined"
              onClick={() => setInput('12.5\n18\n-3\n7.5')}
            >
              {t('statistics.example')}
            </Button>
            <Button disabled={!input} onClick={() => setInput('')}>
              {t('statistics.clear')}
            </Button>
          </Stack>
        </Grid>
        <Grid item xs={12} md={6}>
          <Typography component="h2" variant="h6" sx={{ mb: 1.5 }}>
            {t('statistics.resultTitle')}
          </Typography>
          {result.status === 'invalid' ? (
            <Alert severity="error" role="alert">
              {t(`statistics.errors.${result.error}`, {
                line: result.line,
                max:
                  result.error === 'inputTooLarge'
                    ? MAX_STATISTICS_CHARACTERS
                    : MAX_STATISTICS_VALUES
              })}
            </Alert>
          ) : result.status === 'empty' ? (
            <Paper variant="outlined" sx={{ p: 3 }}>
              <Typography color="text.secondary">
                {t('statistics.empty')}
              </Typography>
            </Paper>
          ) : (
            <Paper variant="outlined" sx={{ p: 2.5 }}>
              <Box
                component="dl"
                sx={{
                  m: 0,
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                  gap: 3
                }}
              >
                {metrics.map((metric) => (
                  <Box key={metric}>
                    <Typography
                      component="dt"
                      variant="body2"
                      color="text.secondary"
                    >
                      {t(`statistics.${metric}`)}
                    </Typography>
                    <Typography
                      component="dd"
                      sx={{
                        m: 0,
                        mt: 0.5,
                        fontSize: 22,
                        fontWeight: 600,
                        overflowWrap: 'anywhere',
                        fontVariantNumeric: 'tabular-nums'
                      }}
                    >
                      {formatStatistic(result[metric])}
                    </Typography>
                  </Box>
                ))}
              </Box>
              <Button sx={{ mt: 2.5 }} variant="outlined" onClick={copyResults}>
                {t('statistics.copy')}
              </Button>
            </Paper>
          )}
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mt: 1.5, lineHeight: 1.7 }}
          >
            {t('statistics.precisionNote')}
          </Typography>
        </Grid>
      </Grid>
      <Box sx={{ mt: 3, pt: 2, borderTop: 1, borderColor: 'divider' }}>
        <Button component={Link} to="/number/sum" sx={{ textAlign: 'left' }}>
          {t('statistics.advanced')}
        </Button>
      </Box>
    </Box>
  );
}
