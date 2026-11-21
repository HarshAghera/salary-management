export interface Country {
  code: string;
  name: string;
  currency: string;
}

/**
 * Reference data for the countries ACME employs people in.
 * Currency is derived from the country and never accepted from the client (ADR-6).
 */
export const COUNTRIES: readonly Country[] = [
  { code: 'US', name: 'United States', currency: 'USD' },
  { code: 'GB', name: 'United Kingdom', currency: 'GBP' },
  { code: 'IN', name: 'India', currency: 'INR' },
  { code: 'DE', name: 'Germany', currency: 'EUR' },
  { code: 'FR', name: 'France', currency: 'EUR' },
  { code: 'NL', name: 'Netherlands', currency: 'EUR' },
  { code: 'CA', name: 'Canada', currency: 'CAD' },
  { code: 'AU', name: 'Australia', currency: 'AUD' },
  { code: 'SG', name: 'Singapore', currency: 'SGD' },
  { code: 'JP', name: 'Japan', currency: 'JPY' },
];

export const COUNTRY_CODES: readonly string[] = COUNTRIES.map((c) => c.code);

export function currencyForCountry(code: string): string {
  const country = COUNTRIES.find((c) => c.code === code);
  if (!country) {
    throw new Error(`Unknown country code: ${code}`);
  }
  return country.currency;
}
