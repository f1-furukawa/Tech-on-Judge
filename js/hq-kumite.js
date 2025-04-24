const ws = new WebSocket(wsurl);
const urlParams = new URLSearchParams(window.location.search);
const courtId = urlParams.get('courtId');
const judgeId = `main`;

document.title = `${courtId} | 本部`;
document.getElementById('courtId').textContent = courtId;

ws.onopen = () => {
    ws.send(JSON.stringify({ type: 'joincourt', courtId, judgeId, role:'main',mode:'kumite' }));
};

ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    switch (data.type) 
    {
        case 'scores': {
            const scores = data.Scores;
            const judgeScores = document.getElementById('judgeScores');
            judgeScores.innerHTML = ''; // テーブルをクリア

            scores.forEach(score => {
                
                const { judgeId, red, blue, diff } = score;

                // ジャッジごとのスコアをテーブルに追加
                const row = `<tr>
                    <td>${judgeId}</td>
                    <td>${red}</td>
                    <td>${blue}</td>
                    <td>
                        <input type="hidden" class="targetjudgeid" value='${judgeId}'>
                        <button class="scorereset" >スコアリセット</button>
                        <button class="remove" >ジャッジ退出</button>
                    </td>
                </tr>`;
                judgeScores.innerHTML += row;
                    
            });
            break;
        }
        case 'Timer': {
            applyTimerState(data.Controls);
            break;
        }
        case 'extendMatch': {
            // 時間を60秒にセットし直す。
            applyTimerState(data.Controls);
            break;
        }
    }
    const ctrl = data.Controls;

    document.getElementById('red-warning').textContent = ctrl.redWarnig;
    document.getElementById('blue-warning').textContent = ctrl.blueWarnig;
    document.getElementById('red-fouls').textContent = ctrl.redFouls;
    document.getElementById('blue-fouls').textContent = ctrl.blueFouls;

    judgeCountMarks(ctrl.maxJudgeCount);
    showdownMarks(ctrl.showdown);
    timerCountMarks(ctrl.timerRange);
    timerControlMarks(ctrl.timer);
};

function timerCountMarks(timerRange){
    document.querySelectorAll('.btntimer').forEach((btn) => { 
        btn.classList.remove('active');
    });

    targetClass = String(timerRange).padStart(3, '0');
    console.log(targetClass);

    let buttons = document.querySelectorAll(`.t${targetClass}`);
    if(buttons.length === 0){
        buttons = document.querySelectorAll(`.tcustom`);}

    buttons.forEach((btn) => {
        btn.classList.add('active');
    });

    document.getElementById('customtime').value = timerRange;
}

function timerControlMarks(timer)
{
    document.querySelectorAll('.btntimercontrol').forEach((btn) => { 
        btn.classList.remove('active');
    });

    timer = (timer === 'start') ? timer : 'stop' ;

    document.querySelectorAll(`.t${timer}`).forEach((btn) => {
        btn.classList.add('active');
    });
}

function timer(command,settingtime = 180) 
{
    const data = JSON.stringify({type: 'timer',command,'timerRange':settingtime});
    ws.send(data);
}

function updateWarningFoul(isFouls,red,blue){
    const data = JSON.stringify({type:'Fouls',isFouls,red,blue});
    ws.send(data);
}

function endMatch(){
    const data = JSON.stringify({type:'endMatch'});
    ws.send(data);
}

function extendMatch(){
    const data = JSON.stringify({type:'extendMatch'});
    ws.send(data);
}

function setCustomTime()
{
    const time = document.getElementById('customtime').value;
    if (time) {
        timer('reset', time);
    } else {
        alert('時間を入力してください。');
    }
}

function blinkStop(){
    const data = JSON.stringify({type:'blinkStop'});
    ws.send(data);
}

function FoulsReset()
{
    const data = JSON.stringify({ type: 'FoulsReset', courtId });
    ws.send(data);
}