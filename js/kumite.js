// URLパラメータから部屋IDを取得
const urlParams = new URLSearchParams(window.location.search);
const courtId = urlParams.get('courtId');

// タイトルと見出しを動的に設定
document.title = `${courtId} | スコアボード`;
document.querySelector('#courtname').textContent = `${courtId}`;

const ws = new WebSocket(wsurl);

ws.onopen = () => {
    ws.send(JSON.stringify({ type: 'joincourt', courtId, mode: courtId.startsWith('kata') ? 'kata' : 'kumite' }));
};

ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    
    switch (data.type) {
        case 'scores': {
            const judgesBarContainer = document.getElementById('judges-bar-container');
            let totalRedPoints = 0;
            let totalBluePoints = 0;

            const scores = data.Scores;
            const controls = data.Controls;

            // 注意、反則の減算を行う。
            const redPenalty = Math.floor(controls.redWarnig / 3) + controls.redFouls;
            const bluePenalty = Math.floor(controls.blueWarnig / 3) + controls.blueFouls;

            removeJudgeBar(scores);
            scores.forEach(score => {
                let { judgeId, red, blue, diff } = score;

                // 注意・反則分の減点を行う
                red = red - redPenalty;
                blue = blue - bluePenalty;
                diff = red - blue;

                // ジャッジバーを作成・データの更新
                makeJadgeBar(judgesBarContainer, judgeId, red, blue);

                // 差に基づいてポイントを加算
                const absDiff = Math.abs(diff) > 5 ? 5 : Math.abs(diff);
                if (diff > 0) {
                    totalRedPoints++;
                    setScoreBar(judgeId, '.r' + absDiff, 'red');
                } else if (diff < 0) {
                    totalBluePoints++;
                    setScoreBar(judgeId, '.b' + absDiff, 'blue');
                }
            });

            document.getElementById('redWarning').textContent = controls.redWarnig ?? 0;
            document.getElementById('blueWarning').textContent = controls.blueWarnig ?? 0;
            document.getElementById('redFouls').textContent = controls.redFouls ?? 0;
            document.getElementById('blueFouls').textContent = controls.blueFouls ?? 0;

            // 合計ポイントを更新
            document.getElementById('totalRedPoints').textContent = totalRedPoints;
            document.getElementById('totalBluePoints').textContent = totalBluePoints;
            break;
        }

        case 'Timer': {
            switch (data.Controls.timer) {
                case 'start':
                    resumeCountdown();
                    break;
                case 'stop':
                    pauseCountdown();
                    break;
                case 'reset':
                    timerReset(data.Controls.timerRange);
                    break;
            }
            break;
        }

        case 'extendMatch': {
            // 時間を60秒にセットし直す。
            timerReset(60);
            break;
        }

        case 'Showdown': {
            if (data.Controls.showdown === 'show') {
                document.getElementById('judges-bar-container').classList.remove('hidden');
            }

            if (data.Controls.showdown === 'hidde') {
                document.getElementById('judges-bar-container').classList.add('hidden');
            }
            break;
        }

        case 'blinkStop': {
            blinkStop();
            break;
        }

        case 'endMatch': {
            blinkStop();

            // 勝敗を確認して、勝者のスコアを点滅させる
            // 合計ポイントを取得
            const redPoint = parseInt(document.getElementById('totalRedPoints').textContent, 10);
            const bluePoint = parseInt(document.getElementById('totalBluePoints').textContent, 10);

            if (redPoint >= bluePoint) {
                document.getElementById('totalRedPoints').classList.add('blink');
            }

            if (bluePoint >= redPoint) {
                document.getElementById('totalBluePoints').classList.add('blink');
            }
            break;
        }

        default:
            console.log(`Unknown data type: ${data.type}`);
            break;
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

function makeJadgeBar(container,jid,red,blue)
{
    const jBar = document.getElementById(jid);
    if(!jBar)
    {
        const bars = `
        <div class="judge-bar" id="${jid}">
            <div class="bar-group">
                <div class="bar red r5"></div>
                <div class="bar red r4 r5"></div>
                <div class="bar red r3 r4 r5"></div>
                <div class="bar red r2 r3 r4 r5"></div>
                <div class="bar red r1 r2 r3 r4 r5"></div>
            </div>
            <div class="bar-divider"></div>
            <div class="bar-group">
                <div class="bar blue b1 b2 b3 b4 b5"></div>
                <div class="bar blue b2 b3 b4 b5"></div>
                <div class="bar blue b3 b4 b5"></div>
                <div class="bar blue b4 b5"></div>
                <div class="bar blue b5"></div>
            </div>
            <div class="score-box"><span class="RScore">2</span>-<span class="BScore">2</span></div>
            <div class="judge-id">${jid}</div>
        </div>
        `;
        container.innerHTML += bars;
    }

    // 親要素を取得
    const judgeBar = document.getElementById(jid); 

    //一旦バーを黒に戻す
    judgeBar.querySelectorAll('.b5').forEach(bar => {
        bar.classList.remove('blue');
        bar.classList.add('black');
    });
    judgeBar.querySelectorAll('.r5').forEach(bar => {
        bar.classList.remove('red');
        bar.classList.add('black');
    });

    // スコアを更新
    const viewRed = Math.abs(red);
    const viewBlue = Math.abs(blue);
    
    judgeBar.querySelectorAll('.RScore')[0].textContent = viewRed;
    judgeBar.querySelectorAll(`.BScore`)[0].textContent = viewBlue;

    judgeBar.querySelectorAll('.RScore')[0].style.color = red < 0 ? 'red' : 'black';
    judgeBar.querySelectorAll('.BScore')[0].style.color = blue < 0 ? 'red' : 'black';

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
    const judgeBar = document.getElementById(judgeId);
    const bars = judgeBar.querySelectorAll(onclass);
    if (bars.length > 0) {
        bars.forEach(bar => {
            bar.classList.remove('black');
            bar.classList.add(colorclass);
        });
    }
}

function blinkStop()
{
    document.getElementById('totalRedPoints').classList.remove('blink');
    document.getElementById('totalBluePoints').classList.remove('blink');
}