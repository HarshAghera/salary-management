import { DataSource } from 'typeorm';
import { ListEmployeesQueryDto } from '../src/employees/dto/list-employees-query.dto';
import { Employee } from '../src/employees/employee.entity';
import { EmployeesRepository } from '../src/employees/employees.repository';
import { EmployeesService } from '../src/employees/employees.service';
import { insertEmployees, newEmployee } from './support/fixtures';
import { createTestDataSource, emptyEmployees } from './support/test-database';

const query = (overrides: Partial<ListEmployeesQueryDto> = {}) =>
  Object.assign(new ListEmployeesQueryDto(), overrides);

describe('Employee directory against PostgreSQL', () => {
  let dataSource: DataSource;
  let employees: EmployeesService;

  beforeAll(async () => {
    dataSource = await createTestDataSource();
    employees = new EmployeesService(new EmployeesRepository(dataSource.getRepository(Employee)));
  });

  beforeEach(() => emptyEmployees(dataSource));

  afterAll(() => dataSource?.destroy());

  it('combines country, department and job title filters', async () => {
    await insertEmployees(dataSource, [
      newEmployee({ fullName: 'Match', countryCode: 'IN', department: 'Engineering', jobTitle: 'QA Engineer' }),
      newEmployee({ countryCode: 'GB', department: 'Engineering', jobTitle: 'QA Engineer' }),
      newEmployee({ countryCode: 'IN', department: 'Finance', jobTitle: 'QA Engineer' }),
      newEmployee({ countryCode: 'IN', department: 'Engineering', jobTitle: 'Software Engineer' }),
    ]);

    const page = await employees.list(query({ country: 'IN', department: 'Engineering', jobTitle: 'QA Engineer' }));

    expect(page.total).toBe(1);
    expect(page.items.map((e) => e.fullName)).toEqual(['Match']);
  });

  it('searches names and emails without regard to letter case', async () => {
    await insertEmployees(dataSource, [
      newEmployee({ fullName: 'Asha Rao', email: 'asha@acme.com' }),
      newEmployee({ fullName: 'Ben Carter', email: 'ben.ASHA.c@acme.com' }),
      newEmployee({ fullName: 'Chloe Kim', email: 'chloe@acme.com' }),
    ]);

    const page = await employees.list(query({ search: 'aSHa' }));

    expect(page.items.map((e) => e.fullName)).toEqual(['Asha Rao', 'Ben Carter']);
  });

  it('matches % and _ in the search text literally', async () => {
    await insertEmployees(dataSource, [
      newEmployee({ fullName: 'Chloe 50% Kim', email: 'chloe@acme.com' }),
      newEmployee({ fullName: 'Plain 500 Name', email: 'plain@acme.com' }),
      newEmployee({ fullName: 'Under Score', email: 'a_b@acme.com' }),
      newEmployee({ fullName: 'No Score', email: 'axb@acme.com' }),
    ]);

    expect((await employees.list(query({ search: '50%' }))).items.map((e) => e.fullName)).toEqual(['Chloe 50% Kim']);
    expect((await employees.list(query({ search: 'a_b' }))).items.map((e) => e.fullName)).toEqual(['Under Score']);
    expect((await employees.list(query({ search: '%' }))).total).toBe(1);
  });

  it('sorts by salary in either direction, comparing amounts numerically', async () => {
    await insertEmployees(dataSource, [
      newEmployee({ fullName: 'Nine', salary: 9000 }),
      newEmployee({ fullName: 'Hundred', salary: 100000.5 }),
      newEmployee({ fullName: 'Ten', salary: 10000 }),
    ]);

    const ascending = await employees.list(query({ sortBy: 'salary', sortOrder: 'asc' }));
    const descending = await employees.list(query({ sortBy: 'salary', sortOrder: 'desc' }));

    expect(ascending.items.map((e) => e.fullName)).toEqual(['Nine', 'Ten', 'Hundred']);
    expect(descending.items.map((e) => e.fullName)).toEqual(['Hundred', 'Ten', 'Nine']);
  });

  it('pages through tied sort values without repeating or skipping anyone', async () => {
    await insertEmployees(dataSource, Array.from({ length: 5 }, () => newEmployee({ salary: 50000 })));

    const pages = await Promise.all(
      [1, 2, 3].map((page) => employees.list(query({ sortBy: 'salary', page, pageSize: 2 }))),
    );
    const ids = pages.flatMap((page) => page.items.map((e) => e.id));

    expect(pages.map((page) => page.total)).toEqual([5, 5, 5]);
    expect(pages.map((page) => page.items.length)).toEqual([2, 2, 1]);
    expect(new Set(ids).size).toBe(5);
  });

  it('lists the departments and job titles in use, sorted and without duplicates', async () => {
    await insertEmployees(dataSource, [
      newEmployee({ department: 'Sales', jobTitle: 'Account Executive' }),
      newEmployee({ department: 'Engineering', jobTitle: 'Software Engineer' }),
      newEmployee({ department: 'Engineering', jobTitle: 'Software Engineer' }),
    ]);

    const options = await employees.filterOptions();

    expect(options.departments).toEqual(['Engineering', 'Sales']);
    expect(options.jobTitles).toEqual(['Account Executive', 'Software Engineer']);
  });
});
