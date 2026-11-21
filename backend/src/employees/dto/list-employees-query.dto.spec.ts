import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { ListEmployeesQueryDto } from './list-employees-query.dto';

/** Query strings always arrive as text, so every test feeds strings like the HTTP layer does. */
function parse(query: Record<string, string>) {
  return plainToInstance(ListEmployeesQueryDto, query);
}

async function errorsFor(query: Record<string, string>) {
  const errors = await validate(parse(query));
  return errors.map((e) => e.property);
}

describe('ListEmployeesQueryDto', () => {
  it('applies default paging and sorting when none is given', async () => {
    const dto = parse({});

    expect(await validate(dto)).toEqual([]);
    expect(dto).toMatchObject({ page: 1, pageSize: 25, sortBy: 'fullName', sortOrder: 'asc' });
  });

  it('converts page and page size from text to numbers', () => {
    expect(parse({ page: '3', pageSize: '50' })).toMatchObject({ page: 3, pageSize: 50 });
  });

  it('rejects a page size above 100', async () => {
    expect(await errorsFor({ pageSize: '101' })).toEqual(['pageSize']);
  });

  it('rejects a page below 1', async () => {
    expect(await errorsFor({ page: '0' })).toEqual(['page']);
  });

  it('rejects a page that is not a whole number', async () => {
    expect(await errorsFor({ page: '1.5' })).toEqual(['page']);
  });

  it('rejects a sort field outside the whitelist', async () => {
    expect(await errorsFor({ sortBy: 'email' })).toEqual(['sortBy']);
  });

  it('rejects an unknown sort order', async () => {
    expect(await errorsFor({ sortOrder: 'sideways' })).toEqual(['sortOrder']);
  });

  it('rejects an unknown country', async () => {
    expect(await errorsFor({ country: 'ZZ' })).toEqual(['country']);
  });

  it('normalises the country filter to upper case', () => {
    expect(parse({ country: ' in ' }).country).toBe('IN');
  });

  it('trims the search text', () => {
    expect(parse({ search: '  asha  ' }).search).toBe('asha');
  });
});
