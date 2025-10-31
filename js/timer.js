
let timerInterval;
let timeOffset = 0;

const buzzer = new Audio("img/buzzer.mp3");


function updateTimerDisplay(remainingTime) {
    let minutes = Math.floor(remainingTime / 60);
    let seconds = Math.round(remainingTime % 60);
    document.getElementById("timer").textContent = 
        String(minutes).padStart(2, '0') + ":" + String(seconds).padStart(2, '0');
}

function applyTimerState(controls) {
    clearInterval(timerInterval);
    
    if (!controls || !controls.timer) return;
    
    if(controls.serverNow){
        const localNow = Date.now();
        timeOffset = controls.serverNow - localNow;
        console.log("timeoffset (ms):",timeOffset);
    }
    
    let remaining = controls.timerRange;

    if (controls.timer === 'start') {
        const serverNow = Date.now() + timeOffset;
        const elapsed = (serverNow - controls.startTimestamp) / 1000;
        remaining = Math.max(0, controls.timerRange - elapsed);
        startCountdownFromRemaining(remaining);
    } else if (controls.timer === 'stop') {
        remaining = Math.max(0, controls.timerRange - controls.pauseElapsed);
        updateTimerDisplay(remaining);
    }
}

function startCountdownFromRemaining(startSeconds) {    
    let startTime = Date.now();
    let hasBuzzed = false; // ブザーが1回だけ鳴るように

    timerInterval = setInterval(() => {
        let elapsed = (Date.now() - startTime) / 1000;
        let remaining = Math.max(0, startSeconds - elapsed);
        updateTimerDisplay(remaining);

        if (remaining <= 0) {
            clearInterval(timerInterval);

            // ブザー再生（1回だけ）
            if (!hasBuzzed) {
                console.log("beeeeeep!!");
                buzzer.play().catch(err => console.error("ブザー再生エラー:", err));
                hasBuzzed = true;
            }
        }
    }, 500);
}


