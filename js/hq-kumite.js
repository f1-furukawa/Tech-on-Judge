const ws = new WebSocket(wsurl);
const urlParams = new URLSearchParams(window.location.search);
const courtId = urlParams.get('courtId');
console.log(courtId); // "kata-courtA" など

const judgeId = `main`;

document.getElementById('courtId').textContent = courtId;

ws.onopen = () => {
    ws.send(JSON.stringify({ type: 'joincourt', courtId, judgeId, role:'main',mode:'kumite' }));
};

function timer(command)
{
    const data = JSON.stringify({type: 'timer',command})
    ws.send(data);
}

ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    console.log(data);

    if (data.type === 'scores') {
        const scores = data.Scores;
        console.log(scores);
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

function updateWarningFoul(isFouls,red,blue){
    const data = JSON.stringify({type:'Fouls',isFouls,red,blue});
    ws.send(data);
}



