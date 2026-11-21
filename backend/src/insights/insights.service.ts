import { Injectable } from '@nestjs/common';
import { COUNTRIES, currencyForCountry } from '../common/countries';
import { InsightsRepository } from './insights.repository';
import { CountryJobTitles, CountrySummary, Overview } from './insights.types';

const COUNTRY_NAMES = new Map(COUNTRIES.map((c) => [c.code, c.name]));

/**
 * Values are rounded to cents in SQL and stay far below 2^53, so converting the text
 * to a JS number here is exact. No arithmetic happens on these numbers (ADR-6).
 */
const toAmount = (value: string): number => Number(value);

@Injectable()
export class InsightsService {
  constructor(private readonly insights: InsightsRepository) {}

  async overview(): Promise<Overview> {
    const [totalHeadcount, byCountry, byDepartment] = await Promise.all([
      this.insights.countEmployees(),
      this.insights.headcountByCountry(),
      this.insights.headcountByDepartment(),
    ]);

    return {
      totalHeadcount,
      byCountry: byCountry.map((row) => ({
        countryCode: row.countryCode,
        countryName: COUNTRY_NAMES.get(row.countryCode) ?? row.countryCode,
        currency: row.currency,
        headcount: row.headcount,
      })),
      byDepartment,
    };
  }

  async countrySummaries(): Promise<CountrySummary[]> {
    const rows = await this.insights.countrySummaries();
    return rows.map((row) => ({
      countryCode: row.countryCode,
      countryName: COUNTRY_NAMES.get(row.countryCode) ?? row.countryCode,
      currency: row.currency,
      headcount: row.headcount,
      minSalary: toAmount(row.minSalary),
      maxSalary: toAmount(row.maxSalary),
      averageSalary: toAmount(row.averageSalary),
      medianSalary: toAmount(row.medianSalary),
    }));
  }

  async jobTitleSummaries(countryCode: string): Promise<CountryJobTitles> {
    const rows = await this.insights.jobTitleSummaries(countryCode);
    return {
      countryCode,
      countryName: COUNTRY_NAMES.get(countryCode) ?? countryCode,
      currency: currencyForCountry(countryCode),
      jobTitles: rows.map((row) => ({
        jobTitle: row.jobTitle,
        headcount: row.headcount,
        minSalary: toAmount(row.minSalary),
        maxSalary: toAmount(row.maxSalary),
        averageSalary: toAmount(row.averageSalary),
      })),
    };
  }
}
