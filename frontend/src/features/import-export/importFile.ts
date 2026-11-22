/** The API's limits (backend excel-columns.ts), repeated here so a wrong file fails before uploading. */
export const MAX_IMPORT_BYTES = 1024 * 1024;
export const MAX_IMPORT_ROWS = 1000;

/** Problems the browser can spot without uploading; the API checks everything else. */
export function checkImportFile(file: File): string | undefined {
  if (!file.name.toLowerCase().endsWith('.xlsx')) {
    return `"${file.name}" is not an .xlsx file. Save it as an Excel workbook (.xlsx) and choose it again.`;
  }
  if (file.size > MAX_IMPORT_BYTES) {
    return `"${file.name}" is larger than 1 MB. Split it into smaller files of up to ${MAX_IMPORT_ROWS.toLocaleString('en-US')} rows.`;
  }
  if (file.size === 0) {
    return `"${file.name}" is empty. Download the template to see the expected columns.`;
  }
  return undefined;
}

/** "84 KB" or "1.2 MB", for showing the chosen file. */
export function formatFileSize(bytes: number): string {
  return bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
