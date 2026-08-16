/**
 * Seeded randomness for the role deal.
 *
 * A seed rather than `Math.random()` so a real game is unpredictable while a test can
 * replay the exact same deal from the seed stored in `GameState`.
 */

/**
 * Creates a mulberry32 pseudo-random generator bound to a seed.
 * @param seed - Integer seed; the same seed always yields the same sequence.
 * @returns A function producing the next float in [0, 1) on each call.
 */
export function createRandom(seed: number): () => number {
  let state = seed;

  return () => {
    // Integer ops only (|0, imul) so the sequence is bit-identical on every engine.
    state = (state + 0x6d2b79f5) | 0;
    let mixed = Math.imul(state ^ (state >>> 15), 1 | state);
    mixed = (mixed + Math.imul(mixed ^ (mixed >>> 7), 61 | mixed)) ^ mixed;
    return ((mixed ^ (mixed >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Shuffles a list with Fisher-Yates driven by the seeded generator.
 * @param items - The list to shuffle; never mutated.
 * @param seed - Seed selecting which permutation comes out.
 * @returns A new array holding the same items in shuffled order.
 */
export function shuffle<T>(items: readonly T[], seed: number): T[] {
  const nextRandom = createRandom(seed);
  const result = [...items];

  for (let i = result.length - 1; i > 0; i--) {
    const swapIndex = Math.floor(nextRandom() * (i + 1));
    [result[i], result[swapIndex]] = [result[swapIndex], result[i]];
  }

  return result;
}
