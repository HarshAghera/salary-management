import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Employee } from '../employees/employee.entity';
import { InsightsController } from './insights.controller';
import { InsightsRepository } from './insights.repository';
import { InsightsService } from './insights.service';

@Module({
  imports: [TypeOrmModule.forFeature([Employee])],
  controllers: [InsightsController],
  providers: [InsightsService, InsightsRepository],
})
export class InsightsModule {}
