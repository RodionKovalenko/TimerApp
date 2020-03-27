import { Component, OnInit, ViewEncapsulation, ViewChild, ElementRef, OnDestroy, AfterViewInit } from '@angular/core';
import * as cocoSSD from '@tensorflow-models/coco-ssd';
import { ThemePalette } from '@angular/material/core';
import { ProgressSpinnerMode } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ChangeDetectionStrategy } from '@angular/compiler/src/compiler_facade_interface';
import { Router } from '@angular/router';

@Component({
  selector: 'app-image-recogntion',
  templateUrl: './image-recogntion.component.html',
  styleUrls: ['./image-recogntion.component.css'],
  encapsulation: ViewEncapsulation.None
})
export class ImageRecogntionComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('video') video: ElementRef;
  loading: boolean;
  predictions: any;
  frontCameraActive: any;
  backCameraActive: any;
  cocoModel: any;
  color: ThemePalette = 'primary';
  mode: ProgressSpinnerMode = 'determinate';
  spinnerValue = 100;
  imageRecogntionTimerWorker: any;
  
  constructor(private _snackBar: MatSnackBar, private router: Router) {     
    router.events.subscribe((event) =>{
       this.terminateWorker();
    });
  }

  async ngOnInit() {   
    this.loading = true;  
    this.mode = 'indeterminate';
    this.cocoModel = await cocoSSD.load();
    this.mode = 'determinate';
    this.loading = false;
    this.spinnerValue = 0;  
    this.frontCameraActive = true;
    this.onTurnCamera(null);    
    this.initializeServiceWorker();
  }
  
  async ngAfterViewInit() {    
  }  

  startCamera(constraints) {
    this.initializeServiceWorker();
    const vid = this.video.nativeElement;

    if (!constraints) {
      constraints = true;
    }

    if (navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices.getUserMedia({audio: false, video: constraints })
        .then((stream) => {
          vid.srcObject = stream;

        })
        .catch((err0r) => {
          console.log('Something went wrong!');
        });       
    }
  }

  onTurnCamera(event): void {
    let constraints = null;
    if (this.frontCameraActive) {
        constraints = {
            advanced: [{
                facingMode: "environment"
            }]
        };
    }
    this.frontCameraActive = !this.frontCameraActive;
    this.startCamera(constraints);
  } 
  
  initializeServiceWorker() {
    if (typeof (Worker) !== "undefined") {
      if (typeof (this.imageRecogntionTimerWorker) == "undefined") {
        this.imageRecogntionTimerWorker = new Worker('assets/image-recognition-timer-worker.js');
        console.log('image worker initialized');
      }
      this.imageRecogntionTimerWorker.onmessage = this.onTimerMessageEvent.bind(this);
    } else {
      this.showToastMessage('not supported', 'Sorry, your browser does not support Web Workers', 5000);
    }
  }

  startWorker() {
    this.initializeServiceWorker();
  }

  terminateWorker() {
    if (this.imageRecogntionTimerWorker) {
      this.imageRecogntionTimerWorker.terminate();
      this.imageRecogntionTimerWorker = undefined;
    }
  }

  onTimerMessageEvent(event) {
    this.cocoModel.detect(this.video.nativeElement).then((predictions) => {
      this.predictions = predictions; 
    });       
  };

  showToastMessage(title, message, duration) {
    this._snackBar.open(title, message, { duration: duration, direction: 'ltr', verticalPosition: 'top' });
  }
}
