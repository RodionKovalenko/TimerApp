let timerOldValue = performance.now();
let requestAnimationFrameTimer;
let timeElapsed;
let stoppedTimer = 0;

requestAnimationFrame(requestAnimationFrameFunction.bind(this));

function getTimerValues() {
  this.postMessage(timeElapsed);
}

function timerFunction() {
  const currentTime = performance.now();
  timeElapsed = currentTime - timerOldValue + stoppedTimer;
  getTimerValues();
}

function requestAnimationFrameFunction() {
  timerFunction();
  requestAnimationFrameTimer = requestAnimationFrame(requestAnimationFrameFunction.bind(this));
}


