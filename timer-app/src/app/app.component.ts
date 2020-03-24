import { Component, ViewEncapsulation, OnInit, AfterViewInit, ViewChild, SimpleChanges, Input } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  encapsulation: ViewEncapsulation.None
})
export class AppComponent implements OnInit {
  // total time elapsed after timer was started
  timeElapsed: any;
  // time at which timer was stopped
  stoppedTimer: any;
  // sound to signal 
  audio: any;
  webWorker: any;
  // time display on the screen
  timerDisplay: {
    hours: any,
    minutes: any,
    seconds: any
  }
  isResetButtonVisible = false;

  buttonState = {
    START_TIMER: 'Start Timer',
    STOP_TIMER: 'Stop Timer',
    RESUME_TIMER: 'Resume Timer',
    RESET_TIMER: 'Reset Timer'
  }

  @ViewChild('startButton') startButton;
  @ViewChild('resetButton') resetButton;
  @Input() timeIntervalForSound: any;

  constructor(private _snackBar: MatSnackBar) {
    this.audio = new Audio('assets/mp3/test.mp3');
    this.timerDisplay = {
      hours: 0,
      minutes: 0,
      seconds: 0
    }

    this.stoppedTimer = null;
    // default time interval for sound 
    this.timeIntervalForSound = 55;
  }

  onTimerClick(event: any) {
    if (this.startButton._elementRef.nativeElement.innerText === this.buttonState.START_TIMER
      || this.startButton._elementRef.nativeElement.innerText === this.buttonState.RESUME_TIMER) {

      this.startButton._elementRef.nativeElement.innerText = this.buttonState.STOP_TIMER;
      this.isResetButtonVisible = false;

      if (this.audio) {       
        setTimeout(() => {
          this.audio.play();
          this.audio.pause();
          this.audio.currentTime = 0;
        }, 100);
      }

      this.startWorker();
    }

    else if (this.startButton._elementRef.nativeElement.innerText === this.buttonState.STOP_TIMER
      || this.startButton._elementRef.nativeElement.innerText === this.buttonState.RESUME_TIMER) {
      this.stoppedTimer = this.timeElapsed;
      this.isResetButtonVisible = true;

      if (this.stoppedTimer) {
        this.startButton._elementRef.nativeElement.innerText === this.buttonState.RESUME_TIMER ?
          this.startButton._elementRef.nativeElement.innerText = this.buttonState.STOP_TIMER :
          this.startButton._elementRef.nativeElement.innerText = this.buttonState.RESUME_TIMER;
      } else {
        this.startButton._elementRef.nativeElement.innerText = this.buttonState.START_TIMER;
      }
      this.terminateWorker();
    }
  }

  onResetTimer(event: any) {
    this.stoppedTimer = null;
    this.terminateWorker();
    this.isResetButtonVisible = false;
    this.timeElapsed = 0;
    this.setDisplayValues();
    this.startButton._elementRef.nativeElement.innerText = this.buttonState.START_TIMER;
  }

  initializeServiceWorker() {
    if (typeof (Worker) !== "undefined") {
      if (typeof (this.webWorker) == "undefined") {
        this.webWorker = new Worker("assets/demo-worker.js");
        console.log('web-worker initialized');
      }
      this.webWorker.onmessage = this.onTimerMessageEvent.bind(this);
    } else {
      this.showToastMessage('not supported', 'Sorry, your browser does not support Web Workers', 5000);
    }
  }

  startWorker() {
    this.initializeServiceWorker();
  }

  terminateWorker() {
    if (this.webWorker) {
      this.webWorker.terminate();
      this.webWorker = undefined;
    }
  }

  onTimerMessageEvent(event) {
    this.timeElapsed = event.data;

    if (this.stoppedTimer) {
      this.timeElapsed += this.stoppedTimer;
    }

    this.setDisplayValues();

    if (parseInt(this.timerDisplay.seconds) % (this.timeIntervalForSound) === 0 && parseInt(this.timerDisplay.seconds) !== 0) {

      if (this.audio) {
        this.audio.play();

        setTimeout(() => {
          this.audio.pause();
          this.audio.currentTime = 0;
        }, 4000);
      }
    }
  };

  setDisplayValues() {
    let seconds = this.timeElapsed / 1000;
    let minutes = Math.floor(seconds / 60);
    let hours = Math.floor(minutes / 60);

    // display seconds together with milliseconds rounded by 2 digits after comma 
    this.timerDisplay.seconds = (seconds % 60).toFixed(2);
    this.timerDisplay.minutes = minutes % 60;
    this.timerDisplay.hours = hours % 60;
  }

  ngOnInit(): void { }

  showToastMessage(title, message, duration) {
    this._snackBar.open(title, message, { duration: duration, direction: 'ltr', verticalPosition: 'top' });
  }
}
