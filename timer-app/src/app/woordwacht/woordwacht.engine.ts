/**
 * "Woordwacht": a cooperative word game for two. Each player has a secret key for the same 25 words.
 * Rules as a pure reducer: (state, action) => state.
 */
import { clone, newSeed, shuffle } from '../shared/seeded-random';
import { WORDS } from './woordwacht.words';

/** g = green (to find), n = neutral, b = bomb. */
export type Kind = 'g' | 'n' | 'b';
export const BOARD_SIZE = 25;
export const ROUNDS = 9;

/**
 * Key layout as [kind for player 0, kind for player 1] pairs (25 in total, shuffled per game):
 * every player has 9 green and 3 bombs; 15 different green words in total.
 */
const KEY_PAIRS: [Kind, Kind][] = [
  ...Array(3).fill(['g', 'g']),
  ...Array(5).fill(['g', 'n']),
  ['g', 'b'],
  ...Array(5).fill(['n', 'g']),
  ['b', 'g'],
  ['b', 'b'],
  ['b', 'n'],
  ['n', 'b'],
  ...Array(7).fill(['n', 'n'])
];

export type Phase = 'give' | 'guess' | 'won' | 'lost';

export interface State {
  seed: number;
  names: [string, string];
  words: string[];
  /** keys[p][i]: what word i is on the key card of player p. */
  keys: [Kind[], Kind[]];
  found: boolean[];
  /** neutral[p][i]: word i was guessed while p gave the hint, and was neutral for p. */
  neutral: [boolean[], boolean[]];
  giver: number;
  phase: Phase;
  roundsLeft: number;
  clue: { word: string; count: number };
  guessesThisTurn: number;
  last: string;
  log: string[];
}

export type Action =
  | { type: 'CLUE'; word: string; count: number }
  | { type: 'GUESS'; index: number }
  | { type: 'STOP' };

export function newGame(names: [string, string], seed = newSeed()): State {
  const s: State = {
    seed,
    names,
    words: [],
    keys: [[], []],
    found: Array(BOARD_SIZE).fill(false),
    neutral: [Array(BOARD_SIZE).fill(false), Array(BOARD_SIZE).fill(false)],
    giver: 0,
    phase: 'give',
    roundsLeft: ROUNDS,
    clue: null,
    guessesThisTurn: 0,
    last: '',
    log: []
  };
  s.words = shuffle(s, WORDS.slice()).slice(0, BOARD_SIZE);
  const pairs = shuffle(s, KEY_PAIRS.map(p => p.slice() as [Kind, Kind]));
  s.keys = [pairs.map(p => p[0]), pairs.map(p => p[1])];
  s.last = names[0] + ' begint met een hint.';
  s.log.unshift(s.last);
  return s;
}

// ---------------------------------------------------------------- queries

export const guesser = (s: State) => 1 - s.giver;

export function greensLeftFor(s: State, p: number): number {
  return s.keys[p].filter((k, i) => k === 'g' && !s.found[i]).length;
}

export function totalGreensLeft(s: State): number {
  return s.found.filter((f, i) => !f && (s.keys[0][i] === 'g' || s.keys[1][i] === 'g')).length;
}

export function totalGreens(s: State): number {
  return s.keys[0].filter((k, i) => k === 'g' || s.keys[1][i] === 'g').length;
}

export function canGuess(s: State, i: number): boolean {
  return s.phase === 'guess' && i >= 0 && i < BOARD_SIZE && !s.found[i] && !s.neutral[s.giver][i];
}

export function isOver(s: State): boolean {
  return s.phase === 'won' || s.phase === 'lost';
}

// ---------------------------------------------------------------- reducer

export function reduce(state: State, a: Action): State {
  if (isOver(state)) {
    return state;
  }
  if (a.type === 'CLUE') {
    const word = (a.word || '').trim();
    if (state.phase !== 'give' || a.count < 0 || a.count > 9) {
      return state;
    }
    const s = clone(state);
    s.clue = { word, count: a.count };
    s.phase = 'guess';
    s.guessesThisTurn = 0;
    s.last = s.names[s.giver] + ' geeft de hint ' + (word ? '“' + word + '” ' : '') + a.count + '.';
    addLog(s, s.last);
    return s;
  }
  if (a.type === 'STOP') {
    if (state.phase !== 'guess' || state.guessesThisTurn === 0) {
      return state;
    }
    const s = clone(state);
    s.last = s.names[guesser(s)] + ' stopt met raden.';
    addLog(s, s.last);
    endTurn(s);
    return s;
  }
  // GUESS
  if (!canGuess(state, a.index)) {
    return state;
  }
  const s = clone(state);
  const kind = s.keys[s.giver][a.index];
  const word = s.words[a.index];
  const who = s.names[guesser(s)];
  s.guessesThisTurn++;
  if (kind === 'b') {
    s.phase = 'lost';
    s.last = who + ' kiest “' + word + '”: een bom! Het spel is voorbij.';
    addLog(s, s.last);
    return s;
  }
  if (kind === 'n') {
    s.neutral[s.giver][a.index] = true;
    s.last = who + ' kiest “' + word + '”: niet goed voor ' + s.names[s.giver] + '. De beurt is voorbij.';
    addLog(s, s.last);
    endTurn(s);
    return s;
  }
  s.found[a.index] = true;
  s.last = who + ' kiest “' + word + '”: goed!';
  addLog(s, s.last);
  if (totalGreensLeft(s) === 0) {
    s.phase = 'won';
    addLog(s, 'Alle ' + totalGreens(s) + ' woorden gevonden!');
    return s;
  }
  if (greensLeftFor(s, s.giver) === 0) {
    s.last += ' Alle woorden van ' + s.names[s.giver] + ' zijn gevonden.';
    endTurn(s);
  }
  return s;
}

function endTurn(s: State): void {
  s.roundsLeft--;
  if (s.roundsLeft <= 0) {
    s.phase = 'lost';
    addLog(s, 'De tijd is op: er waren nog ' + totalGreensLeft(s) + ' woorden over.');
    return;
  }
  // Switch giver, unless the other player has no green words left to give hints for.
  const other = 1 - s.giver;
  s.giver = greensLeftFor(s, other) > 0 ? other : s.giver;
  s.phase = 'give';
  s.clue = null;
  s.guessesThisTurn = 0;
}

function addLog(s: State, msg: string): void {
  s.log.unshift(msg);
  if (s.log.length > 80) {
    s.log.length = 80;
  }
}
