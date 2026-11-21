import 'dotenv/config';
import { DataSource } from 'typeorm';
import { loadConfig } from '../config/env';
import { buildDataSourceOptions } from './data-source';

/**
 * The data source used by the TypeORM CLI (migrations) and the seed script. It is kept
 * separate because it reads the environment when imported, which tests must not do.
 */
export default new DataSource(buildDataSourceOptions(loadConfig(process.env)));
