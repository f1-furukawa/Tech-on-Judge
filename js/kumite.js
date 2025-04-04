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
        const judgesBarContainer = document.getElementById('judges-bar-container');
      
        let totalRedPoints = 0;
        let totalBluePoints = 0;

        const scores = data.Scores;

        removeJudgeBar(scores);

        Object.values(scores).forEach(score => {
            const { judgeId, red, blue, diff } = score;
            makeJadgeBar(judgesBarContainer,judgeId);
            
            const judgeBar = document.getElementById(judgeId); // 親要素を取得
            judgeBar.querySelectorAll('.RScore')[0].textContent = red;
            judgeBar.querySelectorAll(`.BScore`)[0].textContent = blue;

            //一旦バーを黒に戻す
            judgeBar.querySelectorAll('.b4').forEach(bar => {
                bar.classList.remove('blue');
                bar.classList.add('black');
            });
            judgeBar.querySelectorAll('.r4').forEach(bar => {
                bar.classList.remove('red');
                bar.classList.add('black');
            });

            // 差に基づいてポイントを加算
            const absDiff = Math.abs(diff) > 4 ? 4 : Math.abs(diff);
            if (diff > 0)
            {   
                totalRedPoints++;
                setScoreBar(judgeId,'.r' + absDiff,'red');
            }
            else if (diff < 0)
            {
                totalBluePoints++;
                setScoreBar(judgeId,'.b' + absDiff,'blue');
            } 
        });

        let mainjudge = data.Controls;
        
        console.log(mainjudge);
        document.getElementById('redWarning').textContent = mainjudge.redWarnig ?? 0;
        document.getElementById('blueWarning').textContent = mainjudge.blueWarnig ?? 0;
        document.getElementById('redFouls').textContent = mainjudge.redFouls ?? 0;
        document.getElementById('blueFouls').textContent = mainjudge.blueFouls ?? 0;

        // 合計ポイントを更新
        document.getElementById('totalRedPoints').textContent = totalRedPoints;
        document.getElementById('totalBluePoints').textContent = totalBluePoints;
    }

    if(data.type === 'Timer')
    {
        console.log(data.Controls.timer);
        switch (data.Controls.timer) {
            case 'start':
                resumeCountdown();
                break;
            case 'stop':
                pauseCountdown();
                break;
            case 'reset':
                timerReset();
                break;
        }
    }
};


document.getElementById('resetButton').addEventListener('click', () => {
    ws.send(JSON.stringify({ type: 'reset' }));
    document.getElementById('judges-bar-container').innerHTML = '';
});

function isDebugEmpty(obj) {
    return (
        obj &&
        typeof obj === "object" &&
        Object.keys(obj).length === 0 &&
        (obj.constructor === Object || obj.constructor === undefined)
    );
}

function makeJadgeBar(container,jid)
{
    const jBar = document.getElementById(jid);
    if(!jBar)
    {
        const bars = `
        <div class="judge-bar" id="${jid}">
            <div class="bar-group">
                <div class="bar red r4"></div>
                <div class="bar red r3 r4"></div>
                <div class="bar red r2 r3 r4"></div>
                <div class="bar red r1 r2 r3 r4"></div>
            </div>
            <div class="bar-divider"></div>
            <div class="bar-group">
                <div class="bar blue b1 b2 b3 b4"></div>
                <div class="bar blue b2 b3 b4"></div>
                <div class="bar blue b3 b4"></div>
                <div class="bar blue b4"></div>
            </div>
            <div class="score-box"><span class="RScore">2</span>-<span class="BScore">2</span></div>
            <div class="judge-id">${jid}</div>
        </div>
        `;
        container.innerHTML += bars;
    }
}

function removeJudgeBar(scores)
{
    // すべての judge-bar 要素を取得
    const judgeBars = document.querySelectorAll(".judge-bar");
    const validJudgeIds = Object.keys(scores);

    // 各 judge-bar 要素をチェックし、該当しないものを削除
    judgeBars.forEach(judgeBar => {
        if (!validJudgeIds.includes(judgeBar.id)) {
            judgeBar.remove(); // 削除
        }
    });

}

function setScoreBar(judgeId,onclass,colorclass)
{
    console.log(judgeId,onclass,colorclass);
    const judgeBar = document.getElementById(judgeId);
    const bars = judgeBar.querySelectorAll(onclass);
    console.log(bars.length);
    if (bars.length > 0) {
        bars.forEach(bar => {
            bar.classList.remove('black');
            bar.classList.add(colorclass);
        });
    }
}
