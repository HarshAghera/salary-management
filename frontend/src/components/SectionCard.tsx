import { Box, Card, Stack, Typography } from '@mui/material';
import type { ReactNode } from 'react';

interface SectionCardProps {
  title: string;
  description?: string;
  /** Controls for the section, such as a country picker; they wrap below the title on phones. */
  action?: ReactNode;
  children: ReactNode;
  /** Lets content such as a table run to the card's edges. */
  flush?: boolean;
}

/** A titled card that holds one block of a page: a chart, a table or a list. */
export function SectionCard({ title, description, action, children, flush = false }: SectionCardProps) {
  const id = `section-${title.toLowerCase().replace(/\W+/g, '-')}`;
  return (
    <Card component="section" aria-labelledby={id} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={1.5}
        sx={{ px: { xs: 2, sm: 3 }, pt: { xs: 2, sm: 2.5 }, pb: 2, justifyContent: 'space-between', alignItems: { sm: 'center' } }}
      >
        <Box sx={{ minWidth: 0 }}>
          <Typography id={id} component="h2" variant="h6">
            {title}
          </Typography>
          {description && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
              {description}
            </Typography>
          )}
        </Box>
        {action && <Box sx={{ flexShrink: 0 }}>{action}</Box>}
      </Stack>
      <Box sx={{ px: flush ? 0 : { xs: 2, sm: 3 }, pb: flush ? 0 : { xs: 2, sm: 3 }, flexGrow: 1, minWidth: 0 }}>
        {children}
      </Box>
    </Card>
  );
}
