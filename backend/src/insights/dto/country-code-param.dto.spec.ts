import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CountryCodeParamDto } from './country-code-param.dto';

describe('CountryCodeParamDto', () => {
  it('accepts a known country in any letter case', async () => {
    const dto = plainToInstance(CountryCodeParamDto, { code: 'in' });

    expect(await validate(dto)).toEqual([]);
    expect(dto.code).toBe('IN');
  });

  it('rejects an unknown country', async () => {
    const dto = plainToInstance(CountryCodeParamDto, { code: 'ZZ' });

    expect((await validate(dto)).map((e) => e.property)).toEqual(['code']);
  });
});
