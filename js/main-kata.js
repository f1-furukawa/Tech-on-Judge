const ws = new WebSocket(wsurl);
const urlParams = new URLSearchParams(window.location.search);
const roomId = urlParams.get('roomId');
console.log(roomId); // "kata-roomA" など

const judgeId = `main`;

document.getElementById('judgeId').textContent = judgeId;

ws.onopen = () => {
    ws.send(JSON.stringify({ type: 'joinRoom', roomId, judgeId, role:'main' }));
};

function showdown(command)
{
    const data = JSON.stringify({type: 'Showdown',command})
    console.log('showdown',data);
    ws.send(data);
}

function numberofmatch(number)
{
    const data = JSON.stringify({type: 'NumberOfMatche',number})
    console.log('NumberOfMatche',data);
    ws.send(data);
}

ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    console.log('onmessage',data);

    if (data.type === 'scores') {
        const scores = data.Scores;
        scores.forEach(score => {
            const judgeScores = document.getElementById('judgeScores');
                judgeScores.innerHTML = ''; // テーブルをクリア

                const scores =data.Scores;

                scores.forEach(score => {
                    const { judgeId, red, blue, diff } = score;

                    // ジャッジごとのスコアをテーブルに追加
                    const row = `<tr>
                        <td>${judgeId}</td>
                        <td>${red}</td>
                        <td>${blue}</td>
                        <td>
                            <input type="hidden" class="targetjudgeid" value='${judgeId}'>
                            <button class="scorereset" >スコアリセット</button>
                            <button class="remove" >ジャッジ退出</button>
                        </td>
                    </tr>`;
                    judgeScores.innerHTML += row;
                });
        });
    }
};

document.addEventListener("click", (event) => {
    if (event.target.matches(".scorereset, .remove")) {
        const td = event.target.closest("td");
        const input = td.querySelector(".targetjudgeid");
        const judgeId = input ? input.value : null;
        const eventName = event.target.classList.contains("scorereset") ? "judgereset" : "judgeremove";

        console.log(`${eventName} judgeId: ${judgeId}`);
        const data = JSON.stringify({ type: eventName, judgeId });
        console.log(data);
        ws.send(data);
    }
});

