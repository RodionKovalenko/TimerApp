import { Component, HostListener, OnInit } from '@angular/core';
import { Question, QUESTIONS, ROUND_NAMES } from './questions.data';

interface QuestionsState {
  round: number;
  shuffle: boolean;
  order: number[];
  pos: number;
}

const STORAGE_KEY = 'kerstvragen-state';

@Component({
  selector: 'app-questions',
  templateUrl: './questions.component.html',
  styleUrls: ['./questions.component.css']
})
export class QuestionsComponent implements OnInit {
  readonly roundNames = ROUND_NAMES;
  readonly rounds = [0, 1, 2, 3];

  state: QuestionsState = { round: 0, shuffle: false, order: [], pos: 0 };
  hidden = false;
  private touchStartX: number = null;

  ngOnInit(): void {
    this.load();
    const valid = Array.isArray(this.state.order) && this.state.order.length > 0
      && this.state.order.every(id => !!QUESTIONS[id - 1]);
    if (!valid) {
      this.buildOrder();
    }
  }

  get total(): number {
    return this.state.order.length;
  }

  get done(): boolean {
    return this.state.pos >= this.total;
  }

  get current(): Question {
    return this.done ? null : QUESTIONS[this.state.order[this.state.pos] - 1];
  }

  get progress(): number {
    return this.total ? Math.min(this.state.pos + (this.done ? 0 : 1), this.total) / this.total * 100 : 0;
  }

  get nextLabel(): string {
    if (this.done) {
      return 'Opnieuw ↺';
    }
    return this.state.pos === this.total - 1 ? 'Afronden ✓' : 'Volgende →';
  }

  selectRound(round: number): void {
    this.state.round = round;
    this.restart();
  }

  toggleShuffle(checked: boolean): void {
    this.state.shuffle = checked;
    this.restart();
  }

  restart(): void {
    this.animate(() => this.buildOrder());
  }

  next(): void {
    this.animate(() => {
      if (this.done) {
        this.buildOrder();
      } else {
        this.state.pos++;
      }
    });
  }

  prev(): void {
    if (this.state.pos > 0) {
      this.animate(() => this.state.pos--);
    }
  }

  @HostListener('document:keydown', ['$event'])
  onKeydown(event: KeyboardEvent): void {
    const target = event.target as HTMLElement;
    // Space/Enter on a focused button or checkbox already triggers it natively.
    const onControl = target && (target.tagName === 'INPUT' || target.tagName === 'BUTTON');
    if (event.key === 'ArrowRight' || (!onControl && (event.key === ' ' || event.key === 'Enter'))) {
      event.preventDefault();
      this.next();
    } else if (event.key === 'ArrowLeft') {
      this.prev();
    }
  }

  onTouchStart(event: TouchEvent): void {
    this.touchStartX = event.touches[0].clientX;
  }

  onTouchEnd(event: TouchEvent): void {
    if (this.touchStartX === null) {
      return;
    }
    const dx = event.changedTouches[0].clientX - this.touchStartX;
    this.touchStartX = null;
    if (dx < -50) {
      this.next();
    } else if (dx > 50) {
      this.prev();
    }
  }

  private animate(change: () => void): void {
    this.hidden = true;
    setTimeout(() => {
      change();
      this.save();
      this.hidden = false;
    }, 180);
  }

  private buildOrder(): void {
    const ids = QUESTIONS
      .filter(q => !this.state.round || q.round === this.state.round)
      .map(q => q.id);
    if (this.state.shuffle) {
      for (let i = ids.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [ids[i], ids[j]] = [ids[j], ids[i]];
      }
    }
    this.state.order = ids;
    this.state.pos = 0;
  }

  private load(): void {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
      if (saved) {
        this.state = { ...this.state, ...saved };
      }
    } catch (e) { }
  }

  private save(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
    } catch (e) { }
  }
}
