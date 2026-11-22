import { describe, expect, it } from 'vitest';
import { checkImportFile, formatFileSize, MAX_IMPORT_BYTES } from './importFile';

function fileOf(name: string, bytes: number): File {
  return new File([new Uint8Array(bytes)], name);
}

describe('checkImportFile', () => {
  it('accepts an .xlsx file within the size limit', () => {
    expect(checkImportFile(fileOf('employees.xlsx', 2048))).toBeUndefined();
  });

  it('accepts the extension in any letter case', () => {
    expect(checkImportFile(fileOf('EMPLOYEES.XLSX', 2048))).toBeUndefined();
  });

  it('rejects a CSV or older Excel file', () => {
    expect(checkImportFile(fileOf('employees.csv', 2048))).toMatch(/not an \.xlsx file/);
    expect(checkImportFile(fileOf('employees.xls', 2048))).toMatch(/not an \.xlsx file/);
  });

  it('rejects a file over 1 MB', () => {
    expect(checkImportFile(fileOf('employees.xlsx', MAX_IMPORT_BYTES + 1))).toMatch(/larger than 1 MB/);
  });

  it('rejects an empty file', () => {
    expect(checkImportFile(fileOf('employees.xlsx', 0))).toMatch(/is empty/);
  });
});

describe('formatFileSize', () => {
  it('shows small files in kilobytes', () => {
    expect(formatFileSize(84 * 1024)).toBe('84 KB');
  });

  it('shows larger files in megabytes', () => {
    expect(formatFileSize(1.25 * 1024 * 1024)).toBe('1.3 MB');
  });
});
