import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { buildDataSourceOptions } from '../../src/database/data-source';
import { CreateEmployees1763700000000 } from '../../src/database/migrations/1763700000000-CreateEmployees';

/**
 * Connects to the database in TEST_DATABASE_URL and rebuilds the schema from the real
 * migrations, so the tests exercise exactly what production runs.
 *
 * Tests empty the employees table, so the database name must end in "_test". This
 * makes it impossible to point the suite at a real database by accident.
 */
export async function createTestDataSource(): Promise<DataSource> {
  const url = process.env.TEST_DATABASE_URL;
  if (!url) {
    throw new Error(
      'TEST_DATABASE_URL is required for integration tests, e.g. postgresql://postgres:postgres@localhost:5433/salary_test',
    );
  }

  const databaseName = new URL(url).pathname.replace(/^\//, '');
  if (!databaseName.endsWith('_test')) {
    throw new Error(
      `Refusing to run integration tests against "${databaseName}": the database name must end in "_test" because every test empties the employees table.`,
    );
  }

  const dataSource = new DataSource({
    ...buildDataSourceOptions({
      databaseUrl: url,
      databaseSsl: process.env.TEST_DATABASE_SSL === 'true',
      corsOrigin: '',
      port: 0,
    }),
    // Listed explicitly so the test run does not depend on resolving the migration glob.
    migrations: [CreateEmployees1763700000000],
  });

  await dataSource.initialize();
  await dataSource.dropDatabase();
  await dataSource.runMigrations();
  return dataSource;
}

export async function emptyEmployees(dataSource: DataSource): Promise<void> {
  await dataSource.query('TRUNCATE employees');
}
