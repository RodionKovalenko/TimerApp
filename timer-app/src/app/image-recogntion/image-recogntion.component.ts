import { Component, OnInit, ViewEncapsulation, ViewChild, ElementRef, OnDestroy, AfterViewInit } from '@angular/core';
import * as cocoSSD from '@tensorflow-models/coco-ssd';

import { ThemePalette } from '@angular/material/core';
import { ProgressSpinnerMode } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-image-recogntion',
  templateUrl: './image-recogntion.component.html',
  styleUrls: ['./image-recogntion.component.css'],
  encapsulation: ViewEncapsulation.None
})
export class ImageRecogntionComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('video') video: ElementRef;
  loading: boolean;
  predictions: any;
  frontCameraActive: any;
  backCameraActive: any;
  cocoModel: any;
  color: ThemePalette = 'primary';
  mode: ProgressSpinnerMode = 'determinate';
  spinnerValue = 100;
  
  constructor() {
    console.log('initialized');
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
  }


  ngOnDestroy(): void {
    this.video = null;
    console.log('destroyed');
  }

  async ngAfterViewInit() {
    
  }  

  startCamera(constraints) {
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

        setInterval(async () => {
          this.cocoModel.detect(this.video.nativeElement).then((predictions) => {
            this.predictions = predictions; 
          });
            
       }, 3000);
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

}
