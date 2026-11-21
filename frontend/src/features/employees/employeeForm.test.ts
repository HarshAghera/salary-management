import { describe, expect, it } from 'vitest';
import { EMPTY_EMPLOYEE_FORM, toEmployeeInput, validateEmployeeForm, type EmployeeFormValues } from './employeeForm';

const valid: EmployeeFormValues = {
  fullName: 'Priya Nair',
  email: 'priya.nair@acme.com',
  jobTitle: 'Software Engineer',
  department: 'Engineering',
  countryCode: 'IN',
  salary: '2450000',
  hireDate: '2021-03-01',
};

describe('validateEmployeeForm', () => {
  it('accepts a complete employee', () => {
    expect(validateEmployeeForm(valid)).toEqual({});
  });

  it('asks for every required field on an empty form', () => {
    const errors = validateEmployeeForm(EMPTY_EMPLOYEE_FORM);

    expect(Object.keys(errors).sort()).toEqual(
      ['countryCode', 'department', 'email', 'fullName', 'hireDate', 'jobTitle', 'salary'].sort(),
    );
  });

  it('rejects an email address without a domain', () => {
    expect(validateEmployeeForm({ ...valid, email: 'priya@' }).email).toMatch(/valid email/);
  });

  it('rejects a negative salary', () => {
    expect(validateEmployeeForm({ ...valid, salary: '-100' }).salary).toMatch(/above zero/);
  });

  it('rejects a salary of zero', () => {
    expect(validateEmployeeForm({ ...valid, salary: '0' }).salary).toBe('Enter a salary above zero');
  });

  it('rejects more than two decimal places', () => {
    expect(validateEmployeeForm({ ...valid, salary: '85000.505' }).salary).toBe('Use at most two decimal places');
  });

  it('accepts a salary with cents and thousands separators', () => {
    expect(validateEmployeeForm({ ...valid, salary: '85,000.50' }).salary).toBeUndefined();
  });

  it('rejects a date that is not on the calendar', () => {
    expect(validateEmployeeForm({ ...valid, hireDate: '2023-02-30' }).hireDate).toBe('Enter a real date');
  });

  it('rejects a name longer than the API allows', () => {
    expect(validateEmployeeForm({ ...valid, fullName: 'a'.repeat(121) }).fullName).toMatch(/at most 120/);
  });
});

describe('toEmployeeInput', () => {
  it('trims text, lower-cases the email and turns the salary into a number', () => {
    const input = toEmployeeInput({ ...valid, fullName: ' Priya Nair ', email: 'Priya.Nair@ACME.com', salary: '85,000.50' });

    expect(input).toEqual({ ...valid, fullName: 'Priya Nair', email: 'priya.nair@acme.com', salary: 85000.5 });
  });
});
