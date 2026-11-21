import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router';
import {
  addsHistoryEntry,
  applyDirectoryChange,
  readDirectoryState,
  writeDirectoryState,
  type DirectoryState,
} from './directoryState';

/**
 * The directory's search, filters, sort and page, kept in the address bar so a view can be
 * bookmarked or shared and survives a refresh. Paging, filter and sort changes become
 * history entries the browser's Back and Forward step through; typing in search does not.
 */
export function useDirectoryState(): [DirectoryState, (changes: Partial<DirectoryState>) => void] {
  const [params, setParams] = useSearchParams();
  const state = useMemo(() => readDirectoryState(params), [params]);

  const update = useCallback(
    (changes: Partial<DirectoryState>) => {
      setParams((current) => writeDirectoryState(applyDirectoryChange(readDirectoryState(current), changes)), {
        replace: !addsHistoryEntry(changes),
      });
    },
    [setParams],
  );

  return [state, update];
}
