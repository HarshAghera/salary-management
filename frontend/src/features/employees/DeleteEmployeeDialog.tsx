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
import { useDeleteEmployee } from './queries';

interface DeleteEmployeeDialogProps {
  open: boolean;
  employee: Employee | undefined;
  onClose: () => void;
  onDeleted: (employee: Employee) => void;
}

/** Deletion is permanent, so it always asks first and names the person. */
export function DeleteEmployeeDialog({ open, employee, onClose, onDeleted }: DeleteEmployeeDialogProps) {
  const remove = useDeleteEmployee();

  const handleDelete = () => {
    if (!employee) return;
    remove.mutate(employee.id, { onSuccess: () => onDeleted(employee) });
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
        {remove.error && (
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
