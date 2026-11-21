import { Module } from '@nestjs/common';
import { EmployeesModule } from '../employees/employees.module';
import { ExcelController } from './excel.controller';
import { ExcelService } from './excel.service';

@Module({
  imports: [EmployeesModule],
  controllers: [ExcelController],
  providers: [ExcelService],
})
export class ExcelModule {}
