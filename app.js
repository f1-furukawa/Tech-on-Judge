const WebSocket = require('ws');
const port = process.env.PORT || 8181;
console.log('port',port);
const wss = new WebSocket.Server({ port: port });

const courts = {}; // 部屋ごとのスコア管理


function getResult(court)
{
    const results = [];
    for (const [judgeId, data] of Object.entries(court.judges)) {
        const diff = data.red - data.blue;
        const diff2 = data.red2 - data.blue2;
        results.push({ judgeId, red: data.red, blue: data.blue, diff ,red2:data.red2, blue2: data.blue2, diff2});
    }
    return results;
}

function broadcast(type,courtId){
    const court = courts[courtId];
    let result = [];
    switch(type){
        case 'scores':
        case 'endMatch':
        case 'extendMatch':
            result = getResult(court);
            break;
        default:
    }
    console.log('broadcast',type,result,court.Controls);
    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN && client.courtId === courtId) {
            client.send(JSON.stringify({
                type: type,
                Scores: result,
                Controls: court.Controls,
            }));
        }
    });
}


function createControls(mode)
{
    return { 
        timer: 'stop', 
        timerRange:180,
        startTimestamp: null, // Date.now()
        pauseElapsed: 0, // 停止中に経過していた時間
        showdown:false, 
        redWarnig: 0,
        blueWarnig: 0,
        redFouls: 0, 
        blueFouls: 0, 
        numberOfMatche: 1,
        kataName: '',
        maxJudgeCount: mode === 'kumite' ? 4 : 5, // kumiteは4人、kataは5人
    };
}

wss.on('connection', ws => {
    ws.on('message', message => {
        const data = JSON.parse(message);
        console.log('message',data,ws.courtId);
        switch (data.type) {
            case 'joincourt':
                ws.courtId = data.courtId;
                if (!courts[data.courtId]) {
                    courts[data.courtId] = { mode: data.mode, judges: {} ,Controls:createControls(data.mode)};
                }
                
                const court = courts[ws.courtId];
                if (data.role === 'judge') {

                    //ジャッジIDの文字を数字に変換
                    const judgeNumber = data.judgeId.charCodeAt(0) - 'A'.charCodeAt(0) + 1;

                    //ジャッジのMAX数を超えたら、何もしない
                    const maxJudgeCount = court.Controls.maxJudgeCount ?? 5;
                    if(maxJudgeCount < judgeNumber)
                    {
                        return;
                    }

                    if(!court.judges[data.judgeId])
                    {
                        court.judges[data.judgeId] = { red: 0, blue: 0, red2: 0, blue2:0 };
                    }

                    //ジャッジのID順にソートする
                    const sortedJudgesObject = Object.fromEntries(
                        Object.entries(court.judges)
                          .sort((a, b) => a[0].localeCompare(b[0]))
                    );
                    court.judges = sortedJudgesObject;
                }
                if(data.role === 'main'){
                    const mianControl = court.Controls;
                    if(!mianControl){
                        court.Controls = createControls(data.mode);
                    }
                }
                //タイマー同期のために最初の状態を送信する。
                if (court) {
                    ws.send(JSON.stringify({
                        type: 'Timer',
                        Controls: court.Controls
                    }));
                }
                console.log('JOIN COURT',court);
                break;
            case 'update':
                const judge = courts[ws.courtId].judges[data.judgeId];
                const numberOfMatche = courts[ws.courtId].Controls.numberOfMatche;
                if (judge) {
                    if(numberOfMatche === 1)
                    {
                        judge.red += data.red;
                        judge.blue += data.blue;

                        if(data.red >= 1000)judge.red = 50;
                        if(data.blue >= 1000)judge.blue = 50;
                        
                    }
                    if(numberOfMatche === 2)
                    {
                        judge.red2 += data.red;
                        judge.blue2 += data.blue;
                        if(data.red >= 1000)judge.red2 = 50;
                        if(data.blue >= 1000)judge.blue2 = 50;
                    }
                }
                console.log('UPDATE',courts);
                break;
            case 'judgeCount':
                const maxJudgeCount = data.maxJudgeCount;
                courts[ws.courtId].Controls.maxJudgeCount = maxJudgeCount;

                //規定数以上のジャッジIDのメンバーを削除する
                for (const judge in courts[ws.courtId].judges) {
                    const judgeNumber = judge.charCodeAt(0) - 'A'.charCodeAt(0) + 1;
                    if(maxJudgeCount < judgeNumber)
                    {
                        delete courts[ws.courtId].judges[judge];
                    }
                }
            case 'judgereset':
                const target = courts[ws.courtId].judges[data.judgeId];
                if(target){
                    target.red = 0;
                    target.blue = 0;
                    target.red2 = 0;
                    target.blue2 = 0;
                }
                break;
            case 'AllJudgeScoreReset':
                for (const judge in courts[ws.courtId].judges) {
                    const target = courts[ws.courtId].judges[judge];
                    target.red = 0;
                    target.blue = 0;
                    target.red2 = 0;
                    target.blue2 = 0;
                }
                break;
            case 'FoulsReset':
                const controls = courts[ws.courtId].Controls;
                controls.redWarnig = 0;
                controls.blueWarnig = 0;
                controls.redFouls = 0;
                controls.blueFouls = 0;
                break;
            case 'judgeremove':
                delete courts[ws.courtId].judges[data.judgeId];
                break;
            case 'timer':
                const ctrl = courts[ws.courtId].Controls;
                const now = Date.now();

                switch(data.command){
                    case 'start':
                        if(ctrl.timer !== 'start')
                        {
                            ctrl.timer = 'start';
                            ctrl.startTimestamp = now - ctrl.pauseElapsed * 1000; // 再開時のタイムスタンプを更新
                        }
                        break;
                    case 'stop':
                        if(ctrl.timer === 'start')
                        {
                            ctrl.timer = 'stop';
                            ctrl.pauseElapsed = (now - ctrl.startTimestamp) / 1000; // 停止時の経過時間を保存
                        }
                        break;
                    case 'reset':
                        ctrl.timer = 'stop'; // タイマーを停止
                        ctrl.startTimestamp = null; // Date.now()
                        ctrl.pauseElapsed = 0; // 停止中に経過していた時間
                        ctrl.timerRange = data.timerRange;
                        break;
                }
                // courts[ws.courtId].Controls.timer = data.command;
                // courts[ws.courtId].Controls.timerRange = data.timerRange;
                broadcast('Timer',ws.courtId);
                return;
            case 'Fouls':
                const main = courts[ws.courtId].Controls;
                if(data.isFouls){
                    main.redFouls = Math.max(0,main.redFouls + data.red);
                    main.blueFouls = Math.max(0,main.blueFouls + data.blue);
                }
                else
                {
                    main.redWarnig = Math.max(0, main.redWarnig + data.red);
                    main.blueWarnig = Math.max(0, main.blueWarnig + data.blue);
                }
                break;
            case 'Showdown':
                courts[ws.courtId].Controls.showdown = data.command;
                broadcast('Showdown',ws.courtId);
                return;
            case 'NumberOfMatche':
                courts[ws.courtId].Controls.numberOfMatche = data.number;
                break;
            case 'endMatch':
                broadcast('endMatch',ws.courtId);
                return;
            case 'blinkStop':
                broadcast('blinkStop',ws.courtId);
                return;
            case 'extendMatch':
                const resetCourt = courts[ws.courtId];
                //審判のスコアをリセットする。
                for (const jid in resetCourt.judges) 
                {
                    const judge = resetCourt.judges[jid];
                    judge.red = 0;
                    judge.blue = 0;
                    judge.red2 = 0;
                    judge.blue2 = 0;
                    judge.diff = 0;
                    judge.diff2 = 0;
                };

                const resetControls = resetCourt.Controls;
                resetControls.redWarnig = 0;
                resetControls.blueWarnig = 0;
                resetControls.redFouls = 0;
                resetControls.blueFouls = 0;
                resetControls.timer = 'stop'; // タイマーを停止
                resetControls.timerRange = 60; // 60秒にセット
                resetControls.startTimestamp = null; //経過状態を初期化
                resetControls.pauseElapsed = 0; 
                
                broadcast('extendMatch',ws.courtId);
                break;
            case 'kataName':
                courts[ws.courtId].Controls.kataName = data.kataName;
                broadcast('kataName',ws.courtId);
                break;
            case 'reset':
                courts[ws.courtId].judges = {};
                break;
        }

        broadcast('scores',ws.courtId);
    });
});

console.log('WebSocket server running on ws://localhost:8181');