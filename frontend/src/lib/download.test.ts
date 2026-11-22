import { describe, expect, it } from 'vitest';
import { exportFileName } from './download';

describe('exportFileName', () => {
  it('names the export after the day it was made', () => {
    expect(exportFileName(new Date(2026, 0, 5, 9, 30))).toBe('employees-2026-01-05.xlsx');
  });
});
