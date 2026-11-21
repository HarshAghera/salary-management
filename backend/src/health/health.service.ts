import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { DataSource } from 'typeorm';

export interface HealthStatus {
  status: 'ok';
  database: 'up';
}

@Injectable()
export class HealthService {
  constructor(private readonly dataSource: DataSource) {}

  /**
   * The API is only useful if it can reach the database, so health includes a real
   * round trip. A 503 lets the host's health check restart or hold back a bad deploy.
   */
  async check(): Promise<HealthStatus> {
    try {
      await this.dataSource.query('SELECT 1');
      return { status: 'ok', database: 'up' };
    } catch {
      throw new ServiceUnavailableException({ status: 'error', database: 'down' });
    }
  }
}
