
let timerOldValue = performance.now();
let timeElapsed;
let stoppedTimer = 0;
requestAnimationFrame(this.requestAnimationFrameFunction.bind(this));

function getTimerValues() {
  postMessage(timeElapsed);
}

function timerFunction() {
  const currentTime = performance.now();
  timeElapsed = currentTime - timerOldValue + stoppedTimer;
  this.getTimerValues(); 
}

function requestAnimationFrameFunction() {
    this.timerFunction();
    requestAnimationFrameTimer = requestAnimationFrame(this.requestAnimationFrameFunction.bind(this));
}



