import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import { Card, Stack, Typography } from '@mui/material';
import {
  DataGrid,
  GridActionsCellItem,
  type GridColDef,
  type GridPaginationModel,
  type GridSortModel,
} from '@mui/x-data-grid';
import { useMemo } from 'react';
import type { Employee, EmployeePage, SortField } from '../../api/types';
import { formatCount, formatDate, formatMoney } from '../../lib/format';
import { PAGE_SIZE_OPTIONS, type DirectoryState } from './directoryState';

interface EmployeeTableProps {
  page: EmployeePage | undefined;
  loading: boolean;
  state: DirectoryState;
  onChange: (changes: Partial<DirectoryState>) => void;
  onEdit: (employee: Employee) => void;
  onDelete: (employee: Employee) => void;
  countryName: (code: string) => string;
  /** Tablets show the essential columns only (docs/architecture.md, responsive layout). */
  essentialColumnsOnly: boolean;
}

export function EmployeeTable({
  page,
  loading,
  state,
  onChange,
  onEdit,
  onDelete,
  countryName,
  essentialColumnsOnly,
}: EmployeeTableProps) {
  // Only name, salary and hire date are sortable, matching the API's sort whitelist.
  const columns = useMemo<GridColDef<Employee>[]>(
    () => [
      {
        field: 'fullName',
        headerName: 'Name',
        flex: 1.6,
        minWidth: 200,
        renderCell: ({ row }) => (
          <Stack sx={{ justifyContent: 'center', height: '100%', minWidth: 0 }}>
            <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>
              {row.fullName}
            </Typography>
            <Typography variant="caption" color="text.secondary" noWrap>
              {row.email}
            </Typography>
          </Stack>
        ),
      },
      // Minimum widths are chosen so the tablet columns fit 768 px without scrolling sideways.
      { field: 'jobTitle', headerName: 'Job title', flex: 1.1, minWidth: 140, sortable: false },
      { field: 'department', headerName: 'Department', flex: 1, minWidth: 130, sortable: false },
      {
        field: 'countryCode',
        headerName: 'Country',
        flex: 0.9,
        minWidth: 120,
        sortable: false,
        valueGetter: (code: string) => countryName(code),
      },
      {
        field: 'salary',
        headerName: 'Salary',
        type: 'number',
        flex: 0.9,
        minWidth: 120,
        valueFormatter: (salary: number, row) => formatMoney(salary, row.currency),
        cellClassName: 'salary-cell',
      },
      {
        field: 'hireDate',
        headerName: 'Hire date',
        flex: 0.8,
        minWidth: 120,
        valueFormatter: (value: string) => formatDate(value),
      },
      {
        field: 'actions',
        type: 'actions',
        headerName: 'Actions',
        width: 100,
        getActions: ({ row }) => [
          <GridActionsCellItem
            key="edit"
            icon={<EditOutlinedIcon />}
            label={`Edit ${row.fullName}`}
            onClick={() => onEdit(row)}
          />,
          <GridActionsCellItem
            key="delete"
            icon={<DeleteOutlineIcon />}
            label={`Delete ${row.fullName}`}
            onClick={() => onDelete(row)}
          />,
        ],
      },
    ],
    [countryName, onEdit, onDelete],
  );

  // Both models keep their identity until their values change. The grid treats a new sort
  // model as a new sort and jumps back to the first page, so rebuilding it on every render
  // would undo every page change.
  const paginationModel = useMemo<GridPaginationModel>(
    () => ({ page: state.page - 1, pageSize: state.pageSize }),
    [state.page, state.pageSize],
  );
  const sortModel = useMemo<GridSortModel>(
    () => [{ field: state.sortBy, sort: state.sortOrder }],
    [state.sortBy, state.sortOrder],
  );

  return (
    <Card>
      <DataGrid
        rows={page?.items ?? []}
        columns={columns}
        rowCount={page?.total ?? 0}
        loading={loading}
        paginationMode="server"
        sortingMode="server"
        paginationModel={paginationModel}
        onPaginationModelChange={(model) => {
          // The grid can echo the current page back; only a real change becomes navigation.
          if (model.page === paginationModel.page && model.pageSize === paginationModel.pageSize) return;
          onChange({ page: model.page + 1, pageSize: model.pageSize });
        }}
        pageSizeOptions={PAGE_SIZE_OPTIONS}
        sortModel={sortModel}
        // Always sorted: clicking a sorted header flips the direction instead of removing the sort.
        sortingOrder={['asc', 'desc']}
        onSortModelChange={([sort]) => {
          if (!sort?.sort || (sort.field === state.sortBy && sort.sort === state.sortOrder)) return;
          onChange({ sortBy: sort.field as SortField, sortOrder: sort.sort });
        }}
        columnVisibilityModel={{ department: !essentialColumnsOnly, hireDate: !essentialColumnsOnly }}
        rowHeight={64}
        autoHeight
        // A page holds at most 100 rows, so every row can be rendered; this also keeps tests simple.
        disableVirtualization
        disableColumnMenu
        disableColumnFilter
        // Columns size themselves to the screen, so there is nothing to resize.
        disableColumnResize
        disableRowSelectionOnClick
        localeText={{
          noRowsLabel: 'No employees match your search and filters',
          paginationDisplayedRows: ({ from, to, count }) =>
            `${formatCount(from)}–${formatCount(to)} of ${formatCount(count)}`,
        }}
        sx={{
          border: 0,
          '--DataGrid-containerBackground': 'transparent',
          '& .MuiDataGrid-columnHeaderTitle': { fontWeight: 600, color: 'text.secondary' },
          // The header's bottom border already separates it; the divider after the last column
          // also stuck out of the grid and caused a few pixels of sideways scroll.
          '& .MuiDataGrid-columnSeparator': { display: 'none' },
          '& .salary-cell': { fontWeight: 600, fontVariantNumeric: 'tabular-nums' },
          // Rows-per-page is a touch target like any other control (44 px, CLAUDE.md).
          '& .MuiTablePagination-input': { minHeight: 44 },
          '& .MuiTablePagination-select': { display: 'flex', alignItems: 'center', minHeight: 44, boxSizing: 'border-box' },
          '& .MuiDataGrid-cell:focus, & .MuiDataGrid-columnHeader:focus': { outline: 'none' },
          '& .MuiDataGrid-cell:focus-visible, & .MuiDataGrid-columnHeader:focus-visible': {
            outline: '2px solid',
            outlineColor: 'primary.main',
            outlineOffset: -2,
          },
        }}
      />
    </Card>
  );
}
