import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import './Loading.css';
import { useTranslation } from 'react-i18next';

function Loading() {
  // 加载占位本身不能再次挂起；语言包尚未就绪时使用对应语言的简短提示。
  const { t, i18n } = useTranslation('translation', { useSuspense: false });
  return (
    <Box
      sx={{
        width: '100%',
        height: 0.8 * window.innerHeight,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center'
      }}
    >
      <Typography color="primary" role="status">
        {t('loading.label', {
          defaultValue:
            i18n.resolvedLanguage === 'en' ? 'Loading…' : '正在加载…'
        })}
      </Typography>
      <Box
        id="spinner"
        sx={{
          '& > div': {
            backgroundColor: 'palette.secondary.main'
          }
        }}
      >
        <div className="bounce1" />
        <div className="bounce2" />
        <div className="bounce3" />
      </Box>
    </Box>
  );
}

export default Loading;
