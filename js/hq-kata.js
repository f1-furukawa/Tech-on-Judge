const ws = new WebSocket(wsurl);
const urlParams = new URLSearchParams(window.location.search);
const courtId = urlParams.get('courtId');
const judgeId = `main`;

document.getElementById('courtId').textContent = courtId;

ws.onopen = () => {
    ws.send(JSON.stringify({ type: 'joincourt', courtId, judgeId, role:'main',mode:'kata' }));
};



function numberofmatch(number)
{
    const data = JSON.stringify({type: 'NumberOfMatche',number})
    ws.send(data);
}

ws.onmessage = (event) => {
    const data = JSON.parse(event.data);

    if (data.type === 'scores') {
        const scores = data.Scores;
        const judgeScores = document.getElementById('judgeScores');
        judgeScores.innerHTML = ''; // テーブルをクリア

        scores.forEach(score => {
            const judgeScores = document.getElementById('judgeScores');
            const { judgeId, red, blue, diff } = score;

            // ジャッジごとのスコアをテーブルに追加
            const row = `<tr>
                <td>${judgeId}</td>
                <td>${getKataScore(red)}</td>
                <td>${getKataScore(blue)}</td>
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
        numberofmatchMarks(ctrl.numberOfMatche);

    }
};

function getKataScore(point)
{
    return ((100 - (point * 2)) / 10).toFixed(1);
}

function numberofmatchMarks(number)
{
    document.querySelectorAll('.nmbtn').forEach((btn) => { 
        btn.classList.remove('active');
    });

    document.querySelectorAll(`.nm${number}`).forEach((btn) => {
        btn.classList.add('active');
    });
}

document.querySelectorAll('.katabtn').forEach(button => {
    // 各ボタンにクリックイベントを追加
    button.addEventListener('click', function () {
        // 表示文字（テキスト）を取得
        let text = this.textContent;

        if(text === 'クリア') text = '';
        console.log('kataname',text);
        const data = JSON.stringify({type: 'kataName',kataName: text})
        ws.send(data);
    });
  });