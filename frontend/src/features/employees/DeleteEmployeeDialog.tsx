import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from '@mui/material';
import type { Employee } from '../../api/types';
import { isEmployeeGone, useDeleteEmployee } from './queries';

interface DeleteEmployeeDialogProps {
  open: boolean;
  employee: Employee | undefined;
  onClose: () => void;
  /** `alreadyGone` when someone else deleted the employee first: the outcome HR wanted anyway. */
  onDeleted: (employee: Employee, alreadyGone: boolean) => void;
}

/** Deletion is permanent, so it always asks first and names the person. */
export function DeleteEmployeeDialog({ open, employee, onClose, onDeleted }: DeleteEmployeeDialogProps) {
  const remove = useDeleteEmployee();

  const handleDelete = () => {
    if (!employee) return;
    remove.mutate(employee.id, {
      onSuccess: () => onDeleted(employee, false),
      onError: (error) => {
        if (isEmployeeGone(error)) onDeleted(employee, true);
      },
    });
  };

  return (
    <Dialog
      open={open}
      onClose={remove.isPending ? undefined : onClose}
      maxWidth="xs"
      fullWidth
      aria-labelledby="delete-employee-title"
      aria-describedby="delete-employee-description"
      // Start every opening without the previous attempt's error.
      slotProps={{ transition: { onExited: () => remove.reset() } }}
    >
      <DialogTitle id="delete-employee-title">Delete {employee?.fullName}?</DialogTitle>
      <DialogContent>
        {remove.error && !isEmployeeGone(remove.error) && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {remove.error.message}
          </Alert>
        )}
        <DialogContentText id="delete-employee-description">
          Their employee record and salary are removed permanently. This cannot be undone.
        </DialogContentText>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        <Button onClick={onClose} disabled={remove.isPending}>
          Cancel
        </Button>
        <Button variant="contained" color="error" onClick={handleDelete} loading={remove.isPending}>
          Delete
        </Button>
      </DialogActions>
    </Dialog>
  );
}
