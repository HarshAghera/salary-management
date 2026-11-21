import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Employee } from '../employees/employee.entity';
import {
  CountryHeadcountRow,
  CountrySummaryRow,
  DepartmentHeadcountRow,
  JobTitleSummaryRow,
} from './insights.types';

/**
 * Every aggregate is computed by Postgres in a single GROUP BY query, so only a few
 * summary rows cross the wire instead of 10,000 employees (ADR-5). Averages and
 * medians are rounded to cents in SQL; COUNT is cast to int because Postgres
 * returns bigint as text.
 */
@Injectable()
export class InsightsRepository {
  constructor(@InjectRepository(Employee) private readonly repo: Repository<Employee>) {}

  countEmployees(): Promise<number> {
    return this.repo.count();
  }

  headcountByCountry(): Promise<CountryHeadcountRow[]> {
    return this.repo
      .createQueryBuilder('e')
      .select('e.country_code', 'countryCode')
      .addSelect('e.currency', 'currency')
      .addSelect('COUNT(*)::int', 'headcount')
      .groupBy('e.country_code')
      .addGroupBy('e.currency')
      .orderBy('"headcount"', 'DESC')
      .addOrderBy('e.country_code', 'ASC')
      .getRawMany<CountryHeadcountRow>();
  }

  headcountByDepartment(): Promise<DepartmentHeadcountRow[]> {
    return this.repo
      .createQueryBuilder('e')
      .select('e.department', 'department')
      .addSelect('COUNT(*)::int', 'headcount')
      .groupBy('e.department')
      .orderBy('"headcount"', 'DESC')
      .addOrderBy('e.department', 'ASC')
      .getRawMany<DepartmentHeadcountRow>();
  }

  countrySummaries(): Promise<CountrySummaryRow[]> {
    return this.repo
      .createQueryBuilder('e')
      .select('e.country_code', 'countryCode')
      .addSelect('e.currency', 'currency')
      .addSelect('COUNT(*)::int', 'headcount')
      .addSelect('MIN(e.salary)', 'minSalary')
      .addSelect('MAX(e.salary)', 'maxSalary')
      .addSelect('ROUND(AVG(e.salary), 2)', 'averageSalary')
      .addSelect('ROUND(PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY e.salary)::numeric, 2)', 'medianSalary')
      .groupBy('e.country_code')
      .addGroupBy('e.currency')
      .orderBy('e.country_code', 'ASC')
      .getRawMany<CountrySummaryRow>();
  }

  jobTitleSummaries(countryCode: string): Promise<JobTitleSummaryRow[]> {
    return this.repo
      .createQueryBuilder('e')
      .select('e.job_title', 'jobTitle')
      .addSelect('COUNT(*)::int', 'headcount')
      .addSelect('MIN(e.salary)', 'minSalary')
      .addSelect('MAX(e.salary)', 'maxSalary')
      .addSelect('ROUND(AVG(e.salary), 2)', 'averageSalary')
      .where('e.country_code = :countryCode', { countryCode })
      .groupBy('e.job_title')
      .orderBy('"averageSalary"', 'DESC')
      .addOrderBy('e.job_title', 'ASC')
      .getRawMany<JobTitleSummaryRow>();
  }
}
