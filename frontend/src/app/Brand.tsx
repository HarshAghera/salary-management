import PaymentsIcon from '@mui/icons-material/Payments';
import { Box, Stack, Typography } from '@mui/material';
import { BRAND_COLOR } from '../theme';

interface BrandProps {
  /** Set when the brand sits on the primary-coloured top bar rather than on a card or drawer. */
  onColor?: boolean;
}

/** Logo mark and product name. */
export function Brand({ onColor = false }: BrandProps) {
  return (
    <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', minWidth: 0 }}>
      <Box
        aria-hidden
        sx={{
          width: 36,
          height: 36,
          borderRadius: '10px',
          display: 'grid',
          placeItems: 'center',
          flexShrink: 0,
          color: '#fff',
          bgcolor: onColor ? 'rgba(255, 255, 255, 0.18)' : BRAND_COLOR,
        }}
      >
        <PaymentsIcon fontSize="small" />
      </Box>
      <Box sx={{ minWidth: 0 }}>
        <Typography component="p" variant="subtitle1" sx={{ fontWeight: 700, lineHeight: 1.2 }} noWrap>
          ACME
        </Typography>
        <Typography
          component="p"
          variant="caption"
          sx={{ lineHeight: 1.2, color: onColor ? 'rgba(255, 255, 255, 0.75)' : 'text.secondary' }}
          noWrap
        >
          Salary Management
        </Typography>
      </Box>
    </Stack>
  );
}
