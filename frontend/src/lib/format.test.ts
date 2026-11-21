import { describe, expect, it } from 'vitest';
import { formatCount, formatDate, formatMoney } from './format';

/** Non-breaking space: the sign and the amount never wrap onto separate lines. */
const NBSP = String.fromCharCode(0xa0);

describe('formatMoney', () => {
  it('shows whole amounts without decimals in the employee currency', () => {
    expect(formatMoney(2450000, 'INR')).toBe(`₹${NBSP}2,450,000`);
  });

  it('keeps the cents when an amount has them', () => {
    expect(formatMoney(85000.5, 'USD')).toBe(`$${NBSP}85,000.50`);
  });

  it('uses the symbol of each currency', () => {
    expect(formatMoney(48500, 'GBP')).toBe(`£${NBSP}48,500`);
  });

  it('keeps the country prefix of currencies that share the dollar sign', () => {
    expect(formatMoney(117200, 'AUD')).toBe(`A$${NBSP}117,200`);
  });
});

describe('formatCount', () => {
  it('groups thousands', () => {
    expect(formatCount(10000)).toBe('10,000');
  });
});

describe('formatDate', () => {
  it('shows a calendar date without shifting it by time zone', () => {
    expect(formatDate('2021-03-01')).toBe('Mar 1, 2021');
  });
});
