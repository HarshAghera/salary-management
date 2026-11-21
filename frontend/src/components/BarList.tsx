import { Box, Typography } from '@mui/material';

export interface BarItem {
  key: string;
  label: string;
  value: number;
  /** The value as people read it, such as "2,053". */
  valueLabel: string;
}

interface BarListProps {
  items: BarItem[];
  /** Names the list for screen readers, such as "Headcount by country". */
  label: string;
}

/**
 * Horizontal bars for one measure, longest first. One hue only: the bars show magnitude,
 * the label names the item and the number states the value, so nothing relies on colour.
 */
export function BarList({ items, label }: BarListProps) {
  const max = Math.max(...items.map((item) => item.value), 1);
  return (
    <Box component="ul" aria-label={label} sx={{ listStyle: 'none', m: 0, p: 0, display: 'grid', gap: 1.5 }}>
      {items.map((item) => (
        <Box
          component="li"
          key={item.key}
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: 'minmax(0, 7.5rem) minmax(0, 1fr) auto', sm: 'minmax(0, 10rem) minmax(0, 1fr) auto' },
            alignItems: 'center',
            gap: 1.5,
          }}
        >
          <Typography variant="body2" noWrap title={item.label}>
            {item.label}
          </Typography>
          <Box aria-hidden sx={{ height: 10, borderRadius: 5, bgcolor: 'action.hover', overflow: 'hidden' }}>
            <Box
              sx={{
                height: '100%',
                width: `${(item.value / max) * 100}%`,
                minWidth: 4,
                borderRadius: 5,
                bgcolor: 'primary.main',
              }}
            />
          </Box>
          <Typography
            variant="body2"
            sx={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums', textAlign: 'right', minWidth: '3.5rem' }}
          >
            {item.valueLabel}
          </Typography>
        </Box>
      ))}
    </Box>
  );
}
