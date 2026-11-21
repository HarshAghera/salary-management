import { ValueTransformer } from 'typeorm';

/**
 * Postgres returns `numeric` as a string. Salaries have at most two decimals and
 * stay well inside the safe-integer range, so parsing is exact; all arithmetic
 * (averages, medians) happens in SQL, never on these JS numbers (ADR-5, ADR-6).
 */
export const numericTransformer: ValueTransformer = {
  to: (value?: number | null) => value,
  from: (value?: string | null) => (value === null || value === undefined ? value : Number(value)),
};
