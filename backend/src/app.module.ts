import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { loadConfig } from './config/env';
import { buildDataSourceOptions } from './database/data-source';

@Module({
  imports: [TypeOrmModule.forRoot(buildDataSourceOptions(loadConfig(process.env)))],
})
export class AppModule {}
