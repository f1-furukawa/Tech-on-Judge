const settingtime = 180; // 3分（180秒）

let remainingTime = settingtime
let timerInterval;
let isPaused = true;

function updateTimerDisplay() {
    let minutes = Math.floor(remainingTime / 60);
    let seconds = remainingTime % 60;
    document.getElementById("timer").textContent = 
        String(minutes).padStart(2, '0') + ":" + String(seconds).padStart(2, '0');
}

function startCountdown() {
    updateTimerDisplay(); // 初回表示更新
    timerInterval = setInterval(() => {
        remainingTime--;
        updateTimerDisplay();
        
        if (remainingTime <= 0) {
            clearInterval(timerInterval);
        }
    }, 1000);
}

function resumeCountdown() {
    isPaused = false;
    startCountdown(); // タイマーを再開
}

function pauseCountdown() {
    isPaused = true;
    clearInterval(timerInterval); // タイマーを停止
}

function timerControle() {
    if (isPaused) {
        resumeCountdown();
    } else {
        pauseCountdown();
    }
}

document.getElementById("timer").addEventListener("click", timerControle);
document.getElementById("resetButton").addEventListener("click", 
    function(){
        remainingTime = settingtime;
        updateTimerDisplay(); 
        if (!isPaused) pauseCountdown(); 
    });

