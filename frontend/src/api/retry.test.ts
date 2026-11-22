import { describe, expect, it } from 'vitest';
import { ApiError } from './client';
import { shouldRetry } from './retry';

describe('shouldRetry', () => {
  it('retries once when the server cannot be reached', () => {
    expect(shouldRetry(0, new ApiError(0, 'Cannot reach the server.'))).toBe(true);
    expect(shouldRetry(1, new ApiError(0, 'Cannot reach the server.'))).toBe(false);
  });

  it('retries once after a server error', () => {
    expect(shouldRetry(0, new ApiError(503, 'Service Unavailable'))).toBe(true);
  });

  it('does not repeat a request the API rejected on purpose', () => {
    expect(shouldRetry(0, new ApiError(400, 'country must be one of: US, GB'))).toBe(false);
    expect(shouldRetry(0, new ApiError(404, 'Employee not found'))).toBe(false);
  });

  it('does not retry unexpected errors such as a bug in the page', () => {
    expect(shouldRetry(0, new TypeError('x is undefined'))).toBe(false);
  });
});
