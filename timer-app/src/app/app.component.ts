import { Component, ViewEncapsulation, OnInit, AfterViewInit, ViewChild, SimpleChanges } from '@angular/core';
import { THIS_EXPR } from '@angular/compiler/src/output/output_ast';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  encapsulation: ViewEncapsulation.None
})
export class AppComponent implements OnInit {
  title = 'timer-app';
  timerOldValue: any;
  timeElapsed: any;
  timerCurrentValue: any;
  requestAnimationFrame: any;
  requestAnimationFrameFunction: any;
  stoppedTimer: any;
  audio: any;
  webWorker: any;
  timerDisplay: {
    hours: any,
    minutes: any,
    seconds: any,
    milliseconds: any
  }

  @ViewChild('submitButton') submitButton;


  buttonState = {
    START_TIMER: 'Start Timer',
    STOP_TIMER: 'Stop Timer'
  }
  constructor() {
    this.timerDisplay = {
      hours: 0,
      minutes: 0,
      seconds: 0,
      milliseconds: 0
    }

    this.stoppedTimer = 0;
  }


  onTimerClick(event: any) {

    if (this.submitButton._elementRef.nativeElement.innerText === this.buttonState.START_TIMER) {
      this.submitButton._elementRef.nativeElement.innerText = this.buttonState.STOP_TIMER;
      if (!this.requestAnimationFrameFunction) {
        this.requestAnimationFrameFunction = this.getAnimationFrameFunction;
        this.timerOldValue = performance.now();

        this.startTimeFrame();

        if (!this.audio) {
          this.audio = new Audio('assets/mp3/test.mp3');
        }

        this.audio.play();

        setTimeout(() => {
          this.audio.pause();
          this.audio.currentTime = 0;

        }, 100);
      }
    }

    else if (this.submitButton._elementRef.nativeElement.innerText === this.buttonState.STOP_TIMER) {
      this.stoppedTimer = this.timeElapsed;
      window.cancelAnimationFrame(this.requestAnimationFrame);
      this.submitButton._elementRef.nativeElement.innerText = this.buttonState.START_TIMER;
      this.requestAnimationFrameFunction = null;
      performance.clearMarks();
      performance.clearResourceTimings();
      performance.clearMeasures();

      setTimeout(() => {
        this.timeElapsed = this.stoppedTimer;
        this.setDisplayValues();
      }, 100);

    }
  }


  initializeServiceWorker() {
    if (typeof (Worker) !== "undefined") {
      if (typeof (this.webWorker) == "undefined") {
        this.webWorker = new Worker("assets/demo-worker.js");
        console.log('web-worker initialized');
      }
      this.webWorker.onmessage = function (event) {
        document.getElementById("result").innerHTML = event.data;
      };
    } else {
      document.getElementById("result").innerHTML = "Sorry, your browser does not support Web Workers...";
    }
  }

  stopWorker() {
    this.webWorker.terminate();
    this.webWorker = undefined;
  }


  startTimeFrame() {
    this.requestAnimationFrame = window.requestAnimationFrame(this.requestAnimationFrameFunction.bind(this));
  }

  ngOnInit(): void {
  }

  getAnimationFrameFunction() {
    if (!this.timeElapsed) {
      this.timerOldValue = performance.now();
    }

    const currentTime = performance.now();

    this.timeElapsed = currentTime - this.timerOldValue + this.stoppedTimer;

    this.setDisplayValues();

    if (parseInt(this.timerDisplay.seconds) % (55) === 0 && parseInt(this.timerDisplay.seconds) !== 0) {

      if (this.audio) {
        this.audio.play();
        setTimeout(() => {
          this.audio.pause();
          this.audio.currentTime = 0;
        }, 5000);
      }
    }

    if (this.requestAnimationFrameFunction) {
      window.requestAnimationFrame(this.requestAnimationFrameFunction.bind(this));
    }
  }


  setDisplayValues() {
    let seconds = (this.timeElapsed / 1000).toString();
    this.timerDisplay.milliseconds = (this.timeElapsed / 1000).toString().split('.')[1].substr(0, 2);
    this.timerDisplay.seconds = parseInt((this.timeElapsed / 1000).toString().split('.')[0]) % 60;
    this.timerDisplay.minutes = parseInt((Number(seconds.split('.')[0]) / 60).toString()) % 60;
    this.timerDisplay.hours = parseInt((Number(seconds.split('.')[0]) / 3600).toString()) % 60;
  }

  ngOnChanges(changes: SimpleChanges) {
    console.log(changes);
  }
}
