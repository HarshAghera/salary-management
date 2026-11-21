import { Transform } from 'class-transformer';
import { IsIn } from 'class-validator';
import { COUNTRY_CODES } from '../../common/countries';
import { trimUpper } from '../../common/transforms';

export class CountryCodeParamDto {
  @Transform(trimUpper)
  @IsIn(COUNTRY_CODES, { message: `code must be one of: ${COUNTRY_CODES.join(', ')}` })
  code!: string;
}
