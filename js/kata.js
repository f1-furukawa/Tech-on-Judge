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
    console.log(data);

    if (data.type === 'scores') {
        const judgesBarContainer = document.getElementById('judge-scores-container');
        
        
        let totalRedPoints = 0;
        let totalBluePoints = 0;
        let totalEvenPoints = 0;

        const scores = data.Scores;

        scores.forEach(score => {
            const { judgeId, red, blue, diff } = score;
            makeJadgeBar(judgesBarContainer,judgeId);
            
            const judgeBar = document.getElementById(judgeId); // 親要素を取得
            judgeBar.querySelectorAll('.RScore1')[0].textContent = getKataScore(red);
            judgeBar.querySelectorAll(`.BScore1`)[0].textContent = getKataScore(blue);

            // 差に基づいてポイントを加算
            
            if (diff < 0) totalRedPoints++;
            else if (diff > 0) totalBluePoints++;    
            else if(diff == 0) totalEvenPoints++;
            

        });

        // 合計ポイントを更新
        document.getElementById('totalRedPoints').textContent = totalRedPoints;
        document.getElementById('totalBluePoints').textContent = totalBluePoints;
        document.getElementById('totalEvenPoints').textContent = totalEvenPoints;
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

function getKataScore(point)
{
    return ((100 - (point * 2)) / 10).toFixed(1);
}