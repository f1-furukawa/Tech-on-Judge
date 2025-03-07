const WebSocket = require('ws');
const port = process.env.PORT || 8181;
console.log('port',port);
const wss = new WebSocket.Server({ port: port });

const rooms = {}; // 部屋ごとのスコア管理

function broadcastScores(roomId) {
    const room = rooms[roomId];
    const results = [];

    for (const [judgeId, data] of Object.entries(room.judges)) {
        const diff = data.red - data.blue;
        const diff2 = data.red2 - data.blue2;
        results.push({ judgeId, red: data.red, blue: data.blue, diff ,red2:data.red2, blue2: data.blue2, diff2});
    }
    console.log('score',results);
    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN && client.roomId === roomId) {
            
            client.send(JSON.stringify({
                type: 'scores',
                Scores: results,
                Controls: room.mainjudge,
            }));
        }
    });
}

function broadcastMainJudge(type,roomId)
{
    const room = rooms[roomId];
    console.log(type,room.mainjudge);
    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN && client.roomId === roomId) {
            client.send(JSON.stringify({
                type: type,
                Controls: room.mainjudge,
            }));
        }
    });
}

function createMainJudge()
{
    return { timer: 'stop', showdown:false, redWarnig: 0,blueWarnig: 0,redFouls: 0, blueFouls: 0, numberOfMatche: 1 };
}

wss.on('connection', ws => {
    ws.on('message', message => {
        const data = JSON.parse(message);
        console.log(data,ws.roomId);
        switch (data.type) {
            case 'joinRoom':
                ws.roomId = data.roomId;
                if (!rooms[data.roomId]) {
                    rooms[data.roomId] = { mode: data.mode, judges: {} ,mainjudge:createMainJudge()};
                }
                
                const room = rooms[ws.roomId];
                if (data.role === 'judge') {
                    room.judges[data.judgeId] = { red: 0, blue: 0, red2: 0, blue2:0 };
                }
                if(data.role === 'main'){
                    room.mainjudge = createMainJudge();
                }

                console.log('JOIN ROOM',room);
                break;
            case 'update':
                const judge = rooms[ws.roomId].judges[data.judgeId];
                const numberOfMatche = rooms[ws.roomId].mainjudge.numberOfMatche;
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
                console.log('UPDATE',rooms);
                break;
            case 'judgereset':
                const target = rooms[ws.roomId].judges[data.judgeId];
                if(target){
                    target.red = 0;
                    target.blue = 0;
                    target.red2 = 0;
                    target.blue2 = 0;
                }
                break;

            case 'judgeremove':
                delete rooms[ws.roomId].judges[data.judgeId];
                break;
            case 'timer':
                rooms[ws.roomId].mainjudge.timer = data.command;
                broadcastMainJudge('Timer',ws.roomId);
                return;
            case 'Fouls':
                const main = rooms[ws.roomId].mainjudge;
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
                rooms[ws.roomId].mainjudge.showdown = (data.command === 'show');
                broadcastMainJudge('Showdown',ws.roomId);
                return;
            case 'NumberOfMatche':
                rooms[ws.roomId].mainjudge.numberOfMatche = data.number;
                break;
            case 'reset':
                rooms[ws.roomId].judges = {};
                break;
        }

        broadcastScores(ws.roomId);
    });
});

console.log('WebSocket server running on ws://localhost:8181');