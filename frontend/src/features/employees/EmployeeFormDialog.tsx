import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  InputAdornment,
  MenuItem,
  TextField,
  useMediaQuery,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useState, type FormEvent } from 'react';
import { ApiError } from '../../api/client';
import type { Employee, FilterOptions } from '../../api/types';
import {
  EMPTY_EMPLOYEE_FORM,
  formFromEmployee,
  toEmployeeInput,
  validateEmployeeForm,
  type EmployeeFormErrors,
  type EmployeeFormValues,
} from './employeeForm';
import { useSaveEmployee } from './queries';

interface EmployeeFormDialogProps {
  open: boolean;
  /** The employee being edited; absent when adding a new one. */
  employee?: Employee;
  options: FilterOptions | undefined;
  onClose: () => void;
  onSaved: (employee: Employee, action: 'added' | 'updated') => void;
}

/** Free text with suggestions, so HR can pick an existing value or type a new one. */
function SuggestField({
  label,
  value,
  suggestions,
  error,
  onChange,
}: {
  label: string;
  value: string;
  suggestions: string[];
  error?: string;
  onChange: (value: string) => void;
}) {
  return (
    <Autocomplete
      freeSolo
      options={suggestions}
      inputValue={value}
      onInputChange={(_, text) => onChange(text)}
      renderInput={(params) => (
        <TextField {...params} label={label} required error={Boolean(error)} helperText={error} />
      )}
    />
  );
}

export function EmployeeFormDialog({ open, employee, options, onClose, onSaved }: EmployeeFormDialogProps) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'), { noSsr: true });
  const save = useSaveEmployee();
  const [values, setValues] = useState<EmployeeFormValues>(() =>
    employee ? formFromEmployee(employee) : EMPTY_EMPLOYEE_FORM,
  );
  const [errors, setErrors] = useState<EmployeeFormErrors>({});
  const [formError, setFormError] = useState<string>();

  const editing = Boolean(employee);
  const currency = options?.countries.find((country) => country.code === values.countryCode)?.currency;

  const set = (field: keyof EmployeeFormValues) => (value: string) => {
    setValues((current) => ({ ...current, [field]: value }));
    // A corrected field stops showing its old error straight away.
    setErrors((current) => ({ ...current, [field]: undefined }));
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const found = validateEmployeeForm(values);
    setErrors(found);
    setFormError(undefined);
    if (Object.keys(found).length > 0) return;

    save.mutate(
      { id: employee?.id, input: toEmployeeInput(values) },
      {
        onSuccess: (saved) => onSaved(saved, editing ? 'updated' : 'added'),
        onError: (error) => {
          if (error instanceof ApiError && error.status === 409) {
            setErrors({ email: error.message });
          } else {
            setFormError(error.message);
          }
        },
      },
    );
  };

  const field = (name: keyof EmployeeFormValues) => ({
    value: values[name],
    onChange: (event: { target: { value: string } }) => set(name)(event.target.value),
    error: Boolean(errors[name]),
    helperText: errors[name],
    fullWidth: true,
    required: true,
  });

  return (
    <Dialog
      open={open}
      onClose={save.isPending ? undefined : onClose}
      fullScreen={fullScreen}
      fullWidth
      maxWidth="sm"
      aria-labelledby="employee-form-title"
    >
      {/* The form's own checks replace the browser's, so messages match the API's wording. */}
      <Box
        component="form"
        noValidate
        onSubmit={handleSubmit}
        sx={{ display: 'flex', flexDirection: 'column', minHeight: 0, flex: '1 1 auto' }}
      >
        <DialogTitle id="employee-form-title">{editing ? 'Edit employee' : 'Add employee'}</DialogTitle>
        <DialogContent>
          {formError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {formError}
            </Alert>
          )}
          <Grid container spacing={2} sx={{ pt: 1 }}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField label="Full name" autoComplete="off" autoFocus {...field('fullName')} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField label="Email" type="email" autoComplete="off" {...field('email')} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <SuggestField
                label="Job title"
                value={values.jobTitle}
                suggestions={options?.jobTitles ?? []}
                error={errors.jobTitle}
                onChange={set('jobTitle')}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <SuggestField
                label="Department"
                value={values.department}
                suggestions={options?.departments ?? []}
                error={errors.department}
                onChange={set('department')}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField select label="Country" {...field('countryCode')}>
                {(options?.countries ?? []).map((country) => (
                  <MenuItem key={country.code} value={country.code}>
                    {country.name}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="Annual salary"
                {...field('salary')}
                helperText={errors.salary ?? (currency ? `Paid in ${currency}, set by the country` : 'Currency follows the country')}
                slotProps={{
                  htmlInput: { inputMode: 'decimal' },
                  input: currency
                    ? { startAdornment: <InputAdornment position="start">{currency}</InputAdornment> }
                    : undefined,
                }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField label="Hire date" type="date" {...field('hireDate')} slotProps={{ inputLabel: { shrink: true } }} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={onClose} disabled={save.isPending}>
            Cancel
          </Button>
          <Button type="submit" variant="contained" loading={save.isPending}>
            {editing ? 'Save changes' : 'Add employee'}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}
