let timerOldValue = performance.now();
let requestAnimationFrameTimer;
let timeElapsed;

requestAnimationFrame(requestAnimationFrameFunction.bind(this));

function getTimerValues() {
    this.postMessage(timeElapsed);
    timerOldValue = performance.now();
}

function timerFunction() {
    const currentTime = performance.now();
    timeElapsed = currentTime - timerOldValue;
    if (timeElapsed >= 3000) {
        getTimerValues();
    }
}

function requestAnimationFrameFunction() {
    timerFunction();
    requestAnimationFrameTimer = requestAnimationFrame(requestAnimationFrameFunction.bind(this));
}