import { DataSource } from 'typeorm';
import { Employee } from '../src/employees/employee.entity';
import { InsightsRepository } from '../src/insights/insights.repository';
import { InsightsService } from '../src/insights/insights.service';
import { insertEmployees, newEmployee } from './support/fixtures';
import { createTestDataSource, emptyEmployees } from './support/test-database';

describe('Salary insights against PostgreSQL', () => {
  let dataSource: DataSource;
  let insights: InsightsService;

  beforeAll(async () => {
    dataSource = await createTestDataSource();
    insights = new InsightsService(new InsightsRepository(dataSource.getRepository(Employee)));
  });

  beforeEach(() => emptyEmployees(dataSource));

  afterAll(() => dataSource?.destroy());

  it('computes headcount, min, max, average and median per country in its own currency', async () => {
    await insertEmployees(dataSource, [
      ...[30000, 40000.5, 50000, 60000, 100000].map((salary) => newEmployee({ countryCode: 'GB', salary })),
      ...[1000000, 2000001].map((salary) => newEmployee({ countryCode: 'IN', salary })),
    ]);

    const summaries = await insights.countrySummaries();

    expect(summaries).toEqual([
      {
        countryCode: 'GB',
        countryName: 'United Kingdom',
        currency: 'GBP',
        headcount: 5,
        minSalary: 30000,
        maxSalary: 100000,
        averageSalary: 56000.1,
        medianSalary: 50000,
      },
      {
        countryCode: 'IN',
        countryName: 'India',
        currency: 'INR',
        headcount: 2,
        minSalary: 1000000,
        maxSalary: 2000001,
        averageSalary: 1500000.5,
        // An even count takes the mean of the two middle salaries.
        medianSalary: 1500000.5,
      },
    ]);
  });

  it('rounds averages and medians to whole cents', async () => {
    await insertEmployees(dataSource, [
      newEmployee({ salary: 10000 }),
      newEmployee({ salary: 10000 }),
      newEmployee({ salary: 10000.01 }),
      newEmployee({ salary: 10000.02 }),
    ]);

    const [gb] = await insights.countrySummaries();

    expect(gb.averageSalary).toBe(10000.01); // 10000.0075 rounded
    expect(gb.medianSalary).toBe(10000.01); // mean of 10000.00 and 10000.01, rounded
  });

  it('breaks a country down by job title, highest average first, ignoring other countries', async () => {
    await insertEmployees(dataSource, [
      newEmployee({ jobTitle: 'Software Engineer', salary: 50000 }),
      newEmployee({ jobTitle: 'Software Engineer', salary: 60000 }),
      newEmployee({ jobTitle: 'Engineering Manager', salary: 90000 }),
      newEmployee({ jobTitle: 'Accountant', department: 'Finance', salary: 40000 }),
      newEmployee({ jobTitle: 'Software Engineer', countryCode: 'IN', salary: 1500000 }),
    ]);

    const result = await insights.jobTitleSummaries('GB');

    expect(result).toEqual({
      countryCode: 'GB',
      countryName: 'United Kingdom',
      currency: 'GBP',
      jobTitles: [
        { jobTitle: 'Engineering Manager', headcount: 1, minSalary: 90000, maxSalary: 90000, averageSalary: 90000 },
        { jobTitle: 'Software Engineer', headcount: 2, minSalary: 50000, maxSalary: 60000, averageSalary: 55000 },
        { jobTitle: 'Accountant', headcount: 1, minSalary: 40000, maxSalary: 40000, averageSalary: 40000 },
      ],
    });
  });

  it('reports total headcount and headcount by country and department, largest first', async () => {
    await insertEmployees(dataSource, [
      newEmployee({ countryCode: 'GB' }),
      newEmployee({ countryCode: 'GB' }),
      newEmployee({ countryCode: 'GB', department: 'Finance', jobTitle: 'Accountant' }),
      newEmployee({ countryCode: 'IN' }),
    ]);

    const overview = await insights.overview();

    expect(overview).toEqual({
      totalHeadcount: 4,
      byCountry: [
        { countryCode: 'GB', countryName: 'United Kingdom', currency: 'GBP', headcount: 3 },
        { countryCode: 'IN', countryName: 'India', currency: 'INR', headcount: 1 },
      ],
      byDepartment: [
        { department: 'Engineering', headcount: 3 },
        { department: 'Finance', headcount: 1 },
      ],
    });
  });

  it('returns empty results when there are no employees', async () => {
    expect(await insights.overview()).toEqual({ totalHeadcount: 0, byCountry: [], byDepartment: [] });
    expect(await insights.countrySummaries()).toEqual([]);
    expect((await insights.jobTitleSummaries('GB')).jobTitles).toEqual([]);
  });
});
