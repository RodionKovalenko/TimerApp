import { Component, ElementRef, ViewChild } from '@angular/core';
import { CITIES, City, Color, MAP_HEIGHT, MAP_WIDTH, THREATS } from './noodweer.map';
import {
  Action, EPIDEMIC, GameState, HAND_LIMIT, MAX_OUTBREAKS, MAX_STATIONS, RULES,
  canBuild, canCharter, canCure, canDirect, canDrive, canGive, canShuttle, canTake, canTreat,
  cardsOfColor, infectionRate, isOver, newGame, partners, reduce
} from './noodweer.engine';

interface Option {
  label: string;
  hint?: string;
  action: Action;
}

const STORAGE_KEY = 'noodweer-game';
const PAWN_COLORS = ['#7b3fa0', '#138a72', '#e07a1f', '#34495e'];

@Component({
  selector: 'app-noodweer',
  templateUrl: './noodweer.component.html',
  styleUrls: ['./noodweer.component.css']
})
export class NoodweerComponent {
  readonly cities = CITIES;
  readonly threats = THREATS;
  readonly colors: Color[] = [0, 1, 2, 3];
  readonly width = MAP_WIDTH;
  readonly height = MAP_HEIGHT;
  readonly pawnColors = PAWN_COLORS;
  readonly maxOutbreaks = MAX_OUTBREAKS;
  readonly maxStations = MAX_STATIONS;
  readonly handLimit = HAND_LIMIT;
  readonly rules = RULES;
  readonly EPIDEMIC = EPIDEMIC;
  readonly edges: { a: City; b: City; special: boolean }[] = [];

  @ViewChild('mapWrap') mapWrap: ElementRef<HTMLElement>;

  game: GameState = null;
  history: GameState[] = [];
  selected = -1;
  showRules = false;
  showLog = false;

  setupNames = ['', '', '', ''];
  setupPlayers = 2;
  setupEpidemics = 5;

  constructor() {
    for (const c of CITIES) {
      for (const n of c.neighbors) {
        if (n > c.id) {
          const b = CITIES[n];
          this.edges.push({ a: c, b, special: (c.name === 'Amersfoort' && b.name === 'Essen') || (c.name === 'Essen' && b.name === 'Amersfoort') });
        }
      }
    }
    this.load();
  }

  // ------------------------------------------------------------ setup

  start(): void {
    const names = this.setupNames.slice(0, this.setupPlayers)
      .map((n, i) => n.trim() || 'Speler ' + (i + 1));
    this.game = newGame({ names, epidemics: this.setupEpidemics });
    this.history = [];
    this.selected = this.game.players[0].city;
    this.save();
    this.centerOnCurrent();
  }

  quit(): void {
    if (this.game && !isOver(this.game) && !confirm('Het huidige spel stoppen?')) {
      return;
    }
    this.game = null;
    this.history = [];
    this.save();
  }

  trackByIndex(i: number): number {
    return i;
  }

  // ------------------------------------------------------------ actions

  dispatch(action: Action): void {
    const prev = this.game;
    const next = reduce(prev, action);
    if (next === prev) {
      return;
    }
    // Undo only within the own actions; once cards are drawn it is final.
    if (next.turn === prev.turn && next.actionsLeft > 0 && !isOver(next)) {
      this.history.push(prev);
    } else {
      this.history = [];
    }
    this.game = next;
    if (next.turn !== prev.turn) {
      this.selected = next.players[next.current].city;
      this.centerOnCurrent();
    } else if (action.type === 'DRIVE' || action.type === 'DIRECT'
      || action.type === 'CHARTER' || action.type === 'SHUTTLE') {
      this.selected = next.players[next.current].city;
    }
    this.save();
  }

  undo(): void {
    if (this.history.length) {
      this.game = this.history.pop();
      this.selected = this.game.players[this.game.current].city;
      this.save();
    }
  }

  /** On narrow screens the map scrolls sideways: bring the active player into view. */
  centerOnCurrent(): void {
    setTimeout(() => {
      const wrap = this.mapWrap && this.mapWrap.nativeElement;
      if (!wrap || !this.game || wrap.scrollWidth <= wrap.clientWidth) {
        return;
      }
      const city = CITIES[this.current.city];
      const scale = wrap.scrollWidth / MAP_WIDTH;
      wrap.scrollLeft = city.x * scale - wrap.clientWidth / 2;
    });
  }

  select(id: number): void {
    this.selected = id;
  }

  get over(): boolean {
    return !!this.game && isOver(this.game);
  }

  get current() {
    return this.game.players[this.game.current];
  }

  get selectedCity(): City {
    return this.selected >= 0 ? CITIES[this.selected] : null;
  }

  get options(): Option[] {
    const s = this.game;
    const out: Option[] = [];
    if (!s || this.selected < 0 || s.phase !== 'actions') {
      return out;
    }
    const id = this.selected;
    const name = CITIES[id].name;
    const p = this.current;

    if (id !== p.city) {
      if (canDrive(s, id)) {
        out.push({ label: 'Rij naar ' + name, action: { type: 'DRIVE', to: id } });
      }
      if (canShuttle(s, id)) {
        out.push({ label: 'Pendel naar ' + name, hint: 'tussen hulpposten', action: { type: 'SHUTTLE', to: id } });
      }
      if (canDirect(s, id)) {
        out.push({ label: 'Vlieg naar ' + name, hint: 'kost kaart ' + name, action: { type: 'DIRECT', to: id } });
      }
      if (canCharter(s, id)) {
        out.push({
          label: 'Charter naar ' + name, hint: 'kost kaart ' + CITIES[p.city].name,
          action: { type: 'CHARTER', to: id }
        });
      }
      return out;
    }

    for (const c of this.colors) {
      if (canTreat(s, c)) {
        out.push({
          label: 'Herstel ' + THREATS[c].short,
          hint: s.cured[c] ? 'alle blokjes, want bedwongen' : '1 blokje',
          action: { type: 'TREAT', color: c }
        });
      }
    }
    for (const c of this.colors) {
      if (canCure(s, c)) {
        out.push({
          label: 'Bedwing ' + THREATS[c].name, hint: RULES.cardsToCure + ' kaarten ' + THREATS[c].short,
          action: { type: 'CURE', color: c }
        });
      }
    }
    if (canBuild(s)) {
      out.push({ label: 'Bouw hulppost', hint: 'kost kaart ' + name, action: { type: 'BUILD' } });
    }
    for (const o of partners(s)) {
      if (canGive(s, o)) {
        out.push({ label: 'Geef ' + name + ' aan ' + s.players[o].name, action: { type: 'GIVE', to: o } });
      }
      if (canTake(s, o)) {
        out.push({ label: 'Neem ' + name + ' van ' + s.players[o].name, action: { type: 'TAKE', from: o } });
      }
    }
    return out;
  }

  /** Why nothing can be done in the selected city (shown instead of an empty list). */
  get noOptionsHint(): string {
    const s = this.game;
    if (!s || this.selected < 0) {
      return 'Kies een stad op de kaart.';
    }
    if (this.selected === this.current.city) {
      return 'Hier valt nu niets te doen. Kies een andere stad om erheen te reizen.';
    }
    return 'Je kunt ' + CITIES[this.selected].name + ' nu niet bereiken.';
  }

  // ------------------------------------------------------------ view helpers

  cubesOf(id: number): number[] {
    const out: number[] = [];
    this.game.cubes[id].forEach((n, color) => {
      for (let i = 0; i < n; i++) {
        out.push(color);
      }
    });
    return out;
  }

  playersIn(id: number): number[] {
    return this.game.players.map((p, i) => i).filter(i => this.game.players[i].city === id);
  }

  hasStation(id: number): boolean {
    return this.game.stations.indexOf(id) >= 0;
  }

  reachable(id: number): boolean {
    const s = this.game;
    return s.phase === 'actions' && (canDrive(s, id) || canShuttle(s, id) || canDirect(s, id));
  }

  cardColor(card: number): string {
    return card === EPIDEMIC ? '#222' : THREATS[CITIES[card].color].hex;
  }

  cardName(card: number): string {
    return card === EPIDEMIC ? 'NOODWEER!' : CITIES[card].name;
  }

  sortedHand(hand: number[]): number[] {
    return hand.slice().sort((a, b) => CITIES[a].color - CITIES[b].color || CITIES[a].name.localeCompare(CITIES[b].name));
  }

  countOfColor(hand: number[], color: Color): number {
    return cardsOfColor(hand, color).length;
  }

  get rate(): number {
    return infectionRate(this.game);
  }

  get epidemicsLeft(): number {
    return this.game.playerDeck.filter(c => c === EPIDEMIC).length;
  }

  get turnsLeft(): number {
    return Math.floor(this.game.playerDeck.length / 2);
  }

  actionDots(): boolean[] {
    return [0, 1, 2, 3].map(i => i < this.game.actionsLeft);
  }

  // ------------------------------------------------------------ storage

  private load(): void {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        this.game = JSON.parse(raw);
        this.selected = this.game.players[this.game.current].city;
        this.centerOnCurrent();
      }
    } catch (e) {
      this.game = null;
    }
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
