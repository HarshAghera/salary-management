/** One locale for every number and date, so the whole app formats consistently. */
const LOCALE = 'en-US';

export const NO_BREAK_SPACE = String.fromCharCode(0xa0);

const countFormat = new Intl.NumberFormat(LOCALE);
const dateFormat = new Intl.DateTimeFormat(LOCALE, { dateStyle: 'medium', timeZone: 'UTC' });

/**
 * "₹ 2,450,000" for whole amounts, "$ 85,000.50" when there are cents. The sign is set
 * apart from the digits by a non-breaking space, so the two never wrap onto separate lines.
 */
export function formatMoney(amount: number, currency: string): string {
  const whole = Number.isInteger(amount);
  const parts = new Intl.NumberFormat(LOCALE, {
    style: 'currency',
    currency,
    ...(whole ? { minimumFractionDigits: 0, maximumFractionDigits: 0 } : {}),
  }).formatToParts(amount);
  const sign = parts.find((part) => part.type === 'currency')?.value ?? currency;
  const digits = parts
    .filter((part) => part.type !== 'currency')
    .map((part) => part.value)
    .join('')
    .trim();
  return `${sign}${NO_BREAK_SPACE}${digits}`;
}

export function formatCount(value: number): string {
  return countFormat.format(value);
}

/**
 * "Mar 12, 2021" from "2021-03-12". Read and printed in UTC: a calendar date has no time
 * zone, and parsing it as local time would show the previous day west of Greenwich.
 */
export function formatDate(isoDate: string): string {
  const [year, month, day] = isoDate.split('-').map(Number);
  return dateFormat.format(new Date(Date.UTC(year, month - 1, day)));
}
