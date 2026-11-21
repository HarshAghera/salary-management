import { createRandom } from './random';

describe('createRandom', () => {
  it('returns the same sequence for the same seed', () => {
    const first = createRandom(42);
    const second = createRandom(42);

    const a = Array.from({ length: 5 }, () => first.next());
    const b = Array.from({ length: 5 }, () => second.next());

    expect(a).toEqual(b);
  });

  it('returns a different sequence for a different seed', () => {
    expect(createRandom(1).next()).not.toEqual(createRandom(2).next());
  });

  it('returns numbers from 0 up to but excluding 1', () => {
    const random = createRandom(7);
    const values = Array.from({ length: 1000 }, () => random.next());

    expect(values.every((v) => v >= 0 && v < 1)).toBe(true);
  });

  it('keeps whole numbers within inclusive bounds', () => {
    const random = createRandom(7);
    const values = Array.from({ length: 1000 }, () => random.int(3, 5));

    expect(new Set(values)).toEqual(new Set([3, 4, 5]));
  });

  it('never picks an item with zero weight', () => {
    const random = createRandom(7);
    const picks = Array.from({ length: 200 }, () =>
      random.weighted([
        { value: 'often', weight: 1 },
        { value: 'never', weight: 0 },
      ]),
    );

    expect(picks).not.toContain('never');
  });
});
