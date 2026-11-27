import { Component } from '@angular/core';
import {
  Action, COLORS, Card, HandCard, MAX_CLOUDS, MAX_SCORE, MAX_WHISPERS, State, VALUES,
  canDiscard, canHint, copiesLeft, isOver, newGame, reduce, score, touched
} from './sterrenpad.engine';

const STORAGE_KEY = 'sterrenpad-game';

interface HintChoice {
  target: number;
  color?: number;
  value?: number;
}

@Component({
  selector: 'app-sterrenpad',
  templateUrl: './sterrenpad.component.html',
  styleUrls: ['./sterrenpad.component.css']
})
export class SterrenpadComponent {
  readonly colors = COLORS;
  readonly values = VALUES;
  readonly maxWhispers = MAX_WHISPERS;
  readonly maxClouds = MAX_CLOUDS;
  readonly maxScore = MAX_SCORE;

  game: State = null;
  /** False while the hand-over screen is shown, so nobody sees cards they should not see. */
  revealed = false;
  selectedOwn = -1;
  hint: HintChoice = null;
  showRules = false;

  setupPlayers = 2;
  setupNames = ['', '', '', ''];

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
    const names = this.setupNames.slice(0, this.setupPlayers).map((n, i) => n.trim() || 'Speler ' + (i + 1));
    this.game = newGame(names);
    this.revealed = false;
    this.save();
  }

  quit(): void {
    if (this.game && !this.over && !confirm('Het huidige spel stoppen?')) {
      return;
    }
    this.game = null;
    this.save();
  }

  reveal(): void {
    this.revealed = true;
    this.selectedOwn = -1;
    this.hint = null;
  }

  private dispatch(a: Action): void {
    const next = reduce(this.game, a);
    if (next === this.game) {
      return;
    }
    this.game = next;
    this.revealed = false;
    this.selectedOwn = -1;
    this.hint = null;
    this.save();
    window.scrollTo(0, 0);
  }

  play(): void {
    this.dispatch({ type: 'PLAY', index: this.selectedOwn });
  }

  discard(): void {
    this.dispatch({ type: 'DISCARD', index: this.selectedOwn });
  }

  giveHint(): void {
    if (this.hint) {
      this.dispatch({ type: 'HINT', target: this.hint.target, color: this.hint.color, value: this.hint.value });
    }
  }

  selectOwn(i: number): void {
    this.selectedOwn = this.selectedOwn === i ? -1 : i;
    this.hint = null;
  }

  chooseHint(target: number, color?: number, value?: number): void {
    if (!canHint(this.game, target, color, value)) {
      return;
    }
    const same = this.hint && this.hint.target === target && this.hint.color === color && this.hint.value === value;
    this.hint = same ? null : { target, color, value };
    this.selectedOwn = -1;
  }

  // ------------------------------------------------------------ view helpers

  get over(): boolean {
    return !!this.game && isOver(this.game);
  }

  get me() {
    return this.game.players[this.game.current];
  }

  get others(): number[] {
    const n = this.game.players.length;
    const out: number[] = [];
    for (let k = 1; k < n; k++) {
      out.push((this.game.current + k) % n);
    }
    return out;
  }

  get score(): number {
    return score(this.game);
  }

  get canDiscard(): boolean {
    return canDiscard(this.game);
  }

  hintAllowed(target: number, color?: number, value?: number): boolean {
    return canHint(this.game, target, color, value);
  }

  isHinted(target: number, i: number): boolean {
    return !!this.hint && this.hint.target === target
      && touched(this.game, target, this.hint.color, this.hint.value).indexOf(i) >= 0;
  }

  hintActive(target: number, color?: number, value?: number): boolean {
    return !!this.hint && this.hint.target === target && this.hint.color === color && this.hint.value === value;
  }

  get hintText(): string {
    if (!this.hint) {
      return '';
    }
    const idx = touched(this.game, this.hint.target, this.hint.color, this.hint.value);
    const what = this.hint.color !== undefined ? COLORS[this.hint.color].name : String(this.hint.value);
    return 'Fluister ' + this.game.players[this.hint.target].name + ': “kaart ' + idx.map(i => i + 1).join(', ')
      + (idx.length > 1 ? ' zijn ' : ' is ') + what + '”';
  }

  hex(color: number): string {
    return COLORS[color].hex;
  }

  /** Background for an own (hidden) card: its color if known, else neutral. */
  ownBg(h: HandCard): string {
    return h.knowColor ? COLORS[h.card.color].hex : '';
  }

  notText(h: HandCard): string {
    const parts: string[] = [];
    if (!h.knowColor && h.notColors.length) {
      parts.push(h.notColors.map(c => COLORS[c].name).join(', '));
    }
    if (!h.knowValue && h.notValues.length) {
      parts.push(h.notValues.slice().sort().join(', '));
    }
    return parts.length ? 'niet ' + parts.join(' · ') : '';
  }

  /** What the owner of a visible card already knows about it. */
  knowsText(h: HandCard): string {
    if (h.knowColor && h.knowValue) {
      return 'weet alles';
    }
    if (h.knowColor) {
      return 'weet kleur';
    }
    if (h.knowValue) {
      return 'weet getal';
    }
    return '';
  }

  lastCopy(c: Card): boolean {
    return copiesLeft(this.game, c.color, c.value) === 1 && this.game.stacks[c.color] < c.value;
  }

  discardOf(color: number): number[] {
    return this.game.discard.filter(c => c.color === color).map(c => c.value).sort();
  }

  range(n: number): number[] {
    return Array.from({ length: n }, (x, i) => i);
  }

  get verdict(): string {
    const sc = this.score;
    if (this.game.phase === 'lost') {
      return 'De hemel is helemaal bewolkt. Jullie hadden ' + sc + (sc === 1 ? ' ster' : ' sterren') + ' gelegd.';
    }
    if (sc === MAX_SCORE) {
      return 'Perfect! Alle vijf sterrenbeelden zijn compleet.';
    }
    if (sc >= 21) {
      return 'Bijna perfect: een prachtige sterrenhemel.';
    }
    if (sc >= 16) {
      return 'Mooi gedaan: de sterrenbeelden zijn goed te zien.';
    }
    if (sc >= 11) {
      return 'Een redelijke avond; met wat meer fluisteren wordt het mooier.';
    }
    return 'Een bewolkte avond. Volgende keer beter!';
  }

  trackByIndex(i: number): number {
    return i;
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
