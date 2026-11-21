import { DataSource } from 'typeorm';
import { HealthService } from '../src/health/health.service';
import { createTestDataSource } from './support/test-database';

describe('Health check against PostgreSQL', () => {
  let dataSource: DataSource;

  beforeAll(async () => {
    dataSource = await createTestDataSource();
  });

  afterAll(() => dataSource?.destroy());

  it('reports the database as up when it answers', async () => {
    expect(await new HealthService(dataSource).check()).toEqual({ status: 'ok', database: 'up' });
  });
});
