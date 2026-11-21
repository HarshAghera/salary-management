import ExcelJS from 'exceljs';

type WorkbookInput = Parameters<ExcelJS.Workbook['xlsx']['load']>[0];

/**
 * exceljs's typings re-declare the global Buffer as an ArrayBuffer, which no longer
 * matches Node's generic Buffer type. At runtime `load` accepts a Node Buffer, so the
 * cast is confined to this one place rather than scattered through callers.
 */
export function asWorkbookInput(buffer: Buffer): WorkbookInput {
  return buffer as unknown as WorkbookInput;
}
