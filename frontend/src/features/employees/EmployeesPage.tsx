import AddIcon from '@mui/icons-material/Add';
import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined';
import PersonSearchOutlinedIcon from '@mui/icons-material/PersonSearchOutlined';
import { Alert, Button, Card, Snackbar, Stack, Typography, useMediaQuery } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { lazy, Suspense, useCallback, useMemo, useState } from 'react';
import type { Employee } from '../../api/types';
import { PageHeader } from '../../components/PageHeader';
import { DeleteEmployeeDialog } from './DeleteEmployeeDialog';
import { activeFilterCount, toDirectoryFilters, toDirectoryParams, type DirectoryState } from './directoryState';
import { EmployeeCards } from './EmployeeCards';
import { EmployeeFilters } from './EmployeeFilters';
import { EmployeeTable } from './EmployeeTable';
import { useEmployeeFeed, useEmployeePage, useFilterOptions } from './queries';
import { useDirectoryState } from './useDirectoryState';
import { useExportEmployees } from '../import-export/queries';

/**
 * The form, with its date picker, loads the first time someone adds or edits an employee,
 * so the directory itself opens without it.
 */
const EmployeeFormDialog = lazy(() =>
  import('./EmployeeFormDialog').then((module) => ({ default: module.EmployeeFormDialog })),
);

/**
 * A dialog keeps showing its employee while it animates closed, so "open" is tracked
 * separately from the employee. The key gives each opening a fresh form.
 */
interface DialogTarget {
  open: boolean;
  employee?: Employee;
  key: number;
}

const CLOSED: DialogTarget = { open: false, key: 0 };

function EmptyState({ filtered, onClear }: { filtered: boolean; onClear: () => void }) {
  return (
    <Card sx={{ p: { xs: 4, sm: 6 }, textAlign: 'center' }}>
      <Stack spacing={1.5} sx={{ alignItems: 'center' }}>
        <PersonSearchOutlinedIcon sx={{ fontSize: 40, color: 'text.secondary' }} />
        <Typography component="h2" variant="h6">
          {filtered ? 'No employees match your search and filters' : 'No employees yet'}
        </Typography>
        <Typography color="text.secondary" sx={{ maxWidth: '45ch' }}>
          {filtered
            ? 'Try a different name or email, or clear the filters to see everyone.'
            : 'Add your first employee, or import a spreadsheet from Import & export.'}
        </Typography>
        {filtered && <Button onClick={onClear}>Clear filters</Button>}
      </Stack>
    </Card>
  );
}

export function EmployeesPage() {
  const theme = useTheme();
  // noSsr reads the screen size on the first render, so a phone never fetches the desktop grid first.
  const isPhone = useMediaQuery(theme.breakpoints.down('sm'), { noSsr: true });
  const isDesktop = useMediaQuery(theme.breakpoints.up('lg'), { noSsr: true });
  const [state, update] = useDirectoryState();

  const options = useFilterOptions();
  const pageQuery = useEmployeePage(toDirectoryParams(state), !isPhone);
  const feed = useEmployeeFeed(toDirectoryFilters(state), state.pageSize, isPhone);

  const [form, setForm] = useState<DialogTarget>(CLOSED);
  const [deletion, setDeletion] = useState<DialogTarget>(CLOSED);
  const [message, setMessage] = useState<{ text: string; severity: 'success' | 'info' | 'error' }>();
  const exporter = useExportEmployees();

  const countryNames = useMemo(
    () => new Map((options.data?.countries ?? []).map((country) => [country.code, country.name])),
    [options.data],
  );
  const countryName = useCallback((code: string) => countryNames.get(code) ?? code, [countryNames]);
  const openEdit = useCallback(
    (employee: Employee) => setForm((current) => ({ open: true, employee, key: current.key + 1 })),
    [],
  );
  const openDelete = useCallback(
    (employee: Employee) => setDeletion((current) => ({ open: true, employee, key: current.key + 1 })),
    [],
  );
  const clearFilters = () => update({ search: '', country: '', department: '', jobTitle: '' });
  const handleChange = (changes: Partial<DirectoryState>) => update(changes);

  const active = isPhone ? feed : pageQuery;
  const total = isPhone ? feed.data?.pages[0]?.total : pageQuery.data?.total;
  const isEmpty = total === 0 && !active.isFetching;

  return (
    <>
      <PageHeader
        title="Employees"
        description="Find, add and update employees and their salaries."
        actions={
          <>
            {/* Exports what is on screen: the same search, filters and sort (ADR-12). */}
            <Button
              variant="outlined"
              startIcon={<FileDownloadOutlinedIcon />}
              onClick={() =>
                exporter.mutate(toDirectoryFilters(state), {
                  onError: (error) => setMessage({ text: `Export failed. ${error.message}`, severity: 'error' }),
                })
              }
              loading={exporter.isPending}
              fullWidth={isPhone}
            >
              {activeFilterCount(state) > 0 ? 'Export filtered list' : 'Export'}
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setForm((current) => ({ open: true, key: current.key + 1 }))}
              fullWidth={isPhone}
            >
              Add employee
            </Button>
          </>
        }
      />

      <EmployeeFilters state={state} options={options.data} onChange={handleChange} compact={isPhone} />

      {/* Salaries are stored in each country's own currency (ADR-6), so a cross-country salary
          sort orders raw numbers, not money. Say so rather than let ₹ outrank $ silently. */}
      {state.sortBy === 'salary' && !state.country && !active.isError && !isEmpty && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Salaries are in each country&apos;s own currency, so this order mixes currencies. Choose a country to
          compare salaries like for like.
        </Alert>
      )}

      {active.isError ? (
        <Alert
          severity="error"
          action={
            <Button color="inherit" onClick={() => void active.refetch()}>
              Try again
            </Button>
          }
        >
          The employee directory could not be loaded. {active.error.message}
        </Alert>
      ) : isEmpty ? (
        <EmptyState filtered={activeFilterCount(state) > 0} onClear={clearFilters} />
      ) : isPhone ? (
        <EmployeeCards
          employees={feed.data?.pages.flatMap((page) => page.items) ?? []}
          total={total ?? 0}
          loading={feed.isPending}
          hasMore={feed.hasNextPage}
          loadingMore={feed.isFetchingNextPage}
          onShowMore={() => void feed.fetchNextPage()}
          onEdit={openEdit}
          onDelete={openDelete}
          countryName={countryName}
        />
      ) : (
        <EmployeeTable
          page={pageQuery.data}
          loading={pageQuery.isFetching}
          state={state}
          onChange={handleChange}
          onEdit={openEdit}
          onDelete={openDelete}
          countryName={countryName}
          essentialColumnsOnly={!isDesktop}
        />
      )}

      {/* key 0 means the form has never been opened, so its code is not fetched yet. */}
      {form.key > 0 && (
        <Suspense fallback={null}>
          <EmployeeFormDialog
            key={`form-${form.key}`}
            open={form.open}
            employee={form.employee}
            options={options.data}
            onClose={() => setForm((current) => ({ ...current, open: false }))}
            onSaved={(employee, action) => {
              setForm((current) => ({ ...current, open: false }));
              setMessage({ text: `${employee.fullName} ${action}`, severity: 'success' });
            }}
          />
        </Suspense>
      )}
      <DeleteEmployeeDialog
        open={deletion.open}
        employee={deletion.employee}
        onClose={() => setDeletion((current) => ({ ...current, open: false }))}
        onDeleted={(employee, alreadyGone) => {
          setDeletion((current) => ({ ...current, open: false }));
          setMessage(
            alreadyGone
              ? { text: `${employee.fullName} was already deleted`, severity: 'info' }
              : { text: `${employee.fullName} deleted`, severity: 'success' },
          );
        }}
      />

      <Snackbar
        open={Boolean(message)}
        autoHideDuration={4000}
        onClose={() => setMessage(undefined)}
        anchorOrigin={{ vertical: 'bottom', horizontal: isPhone ? 'center' : 'left' }}
      >
        <Alert
          severity={message?.severity ?? 'success'}
          variant="filled"
          onClose={() => setMessage(undefined)}
          sx={{ width: '100%' }}
        >
          {message?.text}
        </Alert>
      </Snackbar>
    </>
  );
}
