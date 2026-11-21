import dataSource from '../data-source';
import { Employee } from '../../employees/employee.entity';
import { generateEmployees } from './employee-generator';

const EMPLOYEE_COUNT = 10_000;
const SEED = 42;
/** 1,000 rows × 8 columns stays far below Postgres's 65,535 bind-parameter limit. */
const BATCH_SIZE = 1_000;

/**
 * Loads 10,000 deterministic employees. Refuses to touch a table that already has
 * data unless run with --reset, so it can never silently wipe real records.
 */
async function seed(): Promise<void> {
  const reset = process.argv.includes('--reset');
  await dataSource.initialize();

  try {
    const existing = await dataSource.getRepository(Employee).count();
    if (existing > 0 && !reset) {
      console.error(`The employees table already has ${existing} rows. Run with --reset to replace them.`);
      process.exitCode = 1;
      return;
    }

    const employees = generateEmployees(EMPLOYEE_COUNT, SEED);
    const startedAt = Date.now();

    await dataSource.transaction(async (manager) => {
      if (reset) {
        await manager.clear(Employee);
      }
      for (let i = 0; i < employees.length; i += BATCH_SIZE) {
        await manager
          .createQueryBuilder()
          .insert()
          .into(Employee)
          .values(employees.slice(i, i + BATCH_SIZE))
          .execute();
      }
    });

    console.log(`Seeded ${employees.length} employees in ${Date.now() - startedAt} ms.`);
  } finally {
    await dataSource.destroy();
  }
}

seed().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
