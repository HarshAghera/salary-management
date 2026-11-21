/**
 * Reference data for realistic seed salaries. Each country has a typical annual gross
 * salary for a mid-level role in local currency; each job title scales it. The figures
 * are plausible orders of magnitude, not market data: they exist so insights show
 * meaningful differences rather than random noise (ADR-8).
 */

/** Typical mid-level annual gross salary, in the country's own currency. */
export const COUNTRY_BASE_SALARY: Readonly<Record<string, number>> = {
  US: 95_000,
  GB: 55_000,
  IN: 1_200_000,
  DE: 62_000,
  FR: 50_000,
  NL: 58_000,
  CA: 80_000,
  AU: 95_000,
  SG: 85_000,
  JP: 6_500_000,
};

/** Relative headcount per country: ACME is largest in the US and India. */
export const COUNTRY_WEIGHTS: Readonly<Record<string, number>> = {
  US: 30,
  IN: 20,
  GB: 12,
  DE: 8,
  CA: 7,
  FR: 6,
  NL: 5,
  AU: 5,
  SG: 4,
  JP: 3,
};

export interface JobTitle {
  title: string;
  /** Multiplier on the country base salary. */
  multiplier: number;
  /** Relative headcount within the department. */
  weight: number;
}

export interface Department {
  name: string;
  weight: number;
  titles: readonly JobTitle[];
}

export const DEPARTMENTS: readonly Department[] = [
  {
    name: 'Engineering',
    weight: 35,
    titles: [
      { title: 'Software Engineer', multiplier: 1.0, weight: 40 },
      { title: 'Senior Software Engineer', multiplier: 1.35, weight: 25 },
      { title: 'Engineering Manager', multiplier: 1.7, weight: 8 },
      { title: 'QA Engineer', multiplier: 0.85, weight: 15 },
      { title: 'DevOps Engineer', multiplier: 1.1, weight: 12 },
    ],
  },
  {
    name: 'Product',
    weight: 8,
    titles: [
      { title: 'Product Manager', multiplier: 1.3, weight: 50 },
      { title: 'Product Designer', multiplier: 1.0, weight: 50 },
    ],
  },
  {
    name: 'Sales',
    weight: 15,
    titles: [
      { title: 'Account Executive', multiplier: 0.9, weight: 75 },
      { title: 'Sales Manager', multiplier: 1.3, weight: 25 },
    ],
  },
  {
    name: 'Marketing',
    weight: 10,
    titles: [
      { title: 'Marketing Specialist', multiplier: 0.8, weight: 70 },
      { title: 'Marketing Manager', multiplier: 1.2, weight: 30 },
    ],
  },
  {
    name: 'Finance',
    weight: 9,
    titles: [
      { title: 'Accountant', multiplier: 0.8, weight: 55 },
      { title: 'Financial Analyst', multiplier: 0.95, weight: 45 },
    ],
  },
  {
    name: 'Human Resources',
    weight: 8,
    titles: [
      { title: 'HR Generalist', multiplier: 0.75, weight: 70 },
      { title: 'HR Manager', multiplier: 1.15, weight: 30 },
    ],
  },
  {
    name: 'Operations',
    weight: 15,
    titles: [
      { title: 'Operations Analyst', multiplier: 0.8, weight: 40 },
      { title: 'Customer Support Specialist', multiplier: 0.55, weight: 60 },
    ],
  },
];

/** Individual salaries vary ±20% around the band midpoint. */
export const SALARY_SPREAD = 0.2;

export const FIRST_NAMES = [
  'Aarav', 'Aisha', 'Akira', 'Alex', 'Amelia', 'Ananya', 'Arjun', 'Ben', 'Camille', 'Carlos',
  'Charlotte', 'Chen', 'Chloe', 'Daniel', 'David', 'Elena', 'Emma', 'Ethan', 'Fatima', 'Felix',
  'Grace', 'Hannah', 'Hiro', 'Isabella', 'Ishaan', 'Jack', 'James', 'Julia', 'Kavya', 'Leo',
  'Liam', 'Lucas', 'Maya', 'Mia', 'Noah', 'Olivia', 'Priya', 'Rahul', 'Sakura', 'Sara',
  'Sofia', 'Thomas', 'Wei', 'Yuki', 'Zara',
] as const;

export const LAST_NAMES = [
  'Anderson', 'Bauer', 'Brown', 'Chen', 'Dubois', 'Fischer', 'Garcia', 'Gupta', 'Ito', 'Iyer',
  'Jansen', 'Johnson', 'Kumar', 'Lee', 'Martin', 'Meyer', 'Miller', 'Moreau', 'Nair', 'Nguyen',
  'Patel', 'Reddy', 'Rossi', 'Sato', 'Schmidt', 'Shah', 'Singh', 'Smith', 'Suzuki', 'Tan',
  'Taylor', 'Thomas', 'Visser', 'Wang', 'Williams', 'Wilson', 'Wong', 'Yamamoto',
] as const;
