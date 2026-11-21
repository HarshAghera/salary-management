import { Controller, Get } from '@nestjs/common';
import { HealthService, HealthStatus } from './health.service';

@Controller('health')
export class HealthController {
  constructor(private readonly service: HealthService) {}

  @Get()
  check(): Promise<HealthStatus> {
    return this.service.check();
  }
}
