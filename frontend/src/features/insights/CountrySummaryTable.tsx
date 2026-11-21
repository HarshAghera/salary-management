import { Link, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from '@mui/material';
import type { CountrySummary } from '../../api/types';
import { formatCount, formatMoney } from '../../lib/format';
import { COMPACT_CELLS } from './tableStyles';

interface CountrySummaryTableProps {
  rows: CountrySummary[];
  selected: string | undefined;
  onSelect: (countryCode: string) => void;
}

const numeric = { textAlign: 'right', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' } as const;

/**
 * Salary statistics per country, each in that country's own currency (ADR-6). Columns run
 * from the typical salary (median, average) to the range (lowest, highest).
 */
export function CountrySummaryTable({ rows, selected, onSelect }: CountrySummaryTableProps) {
  return (
    <TableContainer>
      <Table sx={{ minWidth: 640, ...COMPACT_CELLS }} aria-label="Salary summary by country">
        <TableHead>
          <TableRow>
            <TableCell>Country</TableCell>
            <TableCell sx={numeric}>Employees</TableCell>
            <TableCell sx={numeric}>Median</TableCell>
            <TableCell sx={numeric}>Average</TableCell>
            <TableCell sx={numeric}>Lowest</TableCell>
            <TableCell sx={numeric}>Highest</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row) => {
            const money = (amount: number) => formatMoney(amount, row.currency, { wholeUnits: true });
            return (
              <TableRow key={row.countryCode} selected={row.countryCode === selected} hover>
                {/* Less vertical padding here: the 44 px touch target of the button sets the row height. */}
                <TableCell component="th" scope="row" sx={{ py: 0.5, whiteSpace: 'nowrap' }}>
                  <Link
                    component="button"
                    type="button"
                    onClick={() => onSelect(row.countryCode)}
                    underline="hover"
                    aria-label={`${row.countryName}: show salaries by job title`}
                    sx={{ fontWeight: 600, minHeight: 44, verticalAlign: 'middle' }}
                  >
                    {row.countryName}
                  </Link>
                  <Typography variant="caption" color="text.secondary" component="span" sx={{ ml: 1 }}>
                    {row.currency}
                  </Typography>
                </TableCell>
                <TableCell sx={numeric}>{formatCount(row.headcount)}</TableCell>
                <TableCell sx={{ ...numeric, fontWeight: 600 }}>{money(row.medianSalary)}</TableCell>
                <TableCell sx={numeric}>{money(row.averageSalary)}</TableCell>
                <TableCell sx={numeric}>{money(row.minSalary)}</TableCell>
                <TableCell sx={numeric}>{money(row.maxSalary)}</TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
