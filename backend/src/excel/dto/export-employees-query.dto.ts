import { OmitType } from '@nestjs/mapped-types';
import { ListEmployeesQueryDto } from '../../employees/dto/list-employees-query.dto';

/** The directory's search, filters and sort, without paging: an export contains every match. */
export class ExportEmployeesQueryDto extends OmitType(ListEmployeesQueryDto, ['page', 'pageSize'] as const) {}
