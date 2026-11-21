import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { EmployeePage, FilterOptions } from './directory-query';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { ListEmployeesQueryDto } from './dto/list-employees-query.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { Employee } from './employee.entity';
import { EmployeesService } from './employees.service';

@Controller('employees')
export class EmployeesController {
  constructor(private readonly service: EmployeesService) {}

  @Post()
  create(@Body() dto: CreateEmployeeDto): Promise<Employee> {
    return this.service.create(dto);
  }

  @Get()
  list(@Query() query: ListEmployeesQueryDto): Promise<EmployeePage> {
    return this.service.list(query);
  }

  // Must be declared before ':id', otherwise "filter-options" is parsed as an id and rejected.
  @Get('filter-options')
  filterOptions(): Promise<FilterOptions> {
    return this.service.filterOptions();
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string): Promise<Employee> {
    return this.service.findOne(id);
  }

  @Patch(':id')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateEmployeeDto): Promise<Employee> {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.service.remove(id);
  }
}
