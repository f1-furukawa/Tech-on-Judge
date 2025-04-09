// URLパラメータから部屋IDを取得
const urlParams = new URLSearchParams(window.location.search);
const courtId = urlParams.get('courtId');

// タイトルと見出しを動的に設定
document.title = `コート ${courtId} | スコアボード`;
document.querySelector('#courtname').textContent = `${courtId}`;

const ws = new WebSocket(wsurl);

ws.onopen = () => {
    ws.send(JSON.stringify({ type: 'joincourt', courtId, mode: courtId.startsWith('kata') ? 'kata' : 'kumite' }));
};

ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    switch (data.type) {
        case 'scores':
            const judgesBarContainer = document.getElementById('judge-scores-container');
            
            let totalScores = { red: 0, blue: 0, even: 0 };

            const scores = data.Scores;

            removeJudgeBar(scores);

            Object.values(scores).forEach(score => {
                const { judgeId, red, blue, diff,red2,blue2,diff2} = score;
                makeJadgeBar(judgesBarContainer,judgeId);
                
                const judgeBar = document.getElementById(judgeId); // 親要素を取得
                judgeBar.querySelectorAll('.RScore1')[0].textContent = getKataScore(red);
                judgeBar.querySelectorAll(`.BScore1`)[0].textContent = getKataScore(blue);
                judgeBar.querySelectorAll('.RScore2')[0].textContent = getKataScore(red2);
                judgeBar.querySelectorAll(`.BScore2`)[0].textContent = getKataScore(blue2);

                // 差に基づいてポイントを加算
                if (diff < 0) totalScores.red++;
                else if (diff > 0) totalScores.blue++;    
                else if(diff == 0) totalScores.even++;

                if(data.Controls.numberOfMatche == 2){
                    if (diff2 < 0) totalScores.red++;
                    else if (diff2 > 0) totalScores.blue++;    
                    else if(diff2 == 0) totalScores.even++;
                }
            });

            // 合計ポイントを更新
            document.getElementById('totalRedPoints').textContent = totalScores.red;
            document.getElementById('totalBluePoints').textContent = totalScores.blue;
            document.getElementById('totalEvenPoints').textContent = totalScores.even;

            //スコアの表示
            numberofmatchShows(data.Controls.numberOfMatche);
            
            break;

        case 'Showdown':
        {
            document.getElementById('judge-scores-container').classList.add('hidden');
            document.getElementById('score').style.visibility = 'hidden';

            if(data.Controls.showdown === 'result')
            {
                document.getElementById('score').style.visibility = 'visible';
            }

            if(data.Controls.showdown === 'show')
            {
                document.getElementById('judge-scores-container').classList.remove('hidden');
                document.getElementById('score').style.visibility = 'visible';
            }
            break;
        }
        case 'kataName':
        {
            document.getElementById('kataName').textContent = data.Controls.kataName;
            break;
        }
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
                        <div class="score-text BScore1 s1">2.4</div>
                        <div class="score-text BScore2 s2">0.0</div>
                    </div>
                    <div class="judge">
                        <div class="red-bar bar"></div>
                        <div class="score-text RScore1 s1">2.2</div>
                        <div class="score-text RScore2 s2">0.0</div>
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
    const validJudgeIds = Object.keys(scores);

    // 各 judge-bar 要素をチェックし、該当しないものを削除
    judgeBars.forEach(judgeBar => {
        if (!validJudgeIds.includes(judgeBar.id)) {
            judgeBar.remove(); // 削除
        }
    });
}

function numberofmatchShows(number)
{
    visibility = 'hidden';
    if(number !== 1){
        visibility = 'visible';
    }

    document.querySelectorAll('.s2').forEach((score) => {
        score.style.visibility = visibility;
    });
}

function getKataScore(point)
{
    return ((100 - (point * 2)) / 10).toFixed(1);
}

function scoreCalculation(red,blue)
{
    const redScore = getKataScore(red);
    const blueScore = getKataScore(blue);
    return {redScore,blueScore};
}