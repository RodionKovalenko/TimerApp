import { Component } from '@angular/core';
import {
  Action, BONUS_POINTS, BONUS_SQUARE, Cell, EMPTY_PENALTY, HARVEST_DAYS, Player, SEASON_END, SIZE,
  SUNFLOWER, SUNFLOWER_DAYS, State, TILES, TileDef,
  canPlaceAnywhere, emptyCells, finalScore, fits, market, newGame, orient, reduce
} from './moestuin.engine';

const STORAGE_KEY = 'moestuin-game';
const PALETTE = ['#6aa84f', '#e69138', '#93c47d', '#c27ba0', '#f1c232', '#76a5af', '#b45f06', '#8e7cc3',
  '#a2c4c9', '#cc4125', '#45818e', '#d5a6bd'];

@Component({
  selector: 'app-moestuin',
  templateUrl: './moestuin.component.html',
  styleUrls: ['./moestuin.component.css']
})
export class MoestuinComponent {
  readonly rows = Array.from({ length: SIZE }, (x, i) => i);
  readonly days = Array.from({ length: SEASON_END + 1 }, (x, i) => i);
  readonly seasonEnd = SEASON_END;
  readonly bonusSquare = BONUS_SQUARE;
  readonly bonusPoints = BONUS_POINTS;
  readonly emptyPenalty = EMPTY_PENALTY;
  readonly sunflower = SUNFLOWER;

  game: State = null;
  pick = -1;
  rotation = 0;
  mirror = false;
  anchor: Cell = null;
  showRules = false;
  showLog = false;
  setupNames = ['', ''];

  constructor() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      this.game = raw ? JSON.parse(raw) : null;
    } catch (e) {
      this.game = null;
    }
  }

  // ------------------------------------------------------------ flow

  start(): void {
    const names = this.setupNames.map((n, i) => n.trim() || 'Speler ' + (i + 1)) as [string, string];
    this.game = newGame(names);
    this.resetSelection();
    this.save();
  }

  quit(): void {
    if (this.game && this.game.phase !== 'over' && !confirm('Het huidige spel stoppen?')) {
      return;
    }
    this.game = null;
    this.save();
  }

  private dispatch(a: Action): void {
    const next = reduce(this.game, a);
    if (next !== this.game) {
      this.game = next;
      this.resetSelection();
      this.save();
    }
  }

  private resetSelection(): void {
    this.pick = -1;
    this.rotation = 0;
    this.mirror = false;
    this.anchor = null;
  }

  choose(pick: number): void {
    if (!this.buyable(pick)) {
      return;
    }
    if (this.pick === pick) {
      this.resetSelection();
      return;
    }
    this.pick = pick;
    this.rotation = 0;
    this.mirror = false;
    this.anchor = null;
  }

  rotate(): void {
    this.rotation = (this.rotation + 1) % 4;
  }

  flip(): void {
    this.mirror = !this.mirror;
  }

  tapCell(r: number, c: number): void {
    if (this.game.phase === 'sunflower') {
      this.dispatch({ type: 'SUNFLOWER', cell: [r, c] });
      return;
    }
    if (this.pick >= 0) {
      this.anchor = [r, c];
    }
  }

  plant(): void {
    if (this.ghostValid) {
      this.dispatch({ type: 'BUY', pick: this.pick, cells: this.ghostCells });
    }
  }

  wait(): void {
    this.dispatch({ type: 'WAIT' });
  }

  // ------------------------------------------------------------ view helpers

  get over(): boolean {
    return this.game.phase === 'over';
  }

  /** Whose garden is being worked on right now. */
  get active(): number {
    return this.game.phase === 'sunflower' ? this.game.sunflowerFor : this.game.current;
  }

  get me(): Player {
    return this.game.players[this.active];
  }

  get other(): Player {
    return this.game.players[1 - this.active];
  }

  get marketTiles(): TileDef[] {
    return market(this.game).map(i => TILES[this.game.circle[i]]);
  }

  /** The tiles after the market, so you can plan ahead. */
  get upcoming(): TileDef[] {
    const n = this.game.circle.length;
    const out: TileDef[] = [];
    for (let k = 3; k < Math.min(n, 9); k++) {
      out.push(TILES[this.game.circle[(this.game.marker + k) % n]]);
    }
    return out;
  }

  buyable(pick: number): boolean {
    const t = this.marketTiles[pick];
    return !!t && this.game.phase === 'choose' && this.me.seeds >= t.cost && canPlaceAnywhere(this.me.grid, t.shape);
  }

  whyNot(t: TileDef): string {
    if (this.me.seeds < t.cost) {
      return 'te duur';
    }
    if (!canPlaceAnywhere(this.me.grid, t.shape)) {
      return 'past niet';
    }
    return '';
  }

  get selectedTile(): TileDef {
    return this.pick >= 0 ? this.marketTiles[this.pick] : null;
  }

  get orientedCells(): Cell[] {
    const t = this.selectedTile;
    return t ? orient(t.shape, this.rotation, this.mirror) : [];
  }

  /** Cells of the ghost: the tapped cell is the top-left corner, kept inside the garden. */
  get ghostCells(): Cell[] {
    if (!this.anchor || !this.selectedTile) {
      return [];
    }
    const cells = this.orientedCells;
    const h = Math.max(...cells.map(x => x[0])) + 1;
    const w = Math.max(...cells.map(x => x[1])) + 1;
    const r0 = Math.min(this.anchor[0], SIZE - h);
    const c0 = Math.min(this.anchor[1], SIZE - w);
    return cells.map(([r, c]) => [r + r0, c + c0] as Cell);
  }

  get ghostValid(): boolean {
    const cells = this.ghostCells;
    return cells.length > 0 && fits(this.me.grid, cells);
  }

  isGhost(r: number, c: number): boolean {
    return this.ghostCells.some(([a, b]) => a === r && b === c);
  }

  /** Mini grid for a tile preview. */
  miniCells(t: TileDef, rotation = 0, mirror = false): boolean[][] {
    const cells = orient(t.shape, rotation, mirror);
    const h = Math.max(...cells.map(x => x[0])) + 1;
    const w = Math.max(...cells.map(x => x[1])) + 1;
    const grid = Array.from({ length: h }, () => Array(w).fill(false));
    cells.forEach(([r, c]) => grid[r][c] = true);
    return grid;
  }

  tileColor(id: number): string {
    return id === SUNFLOWER ? '#ffe599' : PALETTE[id % PALETTE.length];
  }

  /** Watering cans are drawn on the first cells of each planted tile. */
  hasCan(p: Player, r: number, c: number): boolean {
    const id = p.grid[r][c];
    if (id < 0 || id === SUNFLOWER || !TILES[id].cans) {
      return false;
    }
    let seen = 0;
    for (let i = 0; i < SIZE; i++) {
      for (let j = 0; j < SIZE; j++) {
        if (p.grid[i][j] === id) {
          if (i === r && j === c) {
            return seen < TILES[id].cans;
          }
          seen++;
        }
      }
    }
    return false;
  }

  /** Neighbor in the same tile, to draw borders between tiles. */
  edge(p: Player, r: number, c: number, dr: number, dc: number): boolean {
    const id = p.grid[r][c];
    const r2 = r + dr;
    const c2 = c + dc;
    return id >= 0 && !(r2 >= 0 && c2 >= 0 && r2 < SIZE && c2 < SIZE && p.grid[r2][c2] === id);
  }

  dayMark(d: number): string {
    if (SUNFLOWER_DAYS.indexOf(d) >= 0 && this.game.sunflowersTaken.indexOf(d) < 0) {
      return 'flower';
    }
    if (HARVEST_DAYS.indexOf(d) >= 0) {
      return 'harvest';
    }
    return '';
  }

  get waitText(): string {
    const to = Math.min(SEASON_END, this.other.day + 1);
    const n = to - this.me.day;
    return 'Wachten tot dag ' + to + ' (+' + n + ' zaadjes)';
  }

  harvestsLeft(p: Player): number {
    return HARVEST_DAYS.filter(d => d > p.day).length;
  }

  empty(p: Player): number {
    return emptyCells(p);
  }

  score(p: Player): number {
    return finalScore(p);
  }

  get winnerText(): string {
    const [a, b] = this.game.players.map(finalScore);
    if (a === b) {
      return 'Gelijkspel!';
    }
    return this.game.players[a > b ? 0 : 1].name + ' heeft de mooiste moestuin!';
  }

  private save(): void {
    try {
      if (this.game) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.game));
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch (e) { }
  }
}
