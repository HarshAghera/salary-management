import { describe, expect, it } from 'vitest';
import {
  activeFilterCount,
  addsHistoryEntry,
  applyDirectoryChange,
  DEFAULT_DIRECTORY_STATE,
  readDirectoryState,
  toDirectoryParams,
  writeDirectoryState,
} from './directoryState';

describe('readDirectoryState', () => {
  it('uses the defaults for a bare address', () => {
    expect(readDirectoryState(new URLSearchParams())).toEqual(DEFAULT_DIRECTORY_STATE);
  });

  it('reads search, filters, sort and paging from the address', () => {
    const state = readDirectoryState(
      new URLSearchParams('page=3&pageSize=50&search=nair&country=IN&department=Engineering&sortBy=salary&sortOrder=desc'),
    );

    expect(state).toMatchObject({
      page: 3,
      pageSize: 50,
      search: 'nair',
      country: 'IN',
      department: 'Engineering',
      sortBy: 'salary',
      sortOrder: 'desc',
    });
  });

  it('falls back to defaults for values edited into nonsense', () => {
    const state = readDirectoryState(new URLSearchParams('page=-2&pageSize=7&sortBy=password&sortOrder=up'));

    expect(state).toMatchObject({ page: 1, pageSize: 25, sortBy: 'fullName', sortOrder: 'asc' });
  });
});

describe('writeDirectoryState', () => {
  it('leaves defaults out of the address', () => {
    const params = writeDirectoryState({ ...DEFAULT_DIRECTORY_STATE, country: 'IN' });

    expect(params.toString()).toBe('country=IN');
  });

  it('round-trips through the address', () => {
    const state = { ...DEFAULT_DIRECTORY_STATE, page: 2, search: 'a&b', sortBy: 'hireDate' as const };

    expect(readDirectoryState(writeDirectoryState(state))).toEqual(state);
  });
});

describe('applyDirectoryChange', () => {
  it('goes back to the first page when a filter changes', () => {
    const next = applyDirectoryChange({ ...DEFAULT_DIRECTORY_STATE, page: 4 }, { country: 'GB' });

    expect(next).toMatchObject({ page: 1, country: 'GB' });
  });

  it('keeps the requested page when paging', () => {
    const next = applyDirectoryChange(DEFAULT_DIRECTORY_STATE, { page: 3 });

    expect(next.page).toBe(3);
  });
});

describe('addsHistoryEntry', () => {
  it('records paging, filters and sort as steps Back can return to', () => {
    expect(addsHistoryEntry({ page: 2 })).toBe(true);
    expect(addsHistoryEntry({ country: 'IN' })).toBe(true);
    expect(addsHistoryEntry({ sortBy: 'salary', sortOrder: 'desc' })).toBe(true);
  });

  it('does not record typing in the search box', () => {
    expect(addsHistoryEntry({ search: 'nair' })).toBe(false);
  });

  it('records clearing search and filters together as one step', () => {
    expect(addsHistoryEntry({ search: '', country: '', department: '', jobTitle: '' })).toBe(true);
  });
});

describe('toDirectoryParams', () => {
  it('leaves out empty filters and trims the search', () => {
    const params = toDirectoryParams({ ...DEFAULT_DIRECTORY_STATE, search: '  nair ' });

    expect(params).toEqual({ page: 1, pageSize: 25, search: 'nair', sortBy: 'fullName', sortOrder: 'asc' });
  });
});

describe('activeFilterCount', () => {
  it('counts search and each filter in use', () => {
    expect(activeFilterCount({ ...DEFAULT_DIRECTORY_STATE, search: 'x', jobTitle: 'Analyst' })).toBe(2);
  });

  it('ignores a search of only spaces', () => {
    expect(activeFilterCount({ ...DEFAULT_DIRECTORY_STATE, search: '   ' })).toBe(0);
  });
});
