
let timerInterval;

function updateTimerDisplay(remainingTime) {
    let minutes = Math.floor(remainingTime / 60);
    let seconds = Math.round(remainingTime % 60);
    document.getElementById("timer").textContent = 
        String(minutes).padStart(2, '0') + ":" + String(seconds).padStart(2, '0');
}

function applyTimerState(controls) {
    clearInterval(timerInterval);
    
    if (!controls || !controls.timer) return;
    
    const now = Date.now();
    let remaining = controls.timerRange;

    if (controls.timer === 'start') {
        const elapsed = (now - controls.startTimestamp) / 1000;
        remaining = Math.max(0, controls.timerRange - elapsed);
        startCountdownFromRemaining(remaining);
    } else if (controls.timer === 'stop') {
        remaining = Math.max(0, controls.timerRange - controls.pauseElapsed);
        updateTimerDisplay(remaining);
    }
}

function startCountdownFromRemaining(startSeconds) {    
    let startTime = Date.now();

    timerInterval = setInterval(() => {
        let elapsed = (Date.now() - startTime) / 1000;
        let remaining = Math.max(0, startSeconds - elapsed);
        updateTimerDisplay(remaining);

        if (remaining <= 0) {
            clearInterval(timerInterval);
        }
    }, 500);
}


