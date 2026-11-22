/** Hands a downloaded file to the browser to save under the given name. */
export function saveFile(file: Blob, fileName: string): void {
  const url = URL.createObjectURL(file);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.append(link);
  link.click();
  link.remove();
  // Revoke on the next tick: some browsers start the download asynchronously after the click.
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

/** "employees-2026-11-21.xlsx": the day of the export, in the user's own time zone. */
export function exportFileName(today: Date = new Date()): string {
  const day = [today.getFullYear(), today.getMonth() + 1, today.getDate()]
    .map((part) => String(part).padStart(2, '0'))
    .join('-');
  return `employees-${day}.xlsx`;
}
