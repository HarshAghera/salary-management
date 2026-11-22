import FilterListIcon from '@mui/icons-material/FilterList';
import SearchIcon from '@mui/icons-material/Search';
import { Box, Button, Collapse, InputAdornment, MenuItem, Stack, TextField } from '@mui/material';
import { useEffect, useRef, useState } from 'react';
import type { FilterOptions, SortField, SortOrder } from '../../api/types';
import { activeFilterCount, type DirectoryState } from './directoryState';

/** Long enough to let someone finish typing a name, short enough to feel immediate. */
const SEARCH_DELAY_MS = 300;

const SORT_CHOICES: { value: `${SortField}:${SortOrder}`; label: string }[] = [
  { value: 'fullName:asc', label: 'Name (A to Z)' },
  { value: 'fullName:desc', label: 'Name (Z to A)' },
  { value: 'salary:desc', label: 'Salary (highest first)' },
  { value: 'salary:asc', label: 'Salary (lowest first)' },
  { value: 'hireDate:desc', label: 'Hire date (newest first)' },
  { value: 'hireDate:asc', label: 'Hire date (oldest first)' },
];

interface EmployeeFiltersProps {
  state: DirectoryState;
  options: FilterOptions | undefined;
  onChange: (changes: Partial<DirectoryState>) => void;
  /** Phones fold the filters into a panel and add a sort menu, since cards have no column headers. */
  compact: boolean;
}

function SearchField({
  value,
  onSearch,
  placeholder,
}: {
  value: string;
  onSearch: (search: string) => void;
  placeholder: string;
}) {
  const [text, setText] = useState(value);
  // Held in a ref so a parent re-render (such as results arriving) does not restart the delay.
  const onSearchRef = useRef(onSearch);
  useEffect(() => {
    onSearchRef.current = onSearch;
  });

  // Follow changes made elsewhere, such as "Clear filters" or the back button.
  useEffect(() => setText(value), [value]);

  useEffect(() => {
    if (text === value) return;
    const timer = setTimeout(() => onSearchRef.current(text), SEARCH_DELAY_MS);
    return () => clearTimeout(timer);
  }, [text, value]);

  return (
    <TextField
      type="search"
      value={text}
      onChange={(event) => setText(event.target.value)}
      placeholder={placeholder}
      fullWidth
      slotProps={{
        htmlInput: { 'aria-label': 'Search by name or email', maxLength: 120 },
        input: {
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon fontSize="small" />
            </InputAdornment>
          ),
        },
      }}
    />
  );
}

function FilterSelect({
  label,
  allLabel,
  value,
  choices,
  onSelect,
}: {
  label: string;
  allLabel: string;
  value: string;
  choices: { value: string; label: string }[];
  onSelect: (value: string) => void;
}) {
  // Until the options arrive (or if the address names one no longer in use), keep the chosen
  // value as an option of its own, so the field shows it rather than "All countries".
  const known = !value || choices.some((choice) => choice.value === value);
  const shown = known ? choices : [{ value, label: value }, ...choices];
  const selected = shown.find((choice) => choice.value === value);
  return (
    <TextField
      select
      label={label}
      value={value}
      onChange={(event) => onSelect(event.target.value)}
      fullWidth
      slotProps={{
        // The label always sits on top and the field always names its value, so clearing a
        // filter shows "All countries" rather than an empty box that looks unfinished.
        inputLabel: { shrink: true },
        select: {
          displayEmpty: true,
          renderValue: () =>
            selected ? selected.label : <Box component="span" sx={{ color: 'text.secondary' }}>{allLabel}</Box>,
        },
      }}
    >
      <MenuItem value="">{allLabel}</MenuItem>
      {shown.map((choice) => (
        <MenuItem key={choice.value} value={choice.value}>
          {choice.label}
        </MenuItem>
      ))}
    </TextField>
  );
}

export function EmployeeFilters({ state, options, onChange, compact }: EmployeeFiltersProps) {
  const [panelOpen, setPanelOpen] = useState(false);
  const filterCount = activeFilterCount(state);
  const selectFilterCount = [state.country, state.department, state.jobTitle].filter(Boolean).length;

  const asChoices = (values: string[] = []) => values.map((value) => ({ value, label: value }));
  const selects = (
    <>
      <FilterSelect
        label="Country"
        allLabel="All countries"
        value={state.country}
        choices={(options?.countries ?? []).map((country) => ({ value: country.code, label: country.name }))}
        onSelect={(country) => onChange({ country })}
      />
      <FilterSelect
        label="Department"
        allLabel="All departments"
        value={state.department}
        choices={asChoices(options?.departments)}
        onSelect={(department) => onChange({ department })}
      />
      <FilterSelect
        label="Job title"
        allLabel="All job titles"
        value={state.jobTitle}
        choices={asChoices(options?.jobTitles)}
        onSelect={(jobTitle) => onChange({ jobTitle })}
      />
    </>
  );

  const clearButton = filterCount > 0 && (
    <Button
      onClick={() => onChange({ search: '', country: '', department: '', jobTitle: '' })}
      sx={{ flexShrink: 0, alignSelf: { xs: 'flex-start', sm: 'center' } }}
    >
      Clear filters
    </Button>
  );

  const search = (
    <SearchField
      value={state.search}
      onSearch={(text) => onChange({ search: text })}
      // The full hint does not fit beside the Filters button on a 360 px phone; the accessible label keeps it.
      placeholder={compact ? 'Name or email' : 'Search by name or email'}
    />
  );

  if (compact) {
    return (
      <Stack spacing={1.5} sx={{ mb: 2 }}>
        <Stack direction="row" spacing={1}>
          {search}
          <Button
            variant="outlined"
            onClick={() => setPanelOpen((open) => !open)}
            aria-expanded={panelOpen}
            aria-controls="employee-filter-panel"
            sx={{ flexShrink: 0, px: 1.5 }}
            startIcon={<FilterListIcon />}
          >
            {selectFilterCount > 0 ? `Filters (${selectFilterCount})` : 'Filters'}
          </Button>
        </Stack>
        <Collapse in={panelOpen} id="employee-filter-panel">
          <Stack spacing={2} sx={{ pt: 1 }}>
            {selects}
            <TextField
              select
              label="Sort by"
              value={`${state.sortBy}:${state.sortOrder}`}
              onChange={(event) => {
                const [sortBy, sortOrder] = event.target.value.split(':') as [SortField, SortOrder];
                onChange({ sortBy, sortOrder });
              }}
              fullWidth
            >
              {SORT_CHOICES.map((choice) => (
                <MenuItem key={choice.value} value={choice.value}>
                  {choice.label}
                </MenuItem>
              ))}
            </TextField>
          </Stack>
        </Collapse>
        {clearButton}
      </Stack>
    );
  }

  return (
    <Box
      sx={{
        mb: 2.5,
        display: 'grid',
        gap: 1.5,
        alignItems: 'center',
        // Tablets: search on its own row above the three filters. Desktops: one row.
        gridTemplateColumns: { xs: 'repeat(3, minmax(0, 1fr))', lg: 'minmax(260px, 2fr) repeat(3, minmax(0, 1fr)) auto' },
        '& > :first-of-type': { gridColumn: { xs: '1 / -1', lg: 'auto' } },
      }}
    >
      {search}
      {selects}
      {clearButton || <Box sx={{ display: { xs: 'none', lg: 'block' } }} />}
    </Box>
  );
}
