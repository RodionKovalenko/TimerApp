/**
 * Game rules for "Noodweer" as a pure reducer: (state, action) => state.
 *
 * The random generator state lives in GameState.seed, so the same sequence of
 * actions always produces the same game. That keeps undo honest and makes it
 * possible to sync games later by just forwarding actions.
 */
import { CITIES, CITY_ID, Color, THREATS } from './noodweer.map';

export const EPIDEMIC = -1;
export const ACTIONS_PER_TURN = 4;
export const HAND_LIMIT = 7;
export const MAX_OUTBREAKS = 8;
export const MAX_STATIONS = 6;

/** Balancing values (tuned with simulated games). */
export const RULES = {
  cardsToCure: 3,
  cubesPerColor: 20,
  rateTrack: [2, 2, 2, 3, 3, 4, 4],
  /** Cubes per initially infected city; each entry is one city. */
  setup: [3, 3, 3, 2, 2, 2, 1, 1, 1]
};
const START_HAND: { [players: number]: number } = { 1: 4, 2: 4, 3: 3, 4: 2 };

export type Phase = 'actions' | 'discard' | 'won' | 'lost';

export interface Player {
  name: string;
  city: number;
  hand: number[];
}

export interface GameState {
  seed: number;
  turn: number;
  players: Player[];
  current: number;
  actionsLeft: number;
  phase: Phase;
  /** Player who has to discard down to the hand limit. */
  discardPlayer: number;
  /** What happens after the discard: back to actions or continue with infecting. */
  afterDiscard: 'actions' | 'infect';
  cubes: number[][];
  supply: number[];
  stations: number[];
  outbreaks: number;
  rateIndex: number;
  cured: boolean[];
  eradicated: boolean[];
  /** Index 0 is the top of a deck. */
  playerDeck: number[];
  playerDiscard: number[];
  infectDeck: number[];
  infectDiscard: number[];
  epidemics: number;
  log: string[];
  lastDrawn: number[];
  lastInfected: string[];
  endReason: string;
}

export type Action =
  | { type: 'DRIVE'; to: number }
  | { type: 'DIRECT'; to: number }
  | { type: 'CHARTER'; to: number }
  | { type: 'SHUTTLE'; to: number }
  | { type: 'BUILD' }
  | { type: 'TREAT'; color: Color }
  | { type: 'GIVE'; to: number }
  | { type: 'TAKE'; from: number }
  | { type: 'CURE'; color: Color }
  | { type: 'PASS' }
  | { type: 'DISCARD'; card: number };

export interface NewGameOptions {
  names: string[];
  epidemics: number;
  seed?: number;
}

// ---------------------------------------------------------------- random

/** mulberry32: returns a float in [0, 1) and advances s.seed. */
function random(s: GameState): number {
  s.seed = (s.seed + 0x6D2B79F5) | 0;
  let t = s.seed;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

function shuffle<T>(s: GameState, list: T[]): T[] {
  for (let i = list.length - 1; i > 0; i--) {
    const j = Math.floor(random(s) * (i + 1));
    [list[i], list[j]] = [list[j], list[i]];
  }
  return list;
}

// ---------------------------------------------------------------- setup

export function newGame(opts: NewGameOptions): GameState {
  const names = opts.names.filter(n => n.trim()).slice(0, 4);
  const homes = [CITY_ID('Essen'), CITY_ID('Amersfoort')];
  const s: GameState = {
    seed: (opts.seed !== undefined ? opts.seed : Math.floor(Math.random() * 2 ** 31)) | 0,
    turn: 1,
    players: names.map((name, i) => ({ name: name.trim(), city: homes[i % 2], hand: [] })),
    current: 0,
    actionsLeft: ACTIONS_PER_TURN,
    phase: 'actions',
    discardPlayer: -1,
    afterDiscard: 'actions',
    cubes: CITIES.map(() => [0, 0, 0, 0]),
    supply: [0, 1, 2, 3].map(() => RULES.cubesPerColor),
    stations: homes.slice(),
    outbreaks: 0,
    rateIndex: 0,
    cured: [false, false, false, false],
    eradicated: [false, false, false, false],
    playerDeck: [],
    playerDiscard: [],
    infectDeck: [],
    infectDiscard: [],
    epidemics: opts.epidemics,
    log: [],
    lastDrawn: [],
    lastInfected: [],
    endReason: ''
  };

  // Initial threats.
  s.infectDeck = shuffle(s, CITIES.map(c => c.id));
  for (const amount of RULES.setup) {
    const id = s.infectDeck.shift();
    const color = CITIES[id].color;
    s.cubes[id][color] += amount;
    s.supply[color] -= amount;
    s.infectDiscard.push(id);
    s.lastInfected.push(CITIES[id].name + ' +' + amount);
  }

  // Deal city cards, then hide one Noodweer card in each part of the deck.
  const deck = shuffle(s, CITIES.map(c => c.id));
  const handSize = START_HAND[s.players.length] || 2;
  for (const p of s.players) {
    p.hand = deck.splice(0, handSize);
  }
  const piles: number[][] = [];
  const n = Math.max(1, opts.epidemics);
  let start = 0;
  for (let i = 0; i < n; i++) {
    const size = Math.floor(deck.length / n) + (i < deck.length % n ? 1 : 0);
    const pile = deck.slice(start, start + size);
    start += size;
    pile.push(EPIDEMIC);
    piles.push(shuffle(s, pile));
  }
  s.playerDeck = [].concat(...piles);

  addLog(s, 'Het noodweer begint. ' + s.players[0].name + ' is aan de beurt.');
  return s;
}

// ---------------------------------------------------------------- queries

export const cityName = (id: number) => CITIES[id].name;

export function isOver(s: GameState): boolean {
  return s.phase === 'won' || s.phase === 'lost';
}

export function canAct(s: GameState): boolean {
  return s.phase === 'actions' && s.actionsLeft > 0;
}

export function me(s: GameState): Player {
  return s.players[s.current];
}

export function canDrive(s: GameState, to: number): boolean {
  return canAct(s) && CITIES[me(s).city].neighbors.indexOf(to) >= 0;
}

export function canDirect(s: GameState, to: number): boolean {
  return canAct(s) && to !== me(s).city && me(s).hand.indexOf(to) >= 0;
}

export function canCharter(s: GameState, to: number): boolean {
  return canAct(s) && to !== me(s).city && me(s).hand.indexOf(me(s).city) >= 0;
}

export function canShuttle(s: GameState, to: number): boolean {
  return canAct(s) && to !== me(s).city
    && s.stations.indexOf(me(s).city) >= 0 && s.stations.indexOf(to) >= 0;
}

export function canBuild(s: GameState): boolean {
  const p = me(s);
  return canAct(s) && s.stations.length < MAX_STATIONS
    && s.stations.indexOf(p.city) < 0 && p.hand.indexOf(p.city) >= 0;
}

export function canTreat(s: GameState, color: Color): boolean {
  return canAct(s) && s.cubes[me(s).city][color] > 0;
}

/** Players (other than the current one) standing in the same city. */
export function partners(s: GameState): number[] {
  return s.players
    .map((p, i) => i)
    .filter(i => i !== s.current && s.players[i].city === me(s).city);
}

export function canGive(s: GameState, to: number): boolean {
  return canAct(s) && partners(s).indexOf(to) >= 0 && me(s).hand.indexOf(me(s).city) >= 0;
}

export function canTake(s: GameState, from: number): boolean {
  return canAct(s) && partners(s).indexOf(from) >= 0
    && s.players[from].hand.indexOf(me(s).city) >= 0;
}

export function cardsOfColor(hand: number[], color: Color): number[] {
  return hand.filter(id => CITIES[id].color === color);
}

export function canCure(s: GameState, color: Color): boolean {
  return canAct(s) && !s.cured[color] && s.stations.indexOf(me(s).city) >= 0
    && cardsOfColor(me(s).hand, color).length >= RULES.cardsToCure;
}

export function infectionRate(s: GameState): number {
  return RULES.rateTrack[s.rateIndex];
}

// ---------------------------------------------------------------- reducer

export function reduce(state: GameState, action: Action): GameState {
  if (isOver(state)) {
    return state;
  }
  if (!isLegal(state, action)) {
    return state;
  }
  const s: GameState = JSON.parse(JSON.stringify(state));
  const p = me(s);
  s.log = state.log.slice();

  switch (action.type) {
    case 'DRIVE':
      p.city = action.to;
      addLog(s, p.name + ' rijdt naar ' + cityName(action.to) + '.');
      break;
    case 'DIRECT':
      discardFromHand(s, p, action.to);
      p.city = action.to;
      addLog(s, p.name + ' vliegt naar ' + cityName(action.to) + '.');
      break;
    case 'CHARTER':
      discardFromHand(s, p, p.city);
      p.city = action.to;
      addLog(s, p.name + ' charterde een vlucht naar ' + cityName(action.to) + '.');
      break;
    case 'SHUTTLE':
      p.city = action.to;
      addLog(s, p.name + ' pendelt naar de hulppost in ' + cityName(action.to) + '.');
      break;
    case 'BUILD':
      discardFromHand(s, p, p.city);
      s.stations.push(p.city);
      addLog(s, p.name + ' bouwt een hulppost in ' + cityName(p.city) + '.');
      break;
    case 'TREAT': {
      const amount = s.cured[action.color] ? s.cubes[p.city][action.color] : 1;
      s.cubes[p.city][action.color] -= amount;
      s.supply[action.color] += amount;
      addLog(s, p.name + ' ruimt ' + amount + 'x ' + THREATS[action.color].short
        + ' op in ' + cityName(p.city) + '.');
      checkEradicated(s, action.color);
      break;
    }
    case 'GIVE':
      moveCard(s, p, s.players[action.to], p.city);
      addLog(s, p.name + ' geeft ' + cityName(p.city) + ' aan ' + s.players[action.to].name + '.');
      break;
    case 'TAKE':
      moveCard(s, s.players[action.from], p, p.city);
      addLog(s, p.name + ' krijgt ' + cityName(p.city) + ' van ' + s.players[action.from].name + '.');
      break;
    case 'CURE': {
      const used = cardsOfColor(p.hand, action.color).slice(0, RULES.cardsToCure);
      used.forEach(id => discardFromHand(s, p, id));
      s.cured[action.color] = true;
      addLog(s, p.name + ' bedwingt ' + THREATS[action.color].name + '!');
      checkEradicated(s, action.color);
      if (s.cured.every(c => c)) {
        s.phase = 'won';
        s.endReason = 'Alle vier de soorten noodweer zijn bedwongen.';
        addLog(s, 'Gewonnen! ' + s.endReason);
        return s;
      }
      break;
    }
    case 'PASS':
      addLog(s, p.name + ' slaat de overige acties over.');
      s.actionsLeft = 0;
      endTurn(s);
      return s;
    case 'DISCARD': {
      const holder = s.players[s.discardPlayer];
      discardFromHand(s, holder, action.card);
      addLog(s, holder.name + ' legt ' + cityName(action.card) + ' af.');
      if (holder.hand.length <= HAND_LIMIT) {
        continueAfterDiscard(s);
      }
      return s;
    }
  }

  s.actionsLeft--;
  // Handing over a card can push a hand over the limit, even during the actions.
  // (After the last action endTurn() checks the hand limit itself, after drawing.)
  const over = s.players.findIndex(pl => pl.hand.length > HAND_LIMIT);
  if (over >= 0 && s.actionsLeft > 0) {
    s.phase = 'discard';
    s.discardPlayer = over;
    s.afterDiscard = 'actions';
    return s;
  }
  if (s.actionsLeft === 0) {
    endTurn(s);
  }
  return s;
}

export function isLegal(s: GameState, a: Action): boolean {
  switch (a.type) {
    case 'DRIVE': return canDrive(s, a.to);
    case 'DIRECT': return canDirect(s, a.to);
    case 'CHARTER': return canCharter(s, a.to);
    case 'SHUTTLE': return canShuttle(s, a.to);
    case 'BUILD': return canBuild(s);
    case 'TREAT': return canTreat(s, a.color);
    case 'GIVE': return canGive(s, a.to);
    case 'TAKE': return canTake(s, a.from);
    case 'CURE': return canCure(s, a.color);
    case 'PASS': return s.phase === 'actions';
    case 'DISCARD':
      return s.phase === 'discard' && s.players[s.discardPlayer].hand.indexOf(a.card) >= 0;
  }
  return false;
}

// ---------------------------------------------------------------- turn flow

function endTurn(s: GameState): void {
  const p = me(s);
  s.lastDrawn = [];
  s.lastInfected = [];

  for (let i = 0; i < 2; i++) {
    if (s.playerDeck.length === 0) {
      lose(s, 'De stapel stadskaarten is op: de tijd is verstreken.');
      return;
    }
    const card = s.playerDeck.shift();
    s.lastDrawn.push(card);
    if (card === EPIDEMIC) {
      epidemic(s);
      if (isOver(s)) {
        return;
      }
    } else {
      p.hand.push(card);
    }
  }
  const names = s.lastDrawn.map(c => c === EPIDEMIC ? 'NOODWEER!' : cityName(c));
  addLog(s, p.name + ' trekt ' + names.join(' en ') + '.');

  const over = s.players.findIndex(pl => pl.hand.length > HAND_LIMIT);
  if (over >= 0) {
    s.phase = 'discard';
    s.discardPlayer = over;
    s.afterDiscard = 'infect';
    return;
  }
  infectStep(s);
}

function continueAfterDiscard(s: GameState): void {
  const over = s.players.findIndex(pl => pl.hand.length > HAND_LIMIT);
  if (over >= 0) {
    s.discardPlayer = over;
    return;
  }
  s.discardPlayer = -1;
  if (s.afterDiscard === 'infect') {
    infectStep(s);
  } else {
    s.phase = 'actions';
  }
}

function infectStep(s: GameState): void {
  const n = infectionRate(s);
  for (let i = 0; i < n; i++) {
    if (s.infectDeck.length === 0) {
      s.infectDeck = shuffle(s, s.infectDiscard);
      s.infectDiscard = [];
    }
    const id = s.infectDeck.shift();
    s.infectDiscard.push(id);
    const color = CITIES[id].color;
    if (s.eradicated[color]) {
      s.lastInfected.push(cityName(id) + ' (verdwenen)');
      continue;
    }
    s.lastInfected.push(cityName(id));
    infect(s, id, color, new Set<number>());
    if (isOver(s)) {
      return;
    }
  }
  addLog(s, 'Het noodweer treft ' + s.lastInfected.join(', ') + '.');

  s.current = (s.current + 1) % s.players.length;
  s.actionsLeft = ACTIONS_PER_TURN;
  s.phase = 'actions';
  s.turn++;
  addLog(s, me(s).name + ' is aan de beurt.');
}

function epidemic(s: GameState): void {
  s.rateIndex = Math.min(s.rateIndex + 1, RULES.rateTrack.length - 1);
  const id = s.infectDeck.pop();
  const color = CITIES[id].color;
  addLog(s, 'NOODWEER! ' + cityName(id) + ' wordt zwaar getroffen.');
  s.lastInfected.push(cityName(id) + ' (noodweer)');
  if (!s.eradicated[color]) {
    const outbreakSet = new Set<number>();
    for (let i = 0; i < 3 && !isOver(s); i++) {
      infect(s, id, color, outbreakSet);
    }
  }
  s.infectDiscard.push(id);
  if (isOver(s)) {
    return;
  }
  s.infectDeck = shuffle(s, s.infectDiscard).concat(s.infectDeck);
  s.infectDiscard = [];
}

/** Adds one cube; a fourth cube becomes an outbreak that chains to the neighbors. */
function infect(s: GameState, id: number, color: Color, outbreakSet: Set<number>): void {
  if (isOver(s)) {
    return;
  }
  if (s.cubes[id][color] < 3) {
    if (s.supply[color] <= 0) {
      lose(s, 'Er zijn geen blokjes ' + THREATS[color].short + ' meer over.');
      return;
    }
    s.cubes[id][color]++;
    s.supply[color]--;
    return;
  }
  if (outbreakSet.has(id)) {
    return;
  }
  outbreakSet.add(id);
  s.outbreaks++;
  addLog(s, 'Uitbraak in ' + cityName(id) + '!');
  if (s.outbreaks >= MAX_OUTBREAKS) {
    lose(s, MAX_OUTBREAKS + ' uitbraken: het noodweer is niet meer te stoppen.');
    return;
  }
  for (const n of CITIES[id].neighbors) {
    infect(s, n, color, outbreakSet);
  }
}

// ---------------------------------------------------------------- helpers

function discardFromHand(s: GameState, p: Player, card: number): void {
  const i = p.hand.indexOf(card);
  if (i >= 0) {
    p.hand.splice(i, 1);
    s.playerDiscard.push(card);
  }
}

function moveCard(s: GameState, from: Player, to: Player, card: number): void {
  from.hand.splice(from.hand.indexOf(card), 1);
  to.hand.push(card);
}

function checkEradicated(s: GameState, color: Color): void {
  if (s.cured[color] && !s.eradicated[color] && s.cubes.every(c => c[color] === 0)) {
    s.eradicated[color] = true;
    addLog(s, THREATS[color].name + ' is voorgoed verdwenen.');
  }
}

function lose(s: GameState, reason: string): void {
  s.phase = 'lost';
  s.endReason = reason;
  addLog(s, 'Verloren. ' + reason);
}

function addLog(s: GameState, msg: string): void {
  s.log.unshift(msg);
  if (s.log.length > 80) {
    s.log.length = 80;
  }
}
