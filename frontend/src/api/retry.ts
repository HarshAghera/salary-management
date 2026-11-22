import { ApiError } from './client';

/**
 * Whether a failed request is worth repeating. One retry smooths over a dropped connection
 * or a server hiccup; more would only delay telling HR the server is unreachable. Requests
 * the API rejected on purpose (4xx) fail the same way every time, so they are not repeated.
 */
export function shouldRetry(failureCount: number, error: unknown): boolean {
  const temporary = error instanceof ApiError && (error.status === 0 || error.status >= 500);
  return temporary && failureCount < 1;
}
