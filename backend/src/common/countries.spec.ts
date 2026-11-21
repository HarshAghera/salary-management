import { COUNTRIES, COUNTRY_CODES, currencyForCountry } from './countries';

describe('countries', () => {
  it('derives the currency from the country code', () => {
    expect(currencyForCountry('IN')).toBe('INR');
    expect(currencyForCountry('GB')).toBe('GBP');
  });

  it('maps every euro-zone country to EUR', () => {
    expect(['DE', 'FR', 'NL'].map(currencyForCountry)).toEqual(['EUR', 'EUR', 'EUR']);
  });

  it('throws for an unknown country code', () => {
    expect(() => currencyForCountry('ZZ')).toThrow('Unknown country code: ZZ');
  });

  it('has unique country codes', () => {
    expect(new Set(COUNTRY_CODES).size).toBe(COUNTRIES.length);
  });
});
