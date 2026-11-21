import { Alert, Button } from '@mui/material';

interface LoadErrorProps {
  /** What could not be loaded, such as "the salary summary". */
  what: string;
  error: Error;
  onRetry: () => void;
}

/** A failed request, said plainly, with a way to try again. */
export function LoadError({ what, error, onRetry }: LoadErrorProps) {
  return (
    <Alert
      severity="error"
      action={
        <Button color="inherit" onClick={onRetry}>
          Try again
        </Button>
      }
    >
      Could not load {what}. {error.message}
    </Alert>
  );
}
