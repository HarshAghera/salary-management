export interface Weighted<T> {
  value: T;
  weight: number;
}

export interface Random {
  /** A number from 0 up to but excluding 1. */
  next(): number;
  /** A whole number between min and max, both inclusive. */
  int(min: number, max: number): number;
  pick<T>(items: readonly T[]): T;
  weighted<T>(items: readonly Weighted<T>[]): T;
}

/**
 * Seeded pseudo-random generator (mulberry32). Math.random cannot be seeded, and a
 * fixed seed is what makes every seed run, screenshot and demo identical (ADR-8).
 */
export function createRandom(seed: number): Random {
  let state = seed >>> 0;

  const next = () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  const int = (min: number, max: number) => min + Math.floor(next() * (max - min + 1));

  return {
    next,
    int,
    pick: (items) => items[int(0, items.length - 1)],
    weighted: (items) => {
      const total = items.reduce((sum, item) => sum + item.weight, 0);
      let roll = next() * total;
      for (const item of items) {
        roll -= item.weight;
        if (roll < 0) {
          return item.value;
        }
      }
      // Only reachable through floating-point rounding at the very top of the range.
      return items.filter((item) => item.weight > 0).at(-1)!.value;
    },
  };
}
