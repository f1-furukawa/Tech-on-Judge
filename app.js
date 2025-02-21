const WebSocket = require('ws');
const port = process.env.PORT || 8181;
console.log(port);
const wss = new WebSocket.Server({ port: port });

const rooms = {}; // 部屋ごとのスコア管理

function broadcastScores(roomId) {
    const room = rooms[roomId];
    const results = [];

    for (const [judgeId, data] of Object.entries(room.judges)) {
        const diff = data.red - data.blue;
        results.push({ judgeId, red: data.red, blue: data.blue, diff });
        
    }
    console.log(results);
    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN && client.roomId === roomId) {
            client.send(JSON.stringify({
                type: 'scores',
                Scores: results,
            }));
        }
    });
}

wss.on('connection', ws => {
    ws.on('message', message => {
        const data = JSON.parse(message);
        console.log(data,ws.roomId);
        switch (data.type) {
            case 'joinRoom':
                ws.roomId = data.roomId;
                if (!rooms[data.roomId]) {
                    rooms[data.roomId] = { mode: data.mode, judges: {} ,mainjudge:{}};
                }
                console.log(ws.roomId,data.judgeId);
                const room = rooms[ws.roomId];
                if (data.role === 'judge') {
                    room.judges[data.judgeId] = { red: 0, blue: 0 };
                }
                if(data.role === 'main'){
                    room.mainjudge = { timer: true, showdown:false, redWarnig: 0,blueWarnig: 0,redFouls: 0, blueFouls: 0 };
                }

                console.log('JOIN ROOM',room);
                break;
                

            case 'update':
                const judge = rooms[ws.roomId].judges[data.judgeId];
                if (judge) {
                    
                    judge.red += data.red;
                    judge.blue += data.blue;
                   
                }
                console.log('UPDATE',rooms);
                break;

            case 'reset':
                rooms[ws.roomId].judges = {};
                break;
        }

        broadcastScores(ws.roomId);
    });
});

console.log('WebSocket server running on ws://localhost:8181');