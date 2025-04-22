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

    if (data.type === 'scores') {
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

        const ctrl = data.Controls;
        judgeCountMarks(ctrl.maxJudgeCount);
    }


};

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

function blinkStop(){
    const data = JSON.stringify({type:'blinkStop'});
    ws.send(data);
}