import { PartialType } from '@nestjs/mapped-types';
import { CreateEmployeeDto } from './create-employee.dto';

/** PATCH semantics: every field optional, same rules when present. */
export class UpdateEmployeeDto extends PartialType(CreateEmployeeDto) {}
