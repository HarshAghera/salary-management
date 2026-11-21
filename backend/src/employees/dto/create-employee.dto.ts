import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsIn,
  IsISO8601,
  IsNotEmpty,
  IsNumber,
  IsPositive,
  IsString,
  Matches,
  Max,
  MaxLength,
} from 'class-validator';
import { COUNTRY_CODES } from '../../common/countries';

const trim = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);
const trimLower = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim().toLowerCase() : value;
const trimUpper = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim().toUpperCase() : value;

export class CreateEmployeeDto {
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  fullName!: string;

  @Transform(trimLower)
  @IsEmail()
  @MaxLength(254)
  email!: string;

  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  jobTitle!: string;

  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  department!: string;

  @Transform(trimUpper)
  @IsIn(COUNTRY_CODES, { message: `countryCode must be one of: ${COUNTRY_CODES.join(', ')}` })
  countryCode!: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  @Max(9_999_999_999.99)
  salary!: number;

  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'hireDate must be in YYYY-MM-DD format' })
  @IsISO8601({ strict: true })
  hireDate!: string;
}
