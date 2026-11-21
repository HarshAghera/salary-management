/**
 * Postgres returns `numeric` aggregates as text to avoid losing precision; the raw
 * row types keep them as strings until the service converts them deliberately.
 */
export interface CountryHeadcountRow {
  countryCode: string;
  currency: string;
  headcount: number;
}

export interface DepartmentHeadcountRow {
  department: string;
  headcount: number;
}

export interface CountrySummaryRow {
  countryCode: string;
  currency: string;
  headcount: number;
  minSalary: string;
  maxSalary: string;
  averageSalary: string;
  medianSalary: string;
}

export interface JobTitleSummaryRow {
  jobTitle: string;
  headcount: number;
  minSalary: string;
  maxSalary: string;
  averageSalary: string;
}

export interface Overview {
  totalHeadcount: number;
  byCountry: (CountryHeadcountRow & { countryName: string })[];
  byDepartment: DepartmentHeadcountRow[];
}

export interface CountrySummary {
  countryCode: string;
  countryName: string;
  currency: string;
  headcount: number;
  minSalary: number;
  maxSalary: number;
  averageSalary: number;
  medianSalary: number;
}

export interface JobTitleSummary {
  jobTitle: string;
  headcount: number;
  minSalary: number;
  maxSalary: number;
  averageSalary: number;
}

export interface CountryJobTitles {
  countryCode: string;
  countryName: string;
  currency: string;
  jobTitles: JobTitleSummary[];
}
