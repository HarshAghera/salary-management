import type { Employee, EmployeeInput } from '../../api/types';

/** What the form holds while the user types. Salary stays text until it is sent. */
export interface EmployeeFormValues {
  fullName: string;
  email: string;
  jobTitle: string;
  department: string;
  countryCode: string;
  salary: string;
  hireDate: string;
}

export type EmployeeFormErrors = Partial<Record<keyof EmployeeFormValues, string>>;

export const EMPTY_EMPLOYEE_FORM: EmployeeFormValues = {
  fullName: '',
  email: '',
  jobTitle: '',
  department: '',
  countryCode: '',
  salary: '',
  hireDate: '',
};

/** Same limits as the API's CreateEmployeeDto, so most mistakes are caught before sending. */
const MAX_TEXT = 120;
const MAX_EMAIL = 254;
const MAX_SALARY = 9_999_999_999.99;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MONEY = /^\d+(\.\d{1,2})?$/;
const DATE = /^\d{4}-\d{2}-\d{2}$/;

export function formFromEmployee(employee: Employee): EmployeeFormValues {
  return {
    fullName: employee.fullName,
    email: employee.email,
    jobTitle: employee.jobTitle,
    department: employee.department,
    countryCode: employee.countryCode,
    salary: String(employee.salary),
    hireDate: employee.hireDate,
  };
}

function isCalendarDate(value: string): boolean {
  if (!DATE.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

function requiredText(value: string, missing: string, label: string): string | undefined {
  if (!value.trim()) return missing;
  if (value.trim().length > MAX_TEXT) return `${label} must be at most ${MAX_TEXT} characters`;
  return undefined;
}

function salaryError(value: string): string | undefined {
  const text = value.trim().replace(/,/g, '');
  if (!text) return 'Enter a salary';
  if (!MONEY.test(text)) {
    return /^\d+\.\d{3,}$/.test(text) ? 'Use at most two decimal places' : 'Enter a salary above zero, for example 85000.50';
  }
  const amount = Number(text);
  if (amount <= 0) return 'Enter a salary above zero';
  if (amount > MAX_SALARY) return 'Salary is too large';
  return undefined;
}

export function validateEmployeeForm(values: EmployeeFormValues): EmployeeFormErrors {
  const email = values.email.trim();
  const errors: EmployeeFormErrors = {
    fullName: requiredText(values.fullName, "Enter the employee's full name", 'Full name'),
    email: !email
      ? 'Enter an email address'
      : !EMAIL.test(email) || email.length > MAX_EMAIL
        ? 'Enter a valid email address, for example priya.nair@acme.com'
        : undefined,
    jobTitle: requiredText(values.jobTitle, 'Enter a job title', 'Job title'),
    department: requiredText(values.department, 'Enter a department', 'Department'),
    countryCode: values.countryCode ? undefined : 'Choose a country',
    salary: salaryError(values.salary),
    hireDate: !values.hireDate
      ? 'Enter the hire date'
      : isCalendarDate(values.hireDate)
        ? undefined
        : 'Enter a real date',
  };
  return Object.fromEntries(Object.entries(errors).filter(([, message]) => message));
}

/** Converts valid form values into what the API expects. Call only after validation passes. */
export function toEmployeeInput(values: EmployeeFormValues): EmployeeInput {
  return {
    fullName: values.fullName.trim(),
    email: values.email.trim().toLowerCase(),
    jobTitle: values.jobTitle.trim(),
    department: values.department.trim(),
    countryCode: values.countryCode,
    salary: Number(values.salary.trim().replace(/,/g, '')),
    hireDate: values.hireDate,
  };
}
