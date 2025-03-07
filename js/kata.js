// URLパラメータから部屋IDを取得
const urlParams = new URLSearchParams(window.location.search);
const roomId = urlParams.get('roomId');

// タイトルと見出しを動的に設定
document.title = `部屋 ${roomId} | スコアボード`;
document.querySelector('#roomname').textContent = `${roomId}`;

//const ws = new WebSocket('https://tech-on-judge-ws.onrender.com');
const ws = new WebSocket(wsurl);

ws.onopen = () => {
    ws.send(JSON.stringify({ type: 'joinRoom', roomId, mode: roomId.startsWith('kata') ? 'kata' : 'kumite' }));
};

ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    console.log('onmessage',data);

    if (data.type === 'scores') {
        const judgesBarContainer = document.getElementById('judge-scores-container');
        
        let totalScores = [
            { red: 0, blue: 0, even: 0 }, // 1つ目のスコア
            { red: 0, blue: 0, even: 0 }  // 2つ目のスコア
        ];

        const scores = data.Scores;

        removeJudgeBar(scores);

        scores.forEach(score => {
            const { judgeId, red, blue, diff,red2,blue2,diff2} = score;
            makeJadgeBar(judgesBarContainer,judgeId);
            
            const judgeBar = document.getElementById(judgeId); // 親要素を取得
            judgeBar.querySelectorAll('.RScore1')[0].textContent = getKataScore(red);
            judgeBar.querySelectorAll(`.BScore1`)[0].textContent = getKataScore(blue);
            judgeBar.querySelectorAll('.RScore2')[0].textContent = getKataScore(red2);
            judgeBar.querySelectorAll(`.BScore2`)[0].textContent = getKataScore(blue2);

            // 差に基づいてポイントを加算
            if (diff < 0) totalScores[0].red++;
            else if (diff > 0) totalScores[0].blue++;    
            else if(diff == 0) totalScores[0].even++;

            if (diff2 < 0) totalScores[1].red++;
            else if (diff2 > 0) totalScores[1].blue++;    
            else if(diff2 == 0) totalScores[1].even++;
        });

        // 合計ポイントを更新
        const key = data.Controls.numberOfMatche - 1;
        document.getElementById('totalRedPoints').textContent = totalScores[key].red;
        document.getElementById('totalBluePoints').textContent = totalScores[key].blue;
        document.getElementById('totalEvenPoints').textContent = totalScores[key].even;
    }

    if(data.type === 'Showdown')
    {
        visibility = (data.Controls.showdown) ? 'visible' : 'hidden'

        document.getElementById('judge-scores-container').style.visibility = visibility;
        document.getElementById('score').style.visibility = visibility;
    }
};

document.getElementById('resetButton').addEventListener('click', () => {
    ws.send(JSON.stringify({ type: 'reset' }));
    document.getElementById('judge-scores-container').innerHTML = '';
});

function makeJadgeBar(container,jid)
{
    const jBar = document.getElementById(jid);
    if(!jBar)
    {
        const bars = `
            <div class="judge-block" id="${jid}">
                <div class="judge-id">${jid}</div> 
                <div class="judge-row">
                    <div class="judge">
                        <div class="blue-bar bar"></div>
                        <div class="score-text BScore1">2.4</div>
                        <div class="score-text BScore2">0.0</div>
                    </div>
                    <div class="judge">
                        <div class="red-bar bar"></div>
                        <div class="score-text RScore1">2.2</div>
                        <div class="score-text RScore2">0.0</div>
                    </div>
                </div>
            </div>
        `;
        container.innerHTML += bars;
    }
}

function removeJudgeBar(scores)
{
    // すべての judge-bar 要素を取得
    const judgeBars = document.querySelectorAll(".judge-block");
    const validJudgeIds = scores.map(score => score.judgeId);

    // 各 judge-bar 要素をチェックし、該当しないものを削除
    judgeBars.forEach(judgeBar => {
        if (!validJudgeIds.includes(judgeBar.id)) {
            judgeBar.remove(); // 削除
        }
    });

}

function getKataScore(point)
{
    return ((100 - (point * 2)) / 10).toFixed(1);
}