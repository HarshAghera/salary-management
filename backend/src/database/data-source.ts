import 'reflect-metadata';
import { DataSourceOptions } from 'typeorm';
import { AppConfig } from '../config/env';
import { Employee } from '../employees/employee.entity';

/**
 * Shared by the Nest app, the TypeORM CLI, the seed script and the integration tests
 * so all of them see the same schema. `synchronize` stays off (migrations only).
 */
export function buildDataSourceOptions(config: AppConfig): DataSourceOptions {
  return {
    type: 'postgres',
    url: config.databaseUrl,
    ssl: config.databaseSsl ? { rejectUnauthorized: false } : false,
    entities: [Employee],
    migrations: [__dirname + '/migrations/*.{ts,js}'],
    synchronize: false,
  };
}
