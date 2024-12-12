const WebSocket = require('ws');
const port = process.env.PORT || 8181;
console.log(port);
const wss = new WebSocket.Server({ port: port });

const rooms = {}; // 部屋ごとのスコア管理

function broadcastScores(roomId) {
    const room = rooms[roomId];
    const results = { kumite: [], kata: [] };

    for (const [judgeId, data] of Object.entries(room.judges)) {
        const diff = data.red - data.blue;
        if (room.mode === 'kumite') {
            results.kumite.push({ judgeId, red: data.red, blue: data.blue, diff });
        } else if (room.mode === 'kata') {
            results.kata.push({ judgeId, red: data.red, blue: data.blue,diff });
        }
    }
    console.log(results);
    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN && client.roomId === roomId) {
            client.send(JSON.stringify({
                type: 'scores',
                kumiteScores: results.kumite,
                kataScores: results.kata,
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
                    rooms[data.roomId] = { mode: data.mode, judges: {} };
                }
                console.log(ws.roomId,data.judgeId);
                const room = rooms[ws.roomId];
                if (data.role === 'judge') {
                    room.judges[data.judgeId] = { red: data.mode === 'kata' ? 100 : 0, blue: data.mode === 'kata' ? 100 : 0 };
                }
                console.log('JOIN ROOM',room);
                break;

            case 'update':
                const judge = rooms[ws.roomId].judges[data.judgeId];
                if (judge) {
                    if (rooms[ws.roomId].mode === 'kumite') {
                        judge.red += data.red;
                        judge.blue += data.blue;
                    } else if (rooms[ws.roomId].mode === 'kata') {
                        judge.red -= data.red * 2; // 減点
                        judge.blue -= data.blue * 2; // 減点
                    }
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