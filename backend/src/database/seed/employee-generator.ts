import { COUNTRY_CODES, currencyForCountry } from '../../common/countries';
import { createRandom } from './random';
import {
  COUNTRY_BASE_SALARY,
  COUNTRY_WEIGHTS,
  DEPARTMENTS,
  FIRST_NAMES,
  LAST_NAMES,
  SALARY_SPREAD,
} from './salary-bands';

export interface SeedEmployee {
  fullName: string;
  email: string;
  jobTitle: string;
  department: string;
  countryCode: string;
  currency: string;
  salary: number;
  hireDate: string;
}

const HIRING_WINDOW_START = Date.UTC(2010, 0, 1);
const HIRING_WINDOW_DAYS = (Date.UTC(2025, 11, 31) - HIRING_WINDOW_START) / 86_400_000;

const MULTIPLIER_BY_TITLE = new Map(
  DEPARTMENTS.flatMap((d) => d.titles.map((t) => [t.title, t.multiplier] as const)),
);

/** The salary range a job title can be paid in a country, in local currency. */
export function salaryBand(countryCode: string, jobTitle: string): { min: number; max: number } {
  const multiplier = MULTIPLIER_BY_TITLE.get(jobTitle);
  if (multiplier === undefined) {
    throw new Error(`Unknown job title: ${jobTitle}`);
  }
  const midpoint = COUNTRY_BASE_SALARY[countryCode] * multiplier;
  return { min: midpoint * (1 - SALARY_SPREAD), max: midpoint * (1 + SALARY_SPREAD) };
}

/**
 * Generates `count` realistic employees. Pure and deterministic: the same seed always
 * yields the same employees, so the seed script and its tests need no database.
 */
export function generateEmployees(count: number, seed: number): SeedEmployee[] {
  const random = createRandom(seed);
  const countries = COUNTRY_CODES.map((code) => ({ value: code, weight: COUNTRY_WEIGHTS[code] }));
  const departments = DEPARTMENTS.map((d) => ({ value: d, weight: d.weight }));

  return Array.from({ length: count }, (_, index) => {
    const firstName = random.pick(FIRST_NAMES);
    const lastName = random.pick(LAST_NAMES);
    const countryCode = random.weighted(countries);
    const department = random.weighted(departments);
    const jobTitle = random.weighted(department.titles.map((t) => ({ value: t.title, weight: t.weight })));

    const band = salaryBand(countryCode, jobTitle);
    // Whole amounts rounded to the nearest 100, as salaries are usually agreed.
    const salary = Math.round((band.min + random.next() * (band.max - band.min)) / 100) * 100;

    const hireDate = new Date(HIRING_WINDOW_START + random.int(0, HIRING_WINDOW_DAYS) * 86_400_000)
      .toISOString()
      .slice(0, 10);

    return {
      fullName: `${firstName} ${lastName}`,
      // The running number keeps emails unique even when names repeat.
      email: `${firstName}.${lastName}.${index + 1}@acme.com`.toLowerCase(),
      jobTitle,
      department: department.name,
      countryCode,
      currency: currencyForCountry(countryCode),
      salary,
      hireDate,
    };
  });
}
