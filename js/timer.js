
let timerInterval;
let isRunning = false;

let settingtime = 180; // 3分（180秒）
let startTimeStamp;
let pauseElapsed = 0;


function updateTimerDisplay(remainingTime) {
    let minutes = Math.floor(remainingTime / 60);
    let seconds = Math.round(remainingTime % 60);
    document.getElementById("timer").textContent = 
        String(minutes).padStart(2, '0') + ":" + String(seconds).padStart(2, '0');
}

function resumeCountdown() {
    
    if (isRunning) return; // 二重起動防止

    isRunning = true;
    startTimeStamp = Date.now() - pauseElapsed * 1000; // 再開時のタイムスタンプを更新
    
    clearInterval(timerInterval); // ←一旦クリアしてから再開
    timerInterval = setInterval(() => {
        const now = Date.now();
        const elapsed = (now - startTimeStamp) / 1000;
        const remaining = Math.max(0, settingtime - elapsed); // 残り時間を計算

        updateTimerDisplay(remaining);

        if (remaining <= 0) 
        {
            clearInterval(timerInterval);
            pauseElapsed = 0;
        }
    }, 500);
}

function pauseCountdown() {
    if (!isRunning) return;

    clearInterval(timerInterval); // タイマーを停止
    const now = Date.now();
    pauseElapsed = (now - startTimeStamp) / 1000; // 停止時の経過時間を保存
    isRunning = false;
}

function timerReset(newtime = 180) {
    settingtime = newtime; // 新しい設定時間を保存
    clearInterval(timerInterval); // タイマーを停止
    pauseElapsed = 0; // 経過時間をリセット
    isRunning = false;
    updateTimerDisplay(settingtime); 
}

