import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { DirectoryCriteria, DirectorySearch, SORT_COLUMNS, escapeLike } from './directory-query';
import { Employee } from './employee.entity';

/** An employee as written by an import: every stored field except generated ones. */
export type NewEmployee = Omit<Employee, 'id' | 'createdAt' | 'updatedAt'>;

/** Owns all persistence for employees; services never build queries themselves. */
@Injectable()
export class EmployeesRepository {
  constructor(@InjectRepository(Employee) private readonly repo: Repository<Employee>) {}

  findById(id: string): Promise<Employee | null> {
    return this.repo.findOne({ where: { id } });
  }

  /** `email` must already be lower-cased by the caller. */
  findByEmail(email: string): Promise<Employee | null> {
    return this.repo
      .createQueryBuilder('e')
      .where('lower(e.email) = :email', { email })
      .getOne();
  }

  /** One page of the directory plus the total match count, fetched in a single call. */
  findPage(criteria: DirectoryCriteria): Promise<[Employee[], number]> {
    return this.matching(criteria)
      .skip((criteria.page - 1) * criteria.pageSize)
      .take(criteria.pageSize)
      .getManyAndCount();
  }

  /** Every matching employee, in directory order, for the Excel export. */
  findAllMatching(criteria: DirectorySearch): Promise<Employee[]> {
    return this.matching(criteria).getMany();
  }

  private matching(criteria: DirectorySearch): SelectQueryBuilder<Employee> {
    const query = this.repo.createQueryBuilder('e');

    if (criteria.search) {
      query.andWhere('(e.full_name ILIKE :term OR e.email ILIKE :term)', {
        term: `%${escapeLike(criteria.search)}%`,
      });
    }
    if (criteria.country) {
      query.andWhere('e.country_code = :country', { country: criteria.country });
    }
    if (criteria.department) {
      query.andWhere('e.department = :department', { department: criteria.department });
    }
    if (criteria.jobTitle) {
      query.andWhere('e.job_title = :jobTitle', { jobTitle: criteria.jobTitle });
    }

    const direction = criteria.sortOrder === 'desc' ? 'DESC' : 'ASC';
    return (
      query
        .orderBy(SORT_COLUMNS[criteria.sortBy], direction)
        // Ties (same name, salary or date) would otherwise shuffle rows between pages.
        .addOrderBy('e.id', 'ASC')
    );
  }

  /**
   * Inserts new employees and updates existing ones, matched by case-insensitive
   * email, in one statement. A single statement is atomic, so a file is applied
   * fully or not at all (ADR-7). `xmax = 0` is true only for freshly inserted rows,
   * which tells created and updated apart without a second query.
   */
  async upsertByEmail(employees: NewEmployee[]): Promise<{ created: number; updated: number }> {
    if (employees.length === 0) {
      return { created: 0, updated: 0 };
    }

    const params: unknown[] = [];
    const tuples = employees.map((e) => {
      const values = [e.fullName, e.email, e.jobTitle, e.department, e.countryCode, e.currency, e.salary, e.hireDate];
      const placeholders = values.map((value) => {
        params.push(value);
        return `$${params.length}`;
      });
      return `(${placeholders.join(', ')})`;
    });

    const rows: { inserted: boolean }[] = await this.repo.query(
      `INSERT INTO employees (full_name, email, job_title, department, country_code, currency, salary, hire_date)
       VALUES ${tuples.join(', ')}
       ON CONFLICT ((lower(email))) DO UPDATE SET
         full_name    = EXCLUDED.full_name,
         email        = EXCLUDED.email,
         job_title    = EXCLUDED.job_title,
         department   = EXCLUDED.department,
         country_code = EXCLUDED.country_code,
         currency     = EXCLUDED.currency,
         salary       = EXCLUDED.salary,
         hire_date    = EXCLUDED.hire_date,
         updated_at   = now()
       RETURNING (xmax = 0) AS inserted`,
      params,
    );

    const created = rows.filter((row) => row.inserted).length;
    return { created, updated: rows.length - created };
  }

  /** Distinct values in use, sorted, for the directory filter dropdowns. */
  async findDistinctValues(): Promise<{ departments: string[]; jobTitles: string[] }> {
    const distinct = (column: 'department' | 'job_title') =>
      this.repo
        .createQueryBuilder('e')
        .select(`e.${column}`, 'value')
        .distinct(true)
        .orderBy(`e.${column}`, 'ASC')
        .getRawMany<{ value: string }>()
        .then((rows) => rows.map((row) => row.value));

    const [departments, jobTitles] = await Promise.all([distinct('department'), distinct('job_title')]);
    return { departments, jobTitles };
  }

  save(employee: Partial<Employee>): Promise<Employee> {
    return this.repo.save(this.repo.create(employee));
  }

  /** Returns true when a row was deleted. */
  async deleteById(id: string): Promise<boolean> {
    const result = await this.repo.delete(id);
    return (result.affected ?? 0) > 0;
  }
}
