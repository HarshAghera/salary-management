import {
  Box,
  List,
  ListItem,
  ListItemText,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import type { RowError } from '../../api/types';
import { formatCount } from '../../lib/format';

/** Enough to fix a file in one pass; a file with more problems is better rebuilt from the template. */
const MAX_SHOWN = 200;

interface ImportErrorReportProps {
  errors: RowError[];
  /** Phones get a list; wider screens a table (docs/architecture.md, responsive layout). */
  compact: boolean;
}

function summary(errors: RowError[]): string {
  const rows = new Set(errors.map((error) => error.row)).size;
  const problems = `${formatCount(errors.length)} ${errors.length === 1 ? 'problem' : 'problems'}`;
  return `${problems} in ${formatCount(rows)} ${rows === 1 ? 'row' : 'rows'}. Fix them in the spreadsheet and import it again.`;
}

/** Every problem in a rejected file, located by spreadsheet row and column. */
export function ImportErrorReport({ errors, compact }: ImportErrorReportProps) {
  const shown = errors.slice(0, MAX_SHOWN);

  return (
    <Box>
      <Typography variant="body2" sx={{ mb: 1.5 }}>
        {summary(errors)}
      </Typography>
      <Box
        sx={{ maxHeight: 420, overflow: 'auto', border: 1, borderColor: 'divider', borderRadius: 2 }}
        tabIndex={0}
        role="region"
        aria-label="Problems in the file"
      >
        {compact ? (
          <List dense disablePadding>
            {shown.map((error, index) => (
              <ListItem key={index} divider={index < shown.length - 1}>
                <ListItemText
                  primary={error.message}
                  secondary={`Row ${error.row} · ${error.column}`}
                  slotProps={{ secondary: { sx: { fontVariantNumeric: 'tabular-nums' } } }}
                />
              </ListItem>
            ))}
          </List>
        ) : (
          <TableContainer>
            <Table size="small" stickyHeader aria-label="Problems in the file">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ width: 96 }}>Row</TableCell>
                  <TableCell sx={{ width: 160 }}>Column</TableCell>
                  <TableCell>Problem</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {shown.map((error, index) => (
                  <TableRow key={index}>
                    <TableCell sx={{ fontVariantNumeric: 'tabular-nums' }}>{error.row}</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>{error.column}</TableCell>
                    <TableCell>{error.message}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Box>
      {errors.length > MAX_SHOWN && (
        <Typography variant="caption" color="text.secondary" component="p" sx={{ mt: 1 }}>
          Showing the first {MAX_SHOWN} of {formatCount(errors.length)} problems.
        </Typography>
      )}
    </Box>
  );
}
