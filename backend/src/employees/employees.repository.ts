import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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

  save(employee: Partial<Employee>): Promise<Employee> {
    return this.repo.save(this.repo.create(employee));
  }

  /** Returns true when a row was deleted. */
  async deleteById(id: string): Promise<boolean> {
    const result = await this.repo.delete(id);
    return (result.affected ?? 0) > 0;
  }
}
