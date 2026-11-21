import { COUNTRY_CODES, currencyForCountry } from '../../common/countries';
import { generateEmployees, salaryBand } from './employee-generator';
import { DEPARTMENTS } from './salary-bands';

describe('generateEmployees', () => {
  const SEED = 42;
  // Generated once: the generator is pure, and 2,000 rows cover every country and title.
  const employees = generateEmployees(2000, SEED);

  it('generates the requested number of employees', () => {
    expect(generateEmployees(25, SEED)).toHaveLength(25);
  });

  it('produces identical data for the same seed', () => {
    expect(generateEmployees(50, SEED)).toEqual(generateEmployees(50, SEED));
  });

  it('produces different data for a different seed', () => {
    expect(generateEmployees(50, SEED)).not.toEqual(generateEmployees(50, SEED + 1));
  });

  it('gives every employee a unique, lower-case email', () => {
    const emails = employees.map((e) => e.email);

    expect(new Set(emails).size).toBe(emails.length);
    expect(emails.every((email) => email === email.toLowerCase())).toBe(true);
  });

  it('derives the currency from the country', () => {
    expect(employees.every((e) => e.currency === currencyForCountry(e.countryCode))).toBe(true);
  });

  it('pairs every job title with its own department', () => {
    const titlesByDepartment = new Map(DEPARTMENTS.map((d) => [d.name, d.titles.map((t) => t.title)]));

    expect(employees.every((e) => titlesByDepartment.get(e.department)?.includes(e.jobTitle))).toBe(true);
  });

  it('keeps every salary positive, whole and inside its country and job title band', () => {
    for (const e of employees) {
      const band = salaryBand(e.countryCode, e.jobTitle);

      expect(e.salary).toBeGreaterThan(0);
      expect(Number.isInteger(e.salary)).toBe(true);
      // Salaries are rounded to the nearest 100, so allow that much either side of the band.
      expect(e.salary).toBeGreaterThanOrEqual(band.min - 100);
      expect(e.salary).toBeLessThanOrEqual(band.max + 100);
    }
  });

  it('spreads employees across every country', () => {
    expect(new Set(employees.map((e) => e.countryCode))).toEqual(new Set(COUNTRY_CODES));
  });

  it('generates real hire dates inside the hiring window', () => {
    for (const { hireDate } of employees) {
      expect(hireDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(new Date(`${hireDate}T00:00:00Z`).toISOString().slice(0, 10)).toBe(hireDate);
      expect(hireDate >= '2010-01-01' && hireDate <= '2025-12-31').toBe(true);
    }
  });
});

describe('salaryBand', () => {
  it('pays a senior title more than a junior one in the same country', () => {
    expect(salaryBand('GB', 'Senior Software Engineer').min).toBeGreaterThan(
      salaryBand('GB', 'Software Engineer').min,
    );
  });

  it('throws for a job title it does not know', () => {
    expect(() => salaryBand('GB', 'Astronaut')).toThrow('Unknown job title: Astronaut');
  });
});
