import { ConflictException } from '@nestjs/common';
import { DataSource, QueryFailedError } from 'typeorm';
import { Employee } from '../src/employees/employee.entity';
import { EmployeesRepository } from '../src/employees/employees.repository';
import { EmployeesService } from '../src/employees/employees.service';
import { insertEmployees, newEmployee, newEmployeeInput } from './support/fixtures';
import { createTestDataSource, emptyEmployees } from './support/test-database';

/** Postgres error code for the given failure, or undefined if it was not a database error. */
async function databaseErrorCode(action: Promise<unknown>): Promise<string | undefined> {
  const error = await action.then(
    () => undefined,
    (e: unknown) => e,
  );
  return error instanceof QueryFailedError ? (error.driverError as { code?: string }).code : undefined;
}

describe('Employee persistence against PostgreSQL', () => {
  let dataSource: DataSource;
  let employees: EmployeesService;

  beforeAll(async () => {
    dataSource = await createTestDataSource();
    employees = new EmployeesService(new EmployeesRepository(dataSource.getRepository(Employee)));
  });

  beforeEach(() => emptyEmployees(dataSource));

  afterAll(() => dataSource?.destroy());

  it('stores decimal salaries exactly, up to the largest allowed amount', async () => {
    const small = await employees.create(newEmployeeInput({ salary: 85000.5 }));
    const largest = await employees.create(newEmployeeInput({ salary: 9999999999.99 }));

    expect((await employees.findOne(small.id)).salary).toBe(85000.5);
    expect((await employees.findOne(largest.id)).salary).toBe(9999999999.99);
  });

  it('derives and stores the currency from the country', async () => {
    const created = await employees.create(newEmployeeInput({ countryCode: 'JP' }));

    expect((await employees.findOne(created.id)).currency).toBe('JPY');
  });

  it('rejects a duplicate email with a conflict', async () => {
    await employees.create(newEmployeeInput({ email: 'asha@acme.com' }));

    await expect(employees.create(newEmployeeInput({ email: 'asha@acme.com' }))).rejects.toBeInstanceOf(
      ConflictException,
    );
  });

  it('enforces case-insensitive email uniqueness in the database itself', async () => {
    await insertEmployees(dataSource, [newEmployee({ email: 'asha@acme.com' })]);

    const code = await databaseErrorCode(insertEmployees(dataSource, [newEmployee({ email: 'ASHA@acme.com' })]));

    expect(code).toBe('23505'); // unique_violation
  });

  it('rejects a salary of zero in the database itself', async () => {
    const code = await databaseErrorCode(insertEmployees(dataSource, [newEmployee({ salary: 0 })]));

    expect(code).toBe('23514'); // check_violation
  });
});
