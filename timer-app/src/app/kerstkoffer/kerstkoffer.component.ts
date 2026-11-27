import { Component, OnDestroy } from '@angular/core';
import {
  CANDLES, CHAPTERS, Chapter, ENDING, GIFT_CLUES, GRID_START, GRID_STEPS, INTRO, LETTER_GRID, MINE_NUMBERS,
  TRAINS_TO_ARNHEM, TRAINS_TO_ESSEN, isCorrect
} from './kerstkoffer.data';

const STORAGE_KEY = 'kerstkoffer-progress';

interface Progress {
  started: boolean;
  startedAt: number;
  finishedAt: number;
  /** Number of solved chapters (they are solved in order). */
  solved: number;
  /** Hints revealed per chapter. */
  hints: number[];
  wrong: number;
}

@Component({
  selector: 'app-kerstkoffer',
  templateUrl: './kerstkoffer.component.html',
  styleUrls: ['./kerstkoffer.component.css']
})
export class KerstkofferComponent implements OnDestroy {
  readonly intro = INTRO;
  readonly ending = ENDING;
  readonly chapters = CHAPTERS;
  readonly trainsToArnhem = TRAINS_TO_ARNHEM;
  readonly trainsToEssen = TRAINS_TO_ESSEN;
  readonly candles = CANDLES;
  readonly giftClues = GIFT_CLUES;
  readonly mineNumbers = MINE_NUMBERS;
  readonly letterGrid = LETTER_GRID.map(r => r.split(''));
  readonly gridStart = GRID_START;
  readonly gridSteps = GRID_STEPS;
  readonly alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

  progress: Progress = this.empty();
  answer = '';
  feedback = '';
  shake = false;
  now = Date.now();
  private timer: any;

  constructor() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        this.progress = { ...this.empty(), ...JSON.parse(raw) };
      }
    } catch (e) { }
    this.timer = setInterval(() => this.now = Date.now(), 1000);
  }

  ngOnDestroy(): void {
    clearInterval(this.timer);
  }

  private empty(): Progress {
    return { started: false, startedAt: 0, finishedAt: 0, solved: 0, hints: CHAPTERS.map(() => 0), wrong: 0 };
  }

  start(): void {
    this.progress = { ...this.empty(), started: true, startedAt: Date.now() };
    this.save();
  }

  restart(): void {
    if (confirm('Opnieuw beginnen? Jullie voortgang gaat verloren.')) {
      this.progress = this.empty();
      this.answer = '';
      this.feedback = '';
      this.save();
    }
  }

  get finished(): boolean {
    return this.progress.solved >= CHAPTERS.length;
  }

  get chapter(): Chapter {
    return this.finished ? null : CHAPTERS[this.progress.solved];
  }

  get letters(): string[] {
    return CHAPTERS.slice(0, this.progress.solved).filter(c => c.letter).map(c => c.letter);
  }

  get hintsShown(): number {
    return this.progress.hints[this.progress.solved] || 0;
  }

  get totalHints(): number {
    return this.progress.hints.reduce((a, b) => a + b, 0);
  }

  showHint(): void {
    if (this.chapter && this.hintsShown < this.chapter.hints.length) {
      this.progress.hints[this.progress.solved]++;
      this.save();
    }
  }

  submit(): void {
    const ch = this.chapter;
    if (!ch || !this.answer.trim()) {
      return;
    }
    if (isCorrect(ch, this.answer)) {
      this.feedback = '';
      this.progress.solved++;
      if (this.finished) {
        this.progress.finishedAt = Date.now();
      }
      this.answer = '';
      this.save();
      window.scrollTo(0, 0);
    } else {
      this.progress.wrong++;
      this.feedback = 'Het slot blijft dicht. Probeer het nog eens.';
      this.shake = true;
      setTimeout(() => this.shake = false, 500);
      this.save();
    }
  }

  get elapsed(): string {
    if (!this.progress.started) {
      return '0:00';
    }
    const end = this.progress.finishedAt || this.now;
    const sec = Math.max(0, Math.floor((end - this.progress.startedAt) / 1000));
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    const pad = (n: number) => (n < 10 ? '0' : '') + n;
    return h ? h + ':' + pad(m) + ':' + pad(s) : m + ':' + pad(s);
  }

  /** Previous chapter's "solved" text, shown above the next puzzle. */
  get lastSolvedText(): string {
    return this.progress.solved > 0 ? CHAPTERS[this.progress.solved - 1].solved : '';
  }

  isOpen(i: number): boolean {
    return i < this.progress.solved;
  }

  isStart(r: number, c: number): boolean {
    return r === this.gridStart[0] && c === this.gridStart[1];
  }

  private save(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.progress));
    } catch (e) { }
  }
}
