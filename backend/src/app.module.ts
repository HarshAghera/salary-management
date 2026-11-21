import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { loadConfig } from './config/env';
import { buildDataSourceOptions } from './database/data-source';
import { EmployeesModule } from './employees/employees.module';
import { ExcelModule } from './excel/excel.module';
import { HealthModule } from './health/health.module';
import { InsightsModule } from './insights/insights.module';

@Module({
  imports: [
    TypeOrmModule.forRoot(buildDataSourceOptions(loadConfig(process.env))),
    EmployeesModule,
    InsightsModule,
    ExcelModule,
    HealthModule,
  ],
})
export class AppModule {}
