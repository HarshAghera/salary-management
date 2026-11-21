import { ServiceUnavailableException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { HealthService } from './health.service';

function setup(query: jest.Mock) {
  const service = new HealthService({ query } as unknown as DataSource);
  return { service };
}

describe('HealthService', () => {
  it('reports ok when the database answers', async () => {
    const query = jest.fn().mockResolvedValue([{ '?column?': 1 }]);
    const { service } = setup(query);

    expect(await service.check()).toEqual({ status: 'ok', database: 'up' });
    expect(query).toHaveBeenCalledWith('SELECT 1');
  });

  it('reports the database as down with 503 when it cannot be reached', async () => {
    const { service } = setup(jest.fn().mockRejectedValue(new Error('connection refused')));

    const error = await service.check().catch((e: unknown) => e);

    expect(error).toBeInstanceOf(ServiceUnavailableException);
    expect((error as ServiceUnavailableException).getResponse()).toEqual({ status: 'error', database: 'down' });
  });
});
