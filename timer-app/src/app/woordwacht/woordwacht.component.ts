import { Component } from '@angular/core';
import {
  Action, ROUNDS, State, canGuess, greensLeftFor, guesser, isOver, newGame, reduce, totalGreens, totalGreensLeft
} from './woordwacht.engine';

const STORAGE_KEY = 'woordwacht-game';

@Component({
  selector: 'app-woordwacht',
  templateUrl: './woordwacht.component.html',
  styleUrls: ['./woordwacht.component.css']
})
export class WoordwachtComponent {
  readonly rounds = ROUNDS;
  readonly counts = [1, 2, 3, 4, 5];

  game: State = null;
  /** The hint giver is looking at the secret key. */
  showKey = false;
  clueWord = '';
  clueCount = 1;
  selected = -1;
  showRules = false;
  showLog = false;
  endKey = 0;
  setupNames = ['', ''];

  constructor() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      this.game = raw ? JSON.parse(raw) : null;
    } catch (e) {
      this.game = null;
    }
  }

  start(): void {
    const names = this.setupNames.map((n, i) => n.trim() || 'Speler ' + (i + 1)) as [string, string];
    this.game = newGame(names);
    this.showKey = false;
    this.save();
  }

  quit(): void {
    if (this.game && !this.over && !confirm('Het huidige spel stoppen?')) {
      return;
    }
    this.game = null;
    this.save();
  }

  private dispatch(a: Action): void {
    const next = reduce(this.game, a);
    if (next !== this.game) {
      this.game = next;
      this.selected = -1;
      this.save();
    }
  }

  revealKey(): void {
    this.showKey = true;
    this.clueWord = '';
    this.clueCount = 1;
  }

  giveClue(): void {
    this.showKey = false;
    this.dispatch({ type: 'CLUE', word: this.clueWord, count: this.clueCount });
  }

  tapWord(i: number): void {
    if (this.game.phase !== 'guess' || !canGuess(this.game, i)) {
      return;
    }
    this.selected = this.selected === i ? -1 : i;
  }

  confirmGuess(): void {
    if (this.selected >= 0) {
      this.dispatch({ type: 'GUESS', index: this.selected });
    }
  }

  stop(): void {
    this.dispatch({ type: 'STOP' });
  }

  // ------------------------------------------------------------ view helpers

  get over(): boolean {
    return !!this.game && isOver(this.game);
  }

  get giverName(): string {
    return this.game.names[this.game.giver];
  }

  get guesserName(): string {
    return this.game.names[guesser(this.game)];
  }

  get greensLeft(): number {
    return totalGreensLeft(this.game);
  }

  get greensTotal(): number {
    return totalGreens(this.game);
  }

  greensFor(p: number): number {
    return greensLeftFor(this.game, p);
  }

  range(n: number): number[] {
    return Array.from({ length: n }, (x, i) => i);
  }

  /** Color class of a word: public markers, plus the secret key when allowed. */
  cellClass(i: number): string {
    const s = this.game;
    if (s.found[i]) {
      return 'found';
    }
    if (this.over) {
      return 'key-' + s.keys[this.endKey][i];
    }
    if (this.showKey && s.phase === 'give') {
      return 'key-' + s.keys[s.giver][i];
    }
    return '';
  }

  guessable(i: number): boolean {
    return canGuess(this.game, i);
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
