import { Box, Button, Stack, Typography, useTheme } from '@mui/material';
import NorthEastIcon from '@mui/icons-material/NorthEast';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { Fragment, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import type { I18nNamespaces } from '../i18n';
import { Link } from 'react-router-dom';
import {
  getToolActionKey,
  getToolHref,
  type DefinedTool
} from '@tools/defineTool';
import {
  illustratedTools,
  pickWorkbenchTools,
  untilWorkbenchDayChanges,
  workbenchDay
} from '@tools/homeDiscovery';
import beadCat from '../assets/workbench/bead-cat.webp';
import lighthouse from '../assets/workbench/lighthouse-model.webp';

const artworks = {
  bead: { src: beadCat, width: 1200, height: 511 },
  model: { src: lighthouse, width: 1200, height: 511 }
} as const;

function SketchUnderline({ width = 46 }: { width?: number }) {
  return (
    <Box
      component="svg"
      aria-hidden="true"
      viewBox="0 0 64 8"
      sx={{
        display: 'block',
        width,
        height: 7,
        mx: 'auto',
        mt: 0.25,
        overflow: 'visible'
      }}
    >
      <path
        d="M2 5.2 C 20 2.6, 44 2.4, 62 4.8"
        fill="none"
        stroke="var(--home-ink-note)"
        strokeWidth="1.9"
        strokeLinecap="round"
      />
    </Box>
  );
}

function AccentRays({ mirror = false }: { mirror?: boolean }) {
  return (
    <Box
      component="svg"
      aria-hidden="true"
      viewBox="0 0 28 28"
      sx={{
        position: 'absolute',
        width: { xs: 20, md: 26 },
        height: { xs: 20, md: 26 },
        pointerEvents: 'none',
        transform: mirror ? 'scaleX(-1)' : undefined
      }}
    >
      <path
        d="M5 17 L13 19 M9 10 L16 15 M16 5 L20 12"
        fill="none"
        stroke="var(--home-ink-note)"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </Box>
  );
}

/** 每天展示两种工具；切换时只更换样品，不预填文件或离开首页。 */
export default function WorkbenchPreview({
  catalog
}: {
  catalog: DefinedTool[];
}) {
  const { t: rawT } = useTranslation('translation');
  const t = rawT as unknown as TFunction<I18nNamespaces[]>;
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const [day, setDay] = useState(workbenchDay);
  const [choice, setChoice] = useState<{ day: number; path: string }>();

  useEffect(() => {
    const update = () => setDay(workbenchDay());
    const timer = window.setTimeout(update, untilWorkbenchDayChanges() + 50);
    document.addEventListener('visibilitychange', update);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener('visibilitychange', update);
    };
  }, [day]);

  const samples = pickWorkbenchTools(catalog, day);
  const selected =
    samples.find((tool) => choice?.day === day && choice.path === tool.path) ??
    samples[0];
  if (!selected) return null;
  const kind = illustratedTools[selected.path as keyof typeof illustratedTools];
  const art = kind ? artworks[kind] : undefined;
  const caption =
    kind === 'bead'
      ? ('hero.workbench.bead' as const)
      : ('hero.workbench.model' as const);
  const url = getToolHref(selected);
  const external = !!selected.externalUrl;

  return (
    <Box
      component="section"
      aria-labelledby="workbench-title"
      sx={{
        mt: { xs: 2.5, md: 3 },
        borderTop: '1px solid var(--home-rule)',
        borderBottom: '1px solid var(--home-rule)',
        position: 'relative'
      }}
    >
      <Typography
        id="workbench-title"
        component="h2"
        sx={{
          display: 'inline-block',
          position: 'absolute',
          top: 0,
          left: { xs: 10, sm: 18 },
          zIndex: 1,
          px: { xs: 1.75, md: 2.25 },
          py: 0.35,
          bgcolor: 'var(--home-paper-tag)',
          color: 'var(--home-ink)',
          fontSize: { xs: 14, md: 15.5 },
          fontWeight: 700,
          lineHeight: 1.35,
          letterSpacing: '0.02em',
          transform: 'translateY(-50%) rotate(-0.8deg)',
          clipPath:
            'polygon(2% 6%, 98% 0%, 100% 24%, 97% 50%, 100% 76%, 98% 96%, 1% 100%, 0% 72%, 2% 48%, 0% 24%)',
          filter: isDark
            ? 'none'
            : 'drop-shadow(0 1px 1px rgba(102, 76, 48, 0.14))'
        }}
      >
        {t('hero.workbench.label')}
      </Typography>

      <Stack
        direction="row"
        alignItems="center"
        sx={{
          px: { xs: 0.5, sm: 1.5, md: 2 },
          pt: { xs: 2.25, md: 2.5 },
          borderBottom: '1px solid',
          borderColor: isDark ? 'divider' : '#e6dfd5'
        }}
      >
        {samples.map((tool, index) => {
          const active = tool.path === selected.path;
          return (
            <Fragment key={tool.path}>
              {index > 0 && (
                <Box
                  aria-hidden="true"
                  sx={{
                    width: '1px',
                    height: 15,
                    bgcolor: 'var(--home-pipe)',
                    mx: { xs: 1.5, md: 2.25 },
                    flexShrink: 0
                  }}
                />
              )}
              <Button
                color="inherit"
                aria-pressed={active}
                onClick={() => setChoice({ day, path: tool.path })}
                sx={{
                  position: 'relative',
                  px: { xs: 0.5, md: 0.75 },
                  minHeight: { xs: 40, md: 42 },
                  minWidth: 0,
                  textAlign: 'left',
                  borderRadius: 0,
                  fontSize: { xs: 14.5, md: 16 },
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
                }}
              >
                {tool.path === 'image-generic/bead-pattern'
                  ? t('hero.workbench.bead.tab')
                  : t(tool.name)}
              </Button>
            </Fragment>
          );
        })}
      </Stack>

      <Box
        sx={{
          display: 'grid',
          alignItems: 'center',
          gridTemplateColumns: {
            xs: 'minmax(0, 1fr)',
            md: art ? 'minmax(0, 1.92fr) minmax(0, 1fr)' : '1fr'
          },
          gap: { xs: 2.5, md: 3 },
          px: { xs: 0.5, sm: 2, md: 3.5 },
          py: { xs: 2.5, md: 3.25 }
        }}
      >
        {art && (
          <Box
            component="figure"
            sx={{ m: 0, minWidth: 0, position: 'relative' }}
          >
            <Box
              sx={{
                position: 'relative',
                width: { xs: '100%', md: kind === 'bead' ? '82%' : '88%' },
                ...(isDark
                  ? {
                      bgcolor: '#fbf8f3',
                      borderRadius: 2,
                      p: 1
                    }
                  : {})
              }}
            >
              {kind === 'bead' && !isDark && (
                <>
                  <Box
                    sx={{
                      position: 'absolute',
                      top: '14%',
                      left: '2%',
                      zIndex: 1
                    }}
                  >
                    <AccentRays />
                  </Box>
                  <Box
                    sx={{
                      position: 'absolute',
                      top: '1%',
                      right: '4%',
                      zIndex: 1
                    }}
                  >
                    <AccentRays mirror />
                  </Box>
                </>
              )}
              <Box
                component="img"
                src={art.src}
                alt={t(`${caption}.alt`)}
                width={art.width}
                height={art.height}
                sx={{
                  display: 'block',
                  width: '100%',
                  height: 'auto',
                  mixBlendMode: isDark ? 'normal' : 'multiply'
                }}
              />
            </Box>

            {kind === 'bead' && (
              <Box
                sx={{
                  position: { md: 'absolute' },
                  right: { md: '2%' },
                  bottom: { md: '28%' },
                  width: { md: '18%' },
                  mt: { xs: 1, md: 0 },
                  transform: { md: 'rotate(-6deg)' },
                  textAlign: 'center',
                  color: 'var(--home-ink-note)',
                  pointerEvents: 'none'
                }}
              >
                <Typography
                  sx={{
                    fontSize: { xs: 13.5, md: 15.5 },
                    lineHeight: 1.45,
                    fontWeight: 500,
                    whiteSpace: 'nowrap',
                    color: 'inherit'
                  }}
                >
                  <Box
                    component="span"
                    aria-hidden="true"
                    sx={{
                      display: { xs: 'inline', md: 'block' },
                      mr: { xs: 0.75, md: 0 },
                      fontFamily:
                        '"Segoe UI", "Microsoft YaHei", system-ui, sans-serif'
                    }}
                  >
                    (ง •̀_•́)ง
                  </Box>
                  {t('hero.workbench.bead.note')}
                </Typography>
                <Box sx={{ display: { xs: 'none', md: 'block' } }}>
                  <SketchUnderline width={62} />
                </Box>
              </Box>
            )}

            <Box
              component="figcaption"
              sx={{
                display: 'grid',
                gridTemplateColumns: '38% 62%',
                textAlign: 'center',
                mt: 0.25,
                width: { xs: '100%', md: kind === 'bead' ? '82%' : '88%' },
                color: 'var(--home-ink)',
                fontSize: { xs: 14, md: 15.5 },
                fontWeight: 600
              }}
            >
              <Box component="span" sx={{ display: 'inline-block' }}>
                {t(`${caption}.before`)}
                <SketchUnderline width={38} />
              </Box>
              <Box component="span" sx={{ display: 'inline-block' }}>
                {t(`${caption}.after`)}
                <SketchUnderline width={68} />
              </Box>
            </Box>
          </Box>
        )}

        <Box minWidth={0} sx={{ pl: { md: art ? 1.5 : 0 } }}>
          <Box aria-live="polite" aria-atomic="true">
            <Typography
              component="h3"
              sx={{
                fontWeight: 700,
                fontSize: { xs: 21, md: 25 },
                lineHeight: 1.35,
                letterSpacing: '0.01em',
                color: 'var(--home-ink)'
              }}
            >
              {art ? t(`${caption}.title`) : t(selected.name)}
            </Typography>
            {!art && (
              <Typography sx={{ mt: 1, color: 'text.secondary' }}>
                {t(selected.shortDescription)}
              </Typography>
            )}
          </Box>
          <Button
            key={selected.path}
            {...(external
              ? {
                  component: 'a' as const,
                  href: url,
                  target: '_blank',
                  rel: 'noopener noreferrer'
                }
              : { component: Link, to: url })}
            endIcon={
              external ? (
                <NorthEastIcon
                  aria-hidden="true"
                  sx={{ fontSize: '18px !important' }}
                />
              ) : (
                <ArrowForwardIcon
                  aria-hidden="true"
                  sx={{ fontSize: '18px !important' }}
                />
              )
            }
            variant="contained"
            disableElevation
            sx={{
              mt: { xs: 2, md: 2.75 },
              px: { xs: 2.5, md: 3.25 },
              minHeight: { xs: 44, md: 46 },
              fontSize: { xs: 15, md: 16 },
              fontWeight: 500,
              borderRadius: '8px',
              bgcolor: '#1976d2',
              '&:hover': {
                bgcolor: '#1565c0'
              }
            }}
          >
            {art ? t(`${caption}.action`) : t(getToolActionKey(selected))}
          </Button>
        </Box>
      </Box>
    </Box>
  );
}
