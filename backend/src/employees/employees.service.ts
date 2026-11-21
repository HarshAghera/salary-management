import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { COUNTRIES, currencyForCountry } from '../common/countries';
import { EmployeePage, FilterOptions } from './directory-query';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { ListEmployeesQueryDto } from './dto/list-employees-query.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { Employee } from './employee.entity';
import { EmployeesRepository } from './employees.repository';

const UNIQUE_VIOLATION = '23505';

@Injectable()
export class EmployeesService {
  constructor(private readonly employees: EmployeesRepository) {}

  async create(dto: CreateEmployeeDto): Promise<Employee> {
    await this.assertEmailAvailable(dto.email);
    return this.saveOrConflict({
      ...dto,
      currency: currencyForCountry(dto.countryCode),
    });
  }

  async list(query: ListEmployeesQueryDto): Promise<EmployeePage> {
    const [items, total] = await this.employees.findPage(query);
    return { items, total, page: query.page, pageSize: query.pageSize };
  }

  /**
   * Countries come from the reference list (the create form needs all of them, not
   * only those already in use); departments and job titles come from the data.
   */
  async filterOptions(): Promise<FilterOptions> {
    const { departments, jobTitles } = await this.employees.findDistinctValues();
    return { countries: [...COUNTRIES], departments, jobTitles };
  }

  async findOne(id: string): Promise<Employee> {
    const employee = await this.employees.findById(id);
    if (!employee) {
      throw new NotFoundException(`Employee ${id} not found`);
    }
    return employee;
  }

  async update(id: string, dto: UpdateEmployeeDto): Promise<Employee> {
    const existing = await this.findOne(id);

    if (dto.email !== undefined && dto.email !== existing.email) {
      await this.assertEmailAvailable(dto.email, id);
    }

    const changes: Partial<Employee> = { ...dto };
    // Currency follows the country; recomputing here keeps the two consistent.
    if (dto.countryCode !== undefined) {
      changes.currency = currencyForCountry(dto.countryCode);
    }

    return this.saveOrConflict({ ...existing, ...changes });
  }

  async remove(id: string): Promise<void> {
    const deleted = await this.employees.deleteById(id);
    if (!deleted) {
      throw new NotFoundException(`Employee ${id} not found`);
    }
  }

  private async assertEmailAvailable(email: string, exceptId?: string): Promise<void> {
    const owner = await this.employees.findByEmail(email);
    if (owner && owner.id !== exceptId) {
      throw new ConflictException(`An employee with email ${email} already exists`);
    }
  }

  /** The unique index is the source of truth; this covers the race between check and write. */
  private async saveOrConflict(employee: Partial<Employee>): Promise<Employee> {
    try {
      return await this.employees.save(employee);
    } catch (error) {
      if ((error as { code?: string }).code === UNIQUE_VIOLATION) {
        throw new ConflictException(`An employee with email ${employee.email} already exists`);
      }
      throw error;
    }
  }
}
