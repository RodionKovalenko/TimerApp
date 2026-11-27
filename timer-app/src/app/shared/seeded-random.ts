/**
 * Small deterministic random generator for game reducers.
 * The generator state lives in the game state (`seed`), so a game replays
 * identically for the same actions.
 */
export interface Seeded {
  seed: number;
}

export function newSeed(): number {
  return Math.floor(Math.random() * 2 ** 31) | 0;
}

/** mulberry32: returns a float in [0, 1) and advances s.seed. */
export function random(s: Seeded): number {
  s.seed = (s.seed + 0x6D2B79F5) | 0;
  let t = s.seed;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

export function shuffle<T>(s: Seeded, list: T[]): T[] {
  for (let i = list.length - 1; i > 0; i--) {
    const j = Math.floor(random(s) * (i + 1));
    [list[i], list[j]] = [list[j], list[i]];
  }
  return list;
}

export function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}
