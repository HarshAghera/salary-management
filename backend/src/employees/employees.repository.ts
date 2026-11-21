import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DirectoryCriteria, SORT_COLUMNS, escapeLike } from './directory-query';
import { Employee } from './employee.entity';

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
        .skip((criteria.page - 1) * criteria.pageSize)
        .take(criteria.pageSize)
        .getManyAndCount()
    );
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
