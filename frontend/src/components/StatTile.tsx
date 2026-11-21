import { Box, Card, Skeleton, Stack, Typography } from '@mui/material';
import type { ReactNode } from 'react';

interface StatTileProps {
  label: string;
  /** Undefined while loading. */
  value: string | undefined;
  detail?: string;
  icon: ReactNode;
  /** Tiles alternate the two accents (ADR-11); status colours stay reserved for meaning. */
  accent: 'primary' | 'secondary';
}

/** One headline figure, such as total headcount. */
export function StatTile({ label, value, detail, icon, accent }: StatTileProps) {
  return (
    <Card sx={{ p: { xs: 2, sm: 2.5 }, height: '100%' }}>
      <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
        <Box
          aria-hidden
          sx={(theme) => ({
            width: 48,
            height: 48,
            flexShrink: 0,
            borderRadius: '14px',
            display: 'grid',
            placeItems: 'center',
            color: `${accent}.main`,
            // The theme uses CSS variables, so the tint follows light and dark mode.
            bgcolor: theme.vars && `rgba(${theme.vars.palette[accent].mainChannel} / 0.12)`,
          })}
        >
          {icon}
        </Box>
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="body2" color="text.secondary">
            {label}
          </Typography>
          {value === undefined ? (
            <Skeleton width={96} height={40} />
          ) : (
            <Typography
              component="p"
              variant="h4"
              sx={{ fontWeight: 700, lineHeight: 1.2, fontVariantNumeric: 'tabular-nums' }}
            >
              {value}
            </Typography>
          )}
          {detail && (
            <Typography variant="caption" color="text.secondary" component="p">
              {detail}
            </Typography>
          )}
        </Box>
      </Stack>
    </Card>
  );
}
