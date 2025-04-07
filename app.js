const WebSocket = require('ws');
const port = process.env.PORT || 8181;
console.log('port',port);
const wss = new WebSocket.Server({ port: port });

const courts = {}; // 部屋ごとのスコア管理

function broadcastScores(courtId) {
    const court = courts[courtId];
    const results = [];

    for (const [judgeId, data] of Object.entries(court.judges)) {
        const diff = data.red - data.blue;
        const diff2 = data.red2 - data.blue2;
        //results[judgeId] = { judgeId, red: data.red, blue: data.blue, diff ,red2:data.red2, blue2: data.blue2, diff2};
        results.push({ judgeId, red: data.red, blue: data.blue, diff ,red2:data.red2, blue2: data.blue2, diff2});
    }
    console.log('scores',results);
    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN && client.courtId === courtId) {
            
            client.send(JSON.stringify({
                type: 'scores',
                Scores: results,
                Controls: court.mainjudge,
            }));
        }
    });
}

function broadcastMainJudge(type,courtId)
{
    const court = courts[courtId];
    console.log(type,court.mainjudge);
    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN && client.courtId === courtId) {
            client.send(JSON.stringify({
                type: type,
                Controls: court.mainjudge,
            }));
        }
    });
}

function createMainJudge(mode)
{
    console.log('createMainJudge',mode);
    return { 
        timer: 'stop', 
        showdown:false, 
        redWarnig: 0,
        blueWarnig: 0,
        redFouls: 0, 
        blueFouls: 0, 
        numberOfMatche: 1,
        maxJudgeCount: mode === 'kumite' ? 4 : 5, // kumiteは4人、kataは5人
    };
}

wss.on('connection', ws => {
    ws.on('message', message => {
        const data = JSON.parse(message);
        console.log(data,ws.courtId);
        switch (data.type) {
            case 'joincourt':
                ws.courtId = data.courtId;
                if (!courts[data.courtId]) {
                    courts[data.courtId] = { mode: data.mode, judges: {} ,mainjudge:createMainJudge(data.mode)};
                }
                
                const court = courts[ws.courtId];
                if (data.role === 'judge') {

                    //ジャッジIDの文字を数字に変換
                    const judgeNumber = data.judgeId.charCodeAt(0) - 'A'.charCodeAt(0) + 1;

                    //ジャッジのMAX数を超えたら、何もしない
                    const maxJudgeCount = court.mainjudge.maxJudgeCount ?? 5;
                    if(maxJudgeCount < judgeNumber)
                    {
                        return;
                    }

                    court.judges[data.judgeId] = { red: 0, blue: 0, red2: 0, blue2:0 };
                }
                if(data.role === 'main'){
                    court.mainjudge = createMainJudge(data.mode);
                }

                console.log('JOIN COURT',court);
                break;
            case 'update':
                const judge = courts[ws.courtId].judges[data.judgeId];
                const numberOfMatche = courts[ws.courtId].mainjudge.numberOfMatche;
                if (judge) {
                    if(numberOfMatche === 1)
                    {
                        judge.red += data.red;
                        judge.blue += data.blue;
                    }
                    if(numberOfMatche === 2)
                    {
                        judge.red2 += data.red;
                        judge.blue2 += data.blue;
                    }
                }
                console.log('UPDATE',courts);
                break;
            case 'judgeCount':
                const maxJudgeCount = data.maxJudgeCount;
                courts[ws.courtId].mainjudge.maxJudgeCount = maxJudgeCount;

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
            case 'judgeremove':
                delete courts[ws.courtId].judges[data.judgeId];
                break;
            case 'timer':
                courts[ws.courtId].mainjudge.timer = data.command;
                broadcastMainJudge('Timer',ws.courtId);
                return;
            case 'Fouls':
                const main = courts[ws.courtId].mainjudge;
                if(data.isFouls){
                    main.redFouls += data.red;
                    main.blueFouls += data.blue;
                }
                else
                {
                    main.redWarnig += data.red;
                    main.blueWarnig += data.blue;
                }
                break;
            case 'Showdown':
                courts[ws.courtId].mainjudge.showdown = (data.command === 'show');
                broadcastMainJudge('Showdown',ws.courtId);
                return;
            case 'NumberOfMatche':
                courts[ws.courtId].mainjudge.numberOfMatche = data.number;
                break;
            case 'reset':
                courts[ws.courtId].judges = {};
                break;
        }

        broadcastScores(ws.courtId);
    });
});

console.log('WebSocket server running on ws://localhost:8181');