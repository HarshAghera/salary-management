import { useMutation } from '@tanstack/react-query';
import { api } from '../../api/client';
import type { DirectoryFilters } from '../../api/types';
import { exportFileName, saveFile } from '../../lib/download';
import { useRefreshAfterEmployeeChange } from '../employees/queries';

export const TEMPLATE_FILE_NAME = 'employee-import-template.xlsx';

export function useDownloadTemplate() {
  return useMutation({
    mutationFn: async () => saveFile(await api.excel.download(api.excel.templateUrl()), TEMPLATE_FILE_NAME),
  });
}

/** Exports the employees matching the given search and filters (all of them when none are set). */
export function useExportEmployees() {
  return useMutation({
    mutationFn: async (filters: DirectoryFilters) =>
      saveFile(await api.excel.download(api.excel.exportUrl(filters)), exportFileName()),
  });
}

/** Imports a workbook; on success the directory and insights reload with the new data. */
export function useImportEmployees() {
  const refresh = useRefreshAfterEmployeeChange();
  return useMutation({
    mutationFn: (file: File) => api.excel.import(file),
    onSuccess: refresh,
  });
}
