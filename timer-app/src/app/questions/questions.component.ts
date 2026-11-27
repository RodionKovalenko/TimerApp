import { Component, HostListener, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { KERSTVRAGEN, Question, QUESTION_SETS, QuestionSet } from './questions.data';

interface QuestionsState {
  round: number;
  shuffle: boolean;
  order: number[];
  pos: number;
  names: string[];
  scores: number[];
}

@Component({
  selector: 'app-questions',
  templateUrl: './questions.component.html',
  styleUrls: ['./questions.component.css']
})
export class QuestionsComponent implements OnInit {
  readonly set: QuestionSet;
  readonly rounds: number[];

  state: QuestionsState = { round: 0, shuffle: false, order: [], pos: 0, names: ['', ''], scores: [0, 0] };
  hidden = false;
  private touchStartX: number = null;

  /** The question set comes from the route data, e.g. { set: 'vragenkaarten' }. */
  constructor(route: ActivatedRoute) {
    this.set = QUESTION_SETS[route.snapshot.data.set] || KERSTVRAGEN;
    this.rounds = this.set.roundNames.map((name, i) => i);
  }

  get roundNames(): string[] {
    return this.set.roundNames;
  }

  /** Only show round filters when there is more than one round. */
  get hasRounds(): boolean {
    return this.set.roundNames.length > 2;
  }

  playerName(i: number): string {
    return (this.state.names[i] || '').trim() || 'Speler ' + (i + 1);
  }

  setName(i: number, name: string): void {
    this.state.names[i] = name;
    this.save();
  }

  addPoint(i: number, delta: number): void {
    this.state.scores[i] = Math.max(0, this.state.scores[i] + delta);
    this.save();
  }

  get doneText(): string {
    if (!this.set.scoring) {
      return this.set.doneText;
    }
    const [a, b] = this.state.scores;
    const result = a === b
      ? 'Gelijkspel: ' + a + ' tegen ' + b + '. Jullie kennen elkaar even goed!'
      : this.playerName(a > b ? 0 : 1) + ' wint met ' + Math.max(a, b) + ' tegen ' + Math.min(a, b) + '.';
    return this.set.doneText + ' ' + result;
  }

  ngOnInit(): void {
    this.load();
    const valid = Array.isArray(this.state.order) && this.state.order.length > 0
      && this.state.order.every(id => !!this.set.questions[id - 1]);
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
    return this.done ? null : this.set.questions[this.state.order[this.state.pos] - 1];
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
    this.animate(() => {
      this.buildOrder();
      this.state.scores = [0, 0];
    });
  }

  next(): void {
    this.animate(() => {
      if (this.done) {
        this.buildOrder();
        this.state.scores = [0, 0];
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
    if (target && target.tagName === 'INPUT' && (target as HTMLInputElement).type === 'text') {
      return;
    }
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
    const ids = this.set.questions
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
      const saved = JSON.parse(localStorage.getItem(this.set.storageKey));
      if (saved) {
        this.state = { ...this.state, ...saved };
      }
      if (!Array.isArray(this.state.names) || !Array.isArray(this.state.scores)) {
        this.state.names = ['', ''];
        this.state.scores = [0, 0];
      }
    } catch (e) { }
  }

  private save(): void {
    try {
      localStorage.setItem(this.set.storageKey, JSON.stringify(this.state));
    } catch (e) { }
  }
}
