/**
 * "Moestuin": a two-player tile laying game. Plant garden beds (polyominoes) in your own 9x9 garden,
 * pay with seeds, and spend days on a shared season track. Rules as a pure reducer.
 */
import { clone, newSeed, shuffle } from '../shared/seeded-random';

export const SIZE = 9;
export const SEASON_END = 50;
export const START_SEEDS = 5;
/** Harvest days: passing one pays out seeds for every watering can in your garden. */
export const HARVEST_DAYS = [5, 11, 17, 23, 29, 35, 41, 47];
/** The first player to pass one of these days gets a free 1x1 sunflower patch. */
export const SUNFLOWER_DAYS = [20, 26, 32, 38, 44];
export const BONUS_SQUARE = 7;
export const BONUS_POINTS = 7;
export const EMPTY_PENALTY = 2;

export interface TileDef {
  id: number;
  name: string;
  /** Rows of the shape; '#' is a cell. */
  shape: string[];
  cost: number;
  days: number;
  /** Watering cans: seeds earned on each harvest day. */
  cans: number;
}

/** Original tile set for this game. */
const TILE_DATA: [string, string[], number, number, number][] = [
  ['Radijsjes', ['##'], 2, 1, 0],
  ['Bieslook', ['###'], 2, 2, 0],
  ['Peterselie', ['###'], 3, 1, 0],
  ['Sla', ['#.', '##'], 3, 1, 0],
  ['Spinazie', ['#.', '##'], 1, 3, 0],
  ['Prei', ['####'], 3, 3, 1],
  ['Kool', ['##', '##'], 6, 5, 2],
  ['Bonen', ['###', '.#.'], 2, 2, 0],
  ['Courgette', ['.##', '##.'], 7, 6, 3],
  ['Wortels', ['#..', '###'], 4, 2, 1],
  ['Bietjes', ['..#', '###'], 3, 4, 1],
  ['Asperges', ['#####'], 7, 1, 1],
  ['Aardappels', ['##', '##', '#.'], 5, 4, 2],
  ['Erwten', ['#.#', '###'], 1, 2, 0],
  ['Maïs', ['###', '.#.', '.#.'], 5, 5, 2],
  ['Kruidenkruis', ['.#.', '###', '.#.'], 4, 2, 1],
  ['Tomaten', ['#..', '##.', '.##'], 10, 4, 3],
  ['Pompoen', ['##.', '.#.', '.##'], 2, 3, 0],
  ['Aardbeien', ['#..', '#..', '###'], 6, 4, 2],
  ['Uien', ['.###', '##..'], 4, 3, 1],
  ['Knoflook', ['#...', '####'], 3, 3, 1],
  ['Venkel', ['.#..', '####'], 3, 4, 1],
  ['Rabarber', ['#.#', '###', '#.#'], 3, 6, 2],
  ['Bessenstruik', ['####', '#..#'], 1, 5, 1],
  ['Paprika', ['.##.', '####'], 7, 4, 2],
  ['Groentebak', ['###', '###'], 8, 6, 3],
  ['Pastinaak', ['#...', '####', '#...'], 2, 3, 0],
  ['Komkommer', ['##..', '.###', '.#..'], 5, 3, 1],
  ['Kruidentuin', ['.##.', '####', '.##.'], 5, 4, 2],
  ['Andijvie', ['###', '#..'], 4, 6, 2],
  ['Trap van bonen', ['##..', '.##.', '..##'], 7, 6, 3],
  ['Druivenrank', ['#####', '#...#'], 1, 4, 0],
  ['Meloenen', ['###', '###', '.#.'], 6, 5, 2],
  ['Boerenkool', ['##.', '###', '.##'], 7, 6, 3],
  ['Zuring', ['.#.', '###', '#.#'], 3, 3, 1],
  ['Kerstboompjes', ['..#..', '.###.', '#####'], 8, 6, 2],
  ['Bloemkool', ['##.', '###', '##.'], 5, 5, 2],
  ['Kruisbessen', ['#.#.', '####', '.#.#'], 3, 5, 1],
  ['Snijbonen', ['#...', '#...', '####'], 2, 4, 0]
];

export const TILES: TileDef[] = TILE_DATA.map(([name, shape, cost, days, cans], id) => ({
  id, name, shape, cost, days, cans
}));

export type Cell = [number, number];

export interface Player {
  name: string;
  day: number;
  seeds: number;
  /** grid[row][col]: -1 empty, otherwise tile id (SUNFLOWER for a 1x1 patch). */
  grid: number[][];
  cans: number;
  bonus: boolean;
}

export const SUNFLOWER = 99;

export type Phase = 'choose' | 'sunflower' | 'over';

export interface State {
  seed: number;
  players: Player[];
  /** Tile ids in a circle; the market is the next three after the marker. */
  circle: number[];
  marker: number;
  current: number;
  /** Player who arrived last on a day goes first on a tie. */
  lastArrived: number;
  sunflowersTaken: number[];
  bonusTaken: boolean;
  phase: Phase;
  /** Player who still has to place a sunflower patch. */
  sunflowerFor: number;
  log: string[];
}

export type Action =
  | { type: 'BUY'; pick: number; cells: Cell[] }
  | { type: 'WAIT' }
  | { type: 'SUNFLOWER'; cell: Cell };

// ---------------------------------------------------------------- shapes

/** Cells of a shape after rotation (0-3 quarter turns) and optional mirror, normalized to (0,0). */
export function orient(shape: string[], rotation: number, mirror: boolean): Cell[] {
  let cells: Cell[] = [];
  shape.forEach((row, r) => row.split('').forEach((ch, c) => {
    if (ch === '#') {
      cells.push([r, c]);
    }
  }));
  if (mirror) {
    cells = cells.map(([r, c]) => [r, -c] as Cell);
  }
  for (let i = 0; i < ((rotation % 4) + 4) % 4; i++) {
    cells = cells.map(([r, c]) => [c, -r] as Cell);
  }
  const minR = Math.min(...cells.map(x => x[0]));
  const minC = Math.min(...cells.map(x => x[1]));
  return cells.map(([r, c]) => [r - minR, c - minC] as Cell);
}

export function size(shape: string[]): number {
  return shape.join('').split('').filter(ch => ch === '#').length;
}

/** Same set of cells as some orientation of the tile, placed anywhere. */
function matchesShape(shape: string[], cells: Cell[]): boolean {
  if (cells.length !== size(shape)) {
    return false;
  }
  const minR = Math.min(...cells.map(x => x[0]));
  const minC = Math.min(...cells.map(x => x[1]));
  const key = (cs: Cell[]) => cs.map(([r, c]) => r + ',' + c).sort().join(';');
  const target = key(cells.map(([r, c]) => [r - minR, c - minC] as Cell));
  for (const mirror of [false, true]) {
    for (let rot = 0; rot < 4; rot++) {
      if (key(orient(shape, rot, mirror)) === target) {
        return true;
      }
    }
  }
  return false;
}

export function fits(grid: number[][], cells: Cell[]): boolean {
  return cells.every(([r, c]) => r >= 0 && c >= 0 && r < SIZE && c < SIZE && grid[r][c] === -1);
}

/** Is there any position/orientation where the tile fits? */
export function canPlaceAnywhere(grid: number[][], shape: string[]): boolean {
  for (const mirror of [false, true]) {
    for (let rot = 0; rot < 4; rot++) {
      const cells = orient(shape, rot, mirror);
      for (let r = 0; r < SIZE; r++) {
        for (let c = 0; c < SIZE; c++) {
          if (fits(grid, cells.map(([a, b]) => [a + r, b + c] as Cell))) {
            return true;
          }
        }
      }
    }
  }
  return false;
}

// ---------------------------------------------------------------- setup

export function newGame(names: [string, string], seed = newSeed()): State {
  const s: State = {
    seed,
    players: names.map(name => ({
      name, day: 0, seeds: START_SEEDS, cans: 0, bonus: false,
      grid: Array.from({ length: SIZE }, () => Array(SIZE).fill(-1))
    })),
    circle: [],
    marker: 0,
    current: 0,
    lastArrived: 1,
    sunflowersTaken: [],
    bonusTaken: false,
    phase: 'choose',
    sunflowerFor: -1,
    log: []
  };
  // The smallest tile sits just before the marker, so it is offered last; the rest is shuffled.
  const rest = shuffle(s, TILES.slice(1).map(t => t.id));
  s.circle = [0].concat(rest);
  s.marker = 1;
  s.log.unshift('Het seizoen begint. ' + names[0] + ' mag beginnen.');
  return s;
}

// ---------------------------------------------------------------- queries

/** The (up to) three tiles that can be bought, as indexes into the circle. */
export function market(s: State): number[] {
  const n = s.circle.length;
  const out: number[] = [];
  for (let k = 0; k < Math.min(3, n); k++) {
    out.push((s.marker + k) % n);
  }
  return out;
}

export function canAfford(s: State, tileId: number): boolean {
  return s.players[s.current].seeds >= TILES[tileId].cost;
}

export function emptyCells(p: Player): number {
  return p.grid.reduce((t, row) => t + row.filter(v => v === -1).length, 0);
}

export function finalScore(p: Player): number {
  return p.seeds + (p.bonus ? BONUS_POINTS : 0) - EMPTY_PENALTY * emptyCells(p);
}

/** Who plays next: the one furthest behind; on a tie the one who arrived last. */
function nextPlayer(s: State): number {
  const [a, b] = s.players;
  if (a.day !== b.day) {
    return a.day < b.day ? 0 : 1;
  }
  return s.lastArrived;
}

function hasBonusSquare(grid: number[][]): boolean {
  for (let r = 0; r + BONUS_SQUARE <= SIZE; r++) {
    for (let c = 0; c + BONUS_SQUARE <= SIZE; c++) {
      let full = true;
      for (let i = 0; i < BONUS_SQUARE && full; i++) {
        for (let j = 0; j < BONUS_SQUARE && full; j++) {
          full = grid[r + i][c + j] !== -1;
        }
      }
      if (full) {
        return true;
      }
    }
  }
  return false;
}

// ---------------------------------------------------------------- reducer

export function reduce(state: State, a: Action): State {
  if (state.phase === 'over') {
    return state;
  }
  const me = state.players[state.current];

  if (a.type === 'SUNFLOWER') {
    if (state.phase !== 'sunflower' || !fits(state.players[state.sunflowerFor].grid, [a.cell])) {
      return state;
    }
    const s = clone(state);
    const p = s.players[s.sunflowerFor];
    p.grid[a.cell[0]][a.cell[1]] = SUNFLOWER;
    addLog(s, p.name + ' plant een zonnebloem.');
    checkBonus(s, p);
    s.phase = 'choose';
    s.sunflowerFor = -1;
    advance(s);
    return s;
  }
  if (state.phase !== 'choose') {
    return state;
  }

  if (a.type === 'WAIT') {
    const s = clone(state);
    const p = s.players[s.current];
    const other = s.players[1 - s.current];
    const to = Math.min(SEASON_END, other.day + 1);
    const gain = to - p.day;
    p.seeds += gain;
    addLog(s, p.name + ' wacht ' + gain + (gain === 1 ? ' dag' : ' dagen') + ' en verzamelt ' + gain + ' zaadjes.');
    move(s, s.current, to);
    return s;
  }

  // BUY
  const marketIdx = market(state);
  if (a.pick < 0 || a.pick >= marketIdx.length) {
    return state;
  }
  const circleIdx = marketIdx[a.pick];
  const tile = TILES[state.circle[circleIdx]];
  if (me.seeds < tile.cost || !matchesShape(tile.shape, a.cells) || !fits(me.grid, a.cells)) {
    return state;
  }
  const s = clone(state);
  const p = s.players[s.current];
  p.seeds -= tile.cost;
  a.cells.forEach(([r, c]) => p.grid[r][c] = tile.id);
  p.cans += tile.cans;
  s.circle.splice(circleIdx, 1);
  s.marker = s.circle.length ? circleIdx % s.circle.length : 0;
  addLog(s, p.name + ' plant ' + tile.name + ' (' + tile.cost + ' zaadjes, ' + tile.days
    + (tile.days === 1 ? ' dag' : ' dagen') + ').');
  checkBonus(s, p);
  move(s, s.current, Math.min(SEASON_END, p.day + tile.days));
  return s;
}

/** Moves a player along the season track, handling harvests and sunflowers, then picks who is next. */
function move(s: State, who: number, to: number): void {
  const p = s.players[who];
  const from = p.day;
  p.day = to;
  s.lastArrived = who;
  for (const d of HARVEST_DAYS) {
    if (from < d && d <= to && p.cans > 0) {
      p.seeds += p.cans;
      addLog(s, 'Oogst voor ' + p.name + ': ' + p.cans + ' zaadjes.');
    }
  }
  for (const d of SUNFLOWER_DAYS) {
    if (from < d && d <= to && s.sunflowersTaken.indexOf(d) < 0) {
      s.sunflowersTaken.push(d);
      if (emptyCells(p) > 0) {
        s.phase = 'sunflower';
        s.sunflowerFor = who;
        addLog(s, p.name + ' krijgt een zonnebloem om te planten.');
        // Only one sunflower can be pending; a second one on the same move is rare and also handled
        // because the next one stays available for whoever passes it next.
        break;
      }
    }
  }
  if (s.phase === 'sunflower') {
    return;
  }
  advance(s);
}

function advance(s: State): void {
  if (s.players.every(p => p.day >= SEASON_END)) {
    s.phase = 'over';
    const [a, b] = s.players.map(finalScore);
    addLog(s, 'Het seizoen is voorbij. ' + (a === b ? 'Gelijkspel!'
      : s.players[a > b ? 0 : 1].name + ' heeft de mooiste moestuin.'));
    return;
  }
  s.current = nextPlayer(s);
}

function checkBonus(s: State, p: Player): void {
  if (!s.bonusTaken && hasBonusSquare(p.grid)) {
    s.bonusTaken = true;
    p.bonus = true;
    addLog(s, p.name + ' heeft als eerste een vol vak van 7×7 en krijgt ' + BONUS_POINTS + ' punten!');
  }
}

function addLog(s: State, msg: string): void {
  s.log.unshift(msg);
  if (s.log.length > 80) {
    s.log.length = 80;
  }
}
