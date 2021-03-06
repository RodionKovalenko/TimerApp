import { Component, ViewEncapsulation, OnInit, AfterViewInit, ViewChild, SimpleChanges, Input } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import * as noSleep from 'nosleep.js';
import { CacheRouteReuseStrategyService } from '../cache-route-reuse-strategy.service';

@Component({
  selector: 'app-stopwatch',
  templateUrl: './stopwatch.component.html',
  styleUrls: ['./stopwatch.component.css'],
  encapsulation: ViewEncapsulation.None
})
export class StopwatchComponent {
  // total time elapsed after timer was started
  timeElapsed: any;
  // time at which timer was stopped
  stoppedTimer: any;
  // sound to signal 
  audio: any;
  timerWorker: any;
  noSleep: any;

  // time display on the screen
  timerDisplay: {
    hours: any,
    minutes: any,
    seconds: any
  }
  isResetButtonVisible = false;
  numberFormatError = false;
  wakeLock: any;

  buttonState = {
    START_TIMER: 'Start Timer',
    STOP_TIMER: 'Stop Timer',
    RESUME_TIMER: 'Resume Timer',
    RESET_TIMER: 'Reset Timer'
  }

  @ViewChild('startButton') startButton;
  @ViewChild('resetButton') resetButton;
  @ViewChild('timerCmp') timerCmp;
  @Input() timeIntervalForSound: any;

  constructor(private _snackBar: MatSnackBar, cachedRoute: CacheRouteReuseStrategyService) {
    this.noSleep = new noSleep();
    this.audio = new Audio('assets/mp3/test.mp3');
    if (!this.timerDisplay) {
      this.timerDisplay = {
        hours: 0,
        minutes: 0,
        seconds: 0
      }
    }
   // this.stoppedTimer = null;
    // default time interval for sound 
    this.timeIntervalForSound = 30;
  }

  onTimerClick(event: any) {
    if (this.startButton._elementRef.nativeElement.innerText === this.buttonState.START_TIMER
      || this.startButton._elementRef.nativeElement.innerText === this.buttonState.RESUME_TIMER) {

      this.startButton._elementRef.nativeElement.innerText = this.buttonState.STOP_TIMER;
      this.isResetButtonVisible = false;
      this.timerCmp.nativeElement.className = 'color-change';

      if (this.audio) {
        setTimeout(() => {
          this.audio.play();
          this.audio.pause();
          this.audio.currentTime = 0;
        }, 100);
      }

      this.noSleep.enable();
      this.startWorker();
    }

    else if (this.startButton._elementRef.nativeElement.innerText === this.buttonState.STOP_TIMER
      || this.startButton._elementRef.nativeElement.innerText === this.buttonState.RESUME_TIMER) {
      this.stoppedTimer = this.timeElapsed;
      this.isResetButtonVisible = true;
      this.noSleep.disable();
      this.timerCmp.nativeElement.className = '';

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
      if (typeof (this.timerWorker) == "undefined") {
        this.timerWorker = new Worker('assets/timer-worker.js');
      }
      this.timerWorker.onmessage = this.onTimerMessageEvent.bind(this);
    } else {
      this.showToastMessage('not supported', 'Sorry, your browser does not support Web Workers', 5000);
    }
  }

  startWorker() {
    this.initializeServiceWorker();
  }

  terminateWorker() {
    if (this.timerWorker) {
      this.timerWorker.terminate();
      this.timerWorker = undefined;
    }
  }

  onTimerMessageEvent(event) {
    this.timeElapsed = event.data;

    if (this.stoppedTimer) {
      this.timeElapsed += this.stoppedTimer;
    }

    this.setDisplayValues();

    if (isNaN(this.timeIntervalForSound) && !this.numberFormatError) {
      this.numberFormatError = true;
      this.showToastMessage('Wrong number format', 'Please give your number in seconds', 5000);
      setTimeout(() => {
        this.numberFormatError = false;
      }, 5000);

    }

    let totalNumberOfSeconds = Number(this.timerDisplay.seconds) + Number((this.timerDisplay.minutes * 60)) + Number((this.timerDisplay.hours * 3600));


    if (!isNaN(this.timeIntervalForSound) && (parseInt(totalNumberOfSeconds.toString()) % (this.timeIntervalForSound)) === 0
      && (this.timerDisplay.minutes !== 0 || (this.timeIntervalForSound < 60 && Math.floor(this.timerDisplay.seconds) !== 0))) {

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

  showToastMessage(title, message, duration) {
    this._snackBar.open(title, message, { duration: duration, direction: 'ltr', verticalPosition: 'top' });
  }

}
