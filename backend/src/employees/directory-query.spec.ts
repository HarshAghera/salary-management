import { SORT_COLUMNS, SORT_FIELDS, escapeLike } from './directory-query';

describe('escapeLike', () => {
  it('escapes LIKE wildcards so they match literally', () => {
    expect(escapeLike('50%_off')).toBe('50\\%\\_off');
  });

  it('escapes the escape character itself', () => {
    expect(escapeLike('a\\b')).toBe('a\\\\b');
  });

  it('leaves ordinary text unchanged', () => {
    expect(escapeLike('asha.rao@acme.com')).toBe('asha.rao@acme.com');
  });
});

describe('SORT_COLUMNS', () => {
  it('maps every allowed sort field to a column', () => {
    for (const field of SORT_FIELDS) {
      expect(SORT_COLUMNS[field]).toMatch(/^e\.\w+$/);
    }
  });
});
