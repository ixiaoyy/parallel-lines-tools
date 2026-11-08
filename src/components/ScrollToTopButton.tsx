import { useState, useEffect } from 'react';
import Button from '@mui/material/Button';
import { Icon } from '@iconify/react';
import { useTranslation } from 'react-i18next';

export default function ScrollToTopButton() {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => {
      setVisible(window.scrollY > 100);
    };

    window.addEventListener('scroll', toggleVisibility);
    return () => window.removeEventListener('scroll', toggleVisibility);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (!visible) return null;

  return (
    <Button
      onClick={scrollToTop}
      variant="contained"
      color="primary"
      sx={{
        position: 'fixed',
        bottom: 20,
        right: 20,
        zIndex: 9999,
        minWidth: '44px',
        width: '44px',
        height: '44px',
        borderRadius: '50%',
        padding: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
      aria-label={t('navigation.scrollTop')}
    >
      <Icon icon="mdi:arrow-up" fontSize={24} style={{ color: 'white' }} />
    </Button>
  );
}
