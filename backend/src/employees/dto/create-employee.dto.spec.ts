import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateEmployeeDto } from './create-employee.dto';
import { UpdateEmployeeDto } from './update-employee.dto';

const validPayload = {
  fullName: 'Asha Rao',
  email: 'asha.rao@acme.com',
  jobTitle: 'Software Engineer',
  department: 'Engineering',
  countryCode: 'IN',
  salary: 1800000,
  hireDate: '2022-04-18',
};

async function errorsFor(payload: Record<string, unknown>) {
  const dto = plainToInstance(CreateEmployeeDto, payload);
  const errors = await validate(dto);
  return errors.map((e) => e.property);
}

describe('CreateEmployeeDto', () => {
  it('accepts a valid employee', async () => {
    expect(await errorsFor(validPayload)).toEqual([]);
  });

  it('requires every field', async () => {
    const properties = await errorsFor({});
    expect(properties.sort()).toEqual(
      ['countryCode', 'department', 'email', 'fullName', 'hireDate', 'jobTitle', 'salary'].sort(),
    );
  });

  it('rejects a negative salary', async () => {
    expect(await errorsFor({ ...validPayload, salary: -1 })).toEqual(['salary']);
  });

  it('rejects a zero salary', async () => {
    expect(await errorsFor({ ...validPayload, salary: 0 })).toEqual(['salary']);
  });

  it('accepts a salary with two decimals', async () => {
    expect(await errorsFor({ ...validPayload, salary: 85000.5 })).toEqual([]);
  });

  it('rejects a salary with more than two decimals', async () => {
    expect(await errorsFor({ ...validPayload, salary: 100.123 })).toEqual(['salary']);
  });

  it('rejects a salary supplied as a string', async () => {
    expect(await errorsFor({ ...validPayload, salary: '1000' })).toEqual(['salary']);
  });

  it('rejects an invalid email', async () => {
    expect(await errorsFor({ ...validPayload, email: 'not-an-email' })).toEqual(['email']);
  });

  it('rejects an unknown country', async () => {
    expect(await errorsFor({ ...validPayload, countryCode: 'ZZ' })).toEqual(['countryCode']);
  });

  it('normalises country code and email casing', () => {
    const dto = plainToInstance(CreateEmployeeDto, {
      ...validPayload,
      countryCode: ' in ',
      email: '  Asha.Rao@ACME.com ',
    });
    expect(dto.countryCode).toBe('IN');
    expect(dto.email).toBe('asha.rao@acme.com');
  });

  it('rejects a hire date that is not a real calendar date', async () => {
    expect(await errorsFor({ ...validPayload, hireDate: '2022-02-30' })).toEqual(['hireDate']);
  });

  it('rejects a hire date in the wrong format', async () => {
    expect(await errorsFor({ ...validPayload, hireDate: '18/04/2022' })).toContain('hireDate');
  });
});

describe('UpdateEmployeeDto', () => {
  it('accepts a partial update', async () => {
    const errors = await validate(plainToInstance(UpdateEmployeeDto, { salary: 2000000 }));
    expect(errors).toEqual([]);
  });

  it('still validates the fields that are present', async () => {
    const errors = await validate(plainToInstance(UpdateEmployeeDto, { salary: -5 }));
    expect(errors.map((e) => e.property)).toEqual(['salary']);
  });
});
