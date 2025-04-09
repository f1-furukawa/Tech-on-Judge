//コートのIDを貰い、指定したジャッジの数だけジャッジを製紙餌する。
function createLink(text,href,className = "")
{
    const link = document.createElement('a');
    link.href = href;
    link.textContent = text;
    link.target = '_blank'; // 新しいタブで開く
    link.className = className;
    return link;
}

function createCourtRow(eventName,courtIndex, judgeCount)
{
    const courtLetter = String.fromCharCode(65 + courtIndex); // コートのアルファベットを生成
    const courtId = `${eventName}-${courtLetter}`;
    const tr = document.createElement('tr');

    // コート名
    const tdCourt = document.createElement("td");
    tdCourt.textContent = `コート${courtLetter}`;
    tr.appendChild(tdCourt);

    //スコアボード
    const tdScore = document.createElement('td');
    tdScore.appendChild(createLink(
        'スコアボード',
        `${eventName}-board.html?courtId=${courtId}`,
        'btn'
    ));
    tr.appendChild(tdScore);

    const tdMain = document.createElement('td');
    tdMain.appendChild(createLink(
        '本部',
        `${eventName}-hq.html?courtId=${courtId}`,
        'btn'
    ));
    tr.appendChild(tdMain);


    const tdJudge = document.createElement('td');
    for(let i = 0; i < judgeCount; i++) 
    {
        const judgeLetter = String.fromCharCode(65 + i);
        const judgeId = `${judgeLetter}`;
        const judgeLink = createLink(
            `${judgeId}`,
            `judge.html?courtId=${courtId}&jid=${judgeLetter}`,
            'btn judge-btn');
        tdJudge.appendChild(judgeLink);
    }
    tr.appendChild(tdJudge);

    return tr;
}