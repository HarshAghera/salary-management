import 'dotenv/config';
import 'reflect-metadata';
import { DataSource, DataSourceOptions } from 'typeorm';
import { AppConfig, loadConfig } from '../config/env';

/** Shared by the Nest app and the TypeORM CLI so both see the same schema. `synchronize` stays off (migrations only). */
export function buildDataSourceOptions(config: AppConfig): DataSourceOptions {
  return {
    type: 'postgres',
    url: config.databaseUrl,
    ssl: config.databaseSsl ? { rejectUnauthorized: false } : false,
    entities: [],
    migrations: [__dirname + '/migrations/*.{ts,js}'],
    synchronize: false,
  };
}

export default new DataSource(buildDataSourceOptions(loadConfig(process.env)));
