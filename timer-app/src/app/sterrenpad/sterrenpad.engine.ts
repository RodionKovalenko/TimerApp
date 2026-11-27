/**
 * "Sterrenpad": a cooperative card game where you see everyone's cards except your own.
 * Rules as a pure reducer: (state, action) => state.
 */
import { clone, newSeed, shuffle } from '../shared/seeded-random';

export const COLORS = [
  { name: 'rood', hex: '#d64541' },
  { name: 'geel', hex: '#e2a90f' },
  { name: 'groen', hex: '#2e9d5b' },
  { name: 'blauw', hex: '#2f6fd6' },
  { name: 'paars', hex: '#8e5bd6' }
];
export const VALUES = [1, 2, 3, 4, 5];
/** How many copies of each value exist per color. */
const COPIES: { [value: number]: number } = { 1: 3, 2: 2, 3: 2, 4: 2, 5: 1 };
export const MAX_WHISPERS = 8;
export const MAX_CLOUDS = 3;
export const MAX_SCORE = COLORS.length * 5;

export interface Card {
  id: number;
  color: number;
  value: number;
}

/** A card in a hand plus what its owner knows about it from hints. */
export interface HandCard {
  card: Card;
  knowColor: boolean;
  knowValue: boolean;
  notColors: number[];
  notValues: number[];
}

export interface Player {
  name: string;
  hand: HandCard[];
}

export type Phase = 'playing' | 'won' | 'lost' | 'ended';

export interface State {
  seed: number;
  turn: number;
  players: Player[];
  current: number;
  deck: Card[];
  /** Highest value played per color (0 = nothing yet). */
  stacks: number[];
  discard: Card[];
  whispers: number;
  clouds: number;
  /** -1 while the deck still has cards; then the number of turns left. */
  finalTurns: number;
  phase: Phase;
  /** Public description of the last action, shown on the hand-over screen. */
  last: string;
  log: string[];
}

export type Action =
  | { type: 'HINT'; target: number; color?: number; value?: number }
  | { type: 'PLAY'; index: number }
  | { type: 'DISCARD'; index: number };

// ---------------------------------------------------------------- setup

export function newGame(names: string[], seed = newSeed()): State {
  const s: State = {
    seed,
    turn: 1,
    players: names.map(name => ({ name, hand: [] })),
    current: 0,
    deck: [],
    stacks: COLORS.map(() => 0),
    discard: [],
    whispers: MAX_WHISPERS,
    clouds: 0,
    finalTurns: -1,
    phase: 'playing',
    last: '',
    log: []
  };
  let id = 0;
  COLORS.forEach((c, color) => VALUES.forEach(value => {
    for (let i = 0; i < COPIES[value]; i++) {
      s.deck.push({ id: id++, color, value });
    }
  }));
  shuffle(s, s.deck);
  const handSize = names.length <= 3 ? 5 : 4;
  for (const p of s.players) {
    for (let i = 0; i < handSize; i++) {
      p.hand.push(fresh(s.deck.shift()));
    }
  }
  s.last = 'Het spel begint. ' + names[0] + ' mag beginnen.';
  s.log.unshift(s.last);
  return s;
}

function fresh(card: Card): HandCard {
  return { card, knowColor: false, knowValue: false, notColors: [], notValues: [] };
}

// ---------------------------------------------------------------- queries

export const cardLabel = (c: Card) => COLORS[c.color].name + ' ' + c.value;

export function score(s: State): number {
  return s.stacks.reduce((a, b) => a + b, 0);
}

export function isOver(s: State): boolean {
  return s.phase !== 'playing';
}

export function isPlayable(s: State, c: Card): boolean {
  return s.stacks[c.color] === c.value - 1;
}

/** Indexes of the cards a hint would touch. */
export function touched(s: State, target: number, color?: number, value?: number): number[] {
  const out: number[] = [];
  s.players[target].hand.forEach((h, i) => {
    if ((color !== undefined && h.card.color === color) || (value !== undefined && h.card.value === value)) {
      out.push(i);
    }
  });
  return out;
}

export function canHint(s: State, target: number, color?: number, value?: number): boolean {
  return s.phase === 'playing' && s.whispers > 0 && target !== s.current
    && target >= 0 && target < s.players.length
    && (color === undefined) !== (value === undefined)
    && touched(s, target, color, value).length > 0;
}

export function canDiscard(s: State): boolean {
  return s.phase === 'playing' && s.whispers < MAX_WHISPERS;
}

/** How many copies of a card are still unseen or not yet thrown away (for "last copy" warnings). */
export function copiesLeft(s: State, color: number, value: number): number {
  return COPIES[value] - s.discard.filter(c => c.color === color && c.value === value).length;
}

// ---------------------------------------------------------------- reducer

export function reduce(state: State, a: Action): State {
  if (isOver(state)) {
    return state;
  }
  const me = state.players[state.current];
  switch (a.type) {
    case 'HINT':
      if (!canHint(state, a.target, a.color, a.value)) {
        return state;
      }
      break;
    case 'PLAY':
      if (!me.hand[a.index]) {
        return state;
      }
      break;
    case 'DISCARD':
      if (!me.hand[a.index] || !canDiscard(state)) {
        return state;
      }
      break;
  }

  const s = clone(state);
  const p = s.players[s.current];

  if (a.type === 'HINT') {
    const target = s.players[a.target];
    const idx = touched(s, a.target, a.color, a.value);
    target.hand.forEach((h, i) => {
      const hit = idx.indexOf(i) >= 0;
      if (a.color !== undefined) {
        if (hit) {
          h.knowColor = true;
        } else if (h.notColors.indexOf(a.color) < 0) {
          h.notColors.push(a.color);
        }
      } else {
        if (hit) {
          h.knowValue = true;
        } else if (h.notValues.indexOf(a.value) < 0) {
          h.notValues.push(a.value);
        }
      }
    });
    s.whispers--;
    const what = a.color !== undefined ? COLORS[a.color].name : String(a.value);
    const positions = idx.map(i => i + 1).join(', ');
    s.last = p.name + ' fluistert ' + target.name + ': “kaart ' + positions + (idx.length > 1 ? ' zijn ' : ' is ')
      + what + '”.';
  } else if (a.type === 'PLAY') {
    const [h] = p.hand.splice(a.index, 1);
    const c = h.card;
    if (isPlayable(s, c)) {
      s.stacks[c.color] = c.value;
      s.last = p.name + ' legt ' + cardLabel(c) + ': gelukt!';
      if (c.value === 5 && s.whispers < MAX_WHISPERS) {
        s.whispers++;
        s.last += ' Het sterrenbeeld ' + COLORS[c.color].name + ' is compleet, er komt een fluistering terug.';
      }
    } else {
      s.discard.push(c);
      s.clouds++;
      s.last = p.name + ' probeert ' + cardLabel(c) + ', maar die past niet. Er schuift een wolk voor de sterren.';
    }
    draw(s, p);
  } else {
    const [h] = p.hand.splice(a.index, 1);
    s.discard.push(h.card);
    s.whispers++;
    s.last = p.name + ' legt ' + cardLabel(h.card) + ' af en krijgt een fluistering terug.';
    draw(s, p);
  }
  s.log = [s.last].concat(s.log).slice(0, 100);

  // End conditions.
  if (s.clouds >= MAX_CLOUDS) {
    s.phase = 'lost';
    s.log.unshift('De hemel is helemaal bewolkt. Het spel is voorbij.');
    return s;
  }
  if (score(s) === MAX_SCORE) {
    s.phase = 'won';
    s.log.unshift('Alle sterrenbeelden zijn compleet!');
    return s;
  }
  if (s.finalTurns > 0) {
    s.finalTurns--;
    if (s.finalTurns === 0) {
      s.phase = 'ended';
      s.log.unshift('De stapel is op en iedereen heeft zijn laatste beurt gehad.');
      return s;
    }
  } else if (s.finalTurns === -1 && s.deck.length === 0) {
    // The last card was just drawn: everyone, including this player, gets one more turn after this one.
    s.finalTurns = s.players.length;
    s.log.unshift('De stapel is op: iedereen krijgt nog één beurt.');
  }

  s.current = (s.current + 1) % s.players.length;
  s.turn++;
  return s;
}

function draw(s: State, p: Player): void {
  if (s.deck.length) {
    p.hand.push(fresh(s.deck.shift()));
  }
}
