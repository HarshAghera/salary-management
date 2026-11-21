import { ConflictException, NotFoundException } from '@nestjs/common';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { Employee } from './employee.entity';
import { EmployeesRepository } from './employees.repository';
import { EmployeesService } from './employees.service';

type RepoMock = jest.Mocked<
  Pick<EmployeesRepository, 'findById' | 'findByEmail' | 'save' | 'deleteById'>
>;

const newEmployeeDto = (overrides: Partial<CreateEmployeeDto> = {}): CreateEmployeeDto => ({
  fullName: 'Asha Rao',
  email: 'asha.rao@acme.com',
  jobTitle: 'Software Engineer',
  department: 'Engineering',
  countryCode: 'IN',
  salary: 1800000,
  hireDate: '2022-04-18',
  ...overrides,
});

const storedEmployee = (overrides: Partial<Employee> = {}): Employee => ({
  id: '11111111-1111-4111-8111-111111111111',
  fullName: 'Asha Rao',
  email: 'asha.rao@acme.com',
  jobTitle: 'Software Engineer',
  department: 'Engineering',
  countryCode: 'IN',
  currency: 'INR',
  salary: 1800000,
  hireDate: '2022-04-18',
  createdAt: new Date('2024-01-01T00:00:00Z'),
  updatedAt: new Date('2024-01-01T00:00:00Z'),
  ...overrides,
});

function setup() {
  const repo: RepoMock = {
    findById: jest.fn(),
    findByEmail: jest.fn(),
    save: jest.fn(async (e) => e as Employee),
    deleteById: jest.fn(),
  };
  const service = new EmployeesService(repo as unknown as EmployeesRepository);
  return { repo, service };
}

describe('EmployeesService', () => {
  describe('create', () => {
    it('derives the currency from the country', async () => {
      const { repo, service } = setup();
      repo.findByEmail.mockResolvedValue(null);

      await service.create(newEmployeeDto({ countryCode: 'GB' }));

      expect(repo.save).toHaveBeenCalledWith(expect.objectContaining({ countryCode: 'GB', currency: 'GBP' }));
    });

    it('rejects a duplicate email', async () => {
      const { repo, service } = setup();
      repo.findByEmail.mockResolvedValue(storedEmployee());

      await expect(service.create(newEmployeeDto())).rejects.toBeInstanceOf(ConflictException);
      expect(repo.save).not.toHaveBeenCalled();
    });

    it('turns a database unique violation into a conflict', async () => {
      const { repo, service } = setup();
      repo.findByEmail.mockResolvedValue(null);
      repo.save.mockRejectedValue({ code: '23505' });

      await expect(service.create(newEmployeeDto())).rejects.toBeInstanceOf(ConflictException);
    });

    it('does not swallow unexpected database errors', async () => {
      const { repo, service } = setup();
      repo.findByEmail.mockResolvedValue(null);
      repo.save.mockRejectedValue(new Error('connection lost'));

      await expect(service.create(newEmployeeDto())).rejects.toThrow('connection lost');
    });
  });

  describe('findOne', () => {
    it('returns the employee', async () => {
      const { repo, service } = setup();
      const employee = storedEmployee();
      repo.findById.mockResolvedValue(employee);

      await expect(service.findOne(employee.id)).resolves.toBe(employee);
    });

    it('throws NotFound for an unknown id', async () => {
      const { repo, service } = setup();
      repo.findById.mockResolvedValue(null);

      await expect(service.findOne('missing')).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('update', () => {
    it('applies only the supplied fields', async () => {
      const { repo, service } = setup();
      repo.findById.mockResolvedValue(storedEmployee());

      await service.update('id', { salary: 2000000 });

      expect(repo.save).toHaveBeenCalledWith(
        expect.objectContaining({ salary: 2000000, fullName: 'Asha Rao', currency: 'INR' }),
      );
    });

    it('recomputes the currency when the country changes', async () => {
      const { repo, service } = setup();
      repo.findById.mockResolvedValue(storedEmployee());

      await service.update('id', { countryCode: 'DE' });

      expect(repo.save).toHaveBeenCalledWith(expect.objectContaining({ countryCode: 'DE', currency: 'EUR' }));
    });

    it('rejects changing the email to one another employee already uses', async () => {
      const { repo, service } = setup();
      repo.findById.mockResolvedValue(storedEmployee());
      repo.findByEmail.mockResolvedValue(storedEmployee({ id: 'other', email: 'taken@acme.com' }));

      await expect(service.update('id', { email: 'taken@acme.com' })).rejects.toBeInstanceOf(ConflictException);
      expect(repo.save).not.toHaveBeenCalled();
    });

    it('skips the uniqueness check when the email is unchanged', async () => {
      const { repo, service } = setup();
      repo.findById.mockResolvedValue(storedEmployee());

      await service.update('id', { email: 'asha.rao@acme.com', salary: 1900000 });

      expect(repo.findByEmail).not.toHaveBeenCalled();
    });

    it('throws NotFound when the employee does not exist', async () => {
      const { repo, service } = setup();
      repo.findById.mockResolvedValue(null);

      await expect(service.update('missing', { salary: 1 })).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('remove', () => {
    it('deletes an existing employee', async () => {
      const { repo, service } = setup();
      repo.deleteById.mockResolvedValue(true);

      await expect(service.remove('id')).resolves.toBeUndefined();
    });

    it('throws NotFound when nothing was deleted', async () => {
      const { repo, service } = setup();
      repo.deleteById.mockResolvedValue(false);

      await expect(service.remove('missing')).rejects.toBeInstanceOf(NotFoundException);
    });
  });
});
