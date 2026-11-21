import { Box, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';
import type { CountryJobTitles } from '../../api/types';
import { formatCount, formatMoney } from '../../lib/format';
import { COMPACT_CELLS } from './tableStyles';

const numeric = { textAlign: 'right', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' } as const;

/**
 * Job titles within one country, highest average first. All amounts share one currency,
 * so a bar beside each average compares them fairly.
 */
export function JobTitleTable({ data }: { data: CountryJobTitles }) {
  const money = (amount: number) => formatMoney(amount, data.currency, { wholeUnits: true });
  const highestAverage = Math.max(...data.jobTitles.map((row) => row.averageSalary), 1);

  return (
    <TableContainer>
      <Table sx={{ minWidth: 640, ...COMPACT_CELLS }} aria-label={`Salaries by job title in ${data.countryName}`}>
        <TableHead>
          <TableRow>
            <TableCell>Job title</TableCell>
            <TableCell sx={numeric}>Employees</TableCell>
            <TableCell sx={numeric}>Average</TableCell>
            <TableCell sx={numeric}>Lowest</TableCell>
            <TableCell sx={numeric}>Highest</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {data.jobTitles.map((row) => (
            <TableRow key={row.jobTitle} hover>
              <TableCell component="th" scope="row" sx={{ fontWeight: 600, whiteSpace: 'nowrap' }}>
                {row.jobTitle}
              </TableCell>
              <TableCell sx={numeric}>{formatCount(row.headcount)}</TableCell>
              <TableCell sx={numeric}>
                <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', justifyContent: 'flex-end' }}>
                  {/* A fixed width: inside a table cell a flexible bar would shrink to nothing. */}
                  <Box
                    aria-hidden
                    sx={{ width: { xs: 56, md: 120, lg: 160 }, flexShrink: 0, height: 8, borderRadius: 4, bgcolor: 'action.hover' }}
                  >
                    <Box
                      sx={{
                        height: '100%',
                        borderRadius: 4,
                        bgcolor: 'primary.main',
                        // Anchored at the left, the bar's zero, so lengths compare directly.
                        width: `${(row.averageSalary / highestAverage) * 100}%`,
                      }}
                    />
                  </Box>
                  <Box component="span" sx={{ fontWeight: 600, minWidth: '6rem' }}>
                    {money(row.averageSalary)}
                  </Box>
                </Stack>
              </TableCell>
              <TableCell sx={numeric}>{money(row.minSalary)}</TableCell>
              <TableCell sx={numeric}>{money(row.maxSalary)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
