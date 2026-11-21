import { Transform, Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';
import { COUNTRY_CODES } from '../../common/countries';
import { trim, trimUpper } from '../../common/transforms';
import { DirectoryCriteria, SORT_FIELDS, SORT_ORDERS, SortField, SortOrder } from '../directory-query';

export const MAX_PAGE_SIZE = 100;

export class ListEmployeesQueryDto implements DirectoryCriteria {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(MAX_PAGE_SIZE)
  pageSize: number = 25;

  /** Matched against full name and email. */
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(120)
  search?: string;

  @IsOptional()
  @Transform(trimUpper)
  @IsIn(COUNTRY_CODES, { message: `country must be one of: ${COUNTRY_CODES.join(', ')}` })
  country?: string;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(120)
  department?: string;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(120)
  jobTitle?: string;

  @IsIn(SORT_FIELDS)
  sortBy: SortField = 'fullName';

  @IsIn(SORT_ORDERS)
  sortOrder: SortOrder = 'asc';
}
