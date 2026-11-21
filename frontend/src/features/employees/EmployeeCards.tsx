import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import PlaceOutlinedIcon from '@mui/icons-material/PlaceOutlined';
import { Box, Button, Card, CardContent, IconButton, Skeleton, Stack, Typography } from '@mui/material';
import type { Employee } from '../../api/types';
import { formatCount, formatMoney } from '../../lib/format';

interface EmployeeCardsProps {
  employees: Employee[];
  total: number;
  loading: boolean;
  hasMore: boolean;
  loadingMore: boolean;
  onShowMore: () => void;
  onEdit: (employee: Employee) => void;
  onDelete: (employee: Employee) => void;
  countryName: (code: string) => string;
}

function EmployeeCard({
  employee,
  countryName,
  onEdit,
  onDelete,
}: {
  employee: Employee;
  countryName: (code: string) => string;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <Card component="li">
      {/* minmax(0, 1fr): long names and titles truncate instead of widening the card past the screen. */}
      <CardContent sx={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', gap: 1.5, '&:last-child': { pb: 2 } }}>
        <Stack direction="row" spacing={1} sx={{ alignItems: 'flex-start' }}>
          <Box sx={{ minWidth: 0, flexGrow: 1 }}>
            <Typography component="h2" variant="subtitle1" noWrap>
              {employee.fullName}
            </Typography>
            <Typography variant="body2" color="text.secondary" noWrap>
              {employee.jobTitle} · {employee.department}
            </Typography>
          </Box>
          <Stack direction="row" sx={{ mr: -1, mt: -0.5, flexShrink: 0 }}>
            <IconButton aria-label={`Edit ${employee.fullName}`} onClick={onEdit}>
              <EditOutlinedIcon fontSize="small" />
            </IconButton>
            <IconButton aria-label={`Delete ${employee.fullName}`} onClick={onDelete}>
              <DeleteOutlineIcon fontSize="small" />
            </IconButton>
          </Stack>
        </Stack>
        <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
          <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center', color: 'text.secondary', minWidth: 0 }}>
            <PlaceOutlinedIcon sx={{ fontSize: 18 }} />
            <Typography variant="body2" noWrap>
              {countryName(employee.countryCode)}
            </Typography>
          </Stack>
          <Typography sx={{ fontWeight: 700, fontVariantNumeric: 'tabular-nums', flexShrink: 0 }}>
            {formatMoney(employee.salary, employee.currency)}
          </Typography>
        </Stack>
      </CardContent>
    </Card>
  );
}

/** Phone layout of the directory: one card per employee, more loaded on request. */
export function EmployeeCards({
  employees,
  total,
  loading,
  hasMore,
  loadingMore,
  onShowMore,
  onEdit,
  onDelete,
  countryName,
}: EmployeeCardsProps) {
  if (loading) {
    return (
      <Stack spacing={1.5} aria-label="Loading employees">
        {[0, 1, 2].map((key) => (
          <Skeleton key={key} variant="rounded" height={112} />
        ))}
      </Stack>
    );
  }

  return (
    <Stack spacing={2}>
      <Stack component="ul" spacing={1.5} sx={{ listStyle: 'none', p: 0, m: 0 }} aria-label="Employees">
        {employees.map((employee) => (
          <EmployeeCard
            key={employee.id}
            employee={employee}
            countryName={countryName}
            onEdit={() => onEdit(employee)}
            onDelete={() => onDelete(employee)}
          />
        ))}
      </Stack>
      <Stack spacing={1} sx={{ alignItems: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          Showing {formatCount(employees.length)} of {formatCount(total)}
        </Typography>
        {hasMore && (
          <Button variant="outlined" onClick={onShowMore} loading={loadingMore} fullWidth>
            Show more
          </Button>
        )}
      </Stack>
    </Stack>
  );
}
