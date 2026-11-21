import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { loadConfig } from './config/env';
import { buildDataSourceOptions } from './database/data-source';
import { EmployeesModule } from './employees/employees.module';

@Module({
  imports: [
    TypeOrmModule.forRoot(buildDataSourceOptions(loadConfig(process.env))),
    EmployeesModule,
  ],
})
export class AppModule {}
