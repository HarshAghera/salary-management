import { numericTransformer } from './numeric.transformer';

describe('numericTransformer', () => {
  it('reads a numeric column with decimals as an exact number', () => {
    expect(numericTransformer.from('85000.50')).toBe(85000.5);
  });

  it('reads the largest allowed salary without losing precision', () => {
    expect(numericTransformer.from('9999999999.99')).toBe(9999999999.99);
  });

  it('passes null through unchanged', () => {
    expect(numericTransformer.from(null)).toBeNull();
  });

  it('writes the number unchanged', () => {
    expect(numericTransformer.to(1800000.25)).toBe(1800000.25);
  });
});
