import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { Button, Stack, Typography } from '@mui/material';
import { Link } from 'react-router';
import { usePageTitle } from './usePageTitle';

export function NotFoundPage() {
  usePageTitle('Page not found');
  return (
    <Stack spacing={2} sx={{ alignItems: 'flex-start', py: { xs: 4, md: 8 } }}>
      <Typography variant="overline" color="primary">
        Error 404
      </Typography>
      <Typography component="h1" variant="h4">
        Page not found
      </Typography>
      <Typography color="text.secondary">The page you were looking for does not exist or has moved.</Typography>
      <Button component={Link} to="/employees" variant="contained" startIcon={<ArrowBackIcon />}>
        Go to the employee directory
      </Button>
    </Stack>
  );
}
