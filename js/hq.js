function showdown(command)
{
    const data = JSON.stringify({type: 'Showdown',command})
    ws.send(data);
}

function allJudgeScoreReset()
{
    const data= JSON.stringify({type: 'AllJudgeScoreReset',courtId});
    ws.send(data);
}

function judgeCount(maxJudgeCount)
{
    const data= JSON.stringify({type: 'judgeCount',maxJudgeCount});
    ws.send(data);
}

function judgeCountMarks(maxJudgeCount)
{
    document.querySelectorAll('.jcbtn').forEach((btn) => { 
        btn.classList.remove('active');
    });

    document.querySelectorAll(`.jc${maxJudgeCount}`).forEach((btn) => {
        btn.classList.add('active');
    });
}

function showdownMarks(showdown)
{
    if(!showdown) showdown = 'show';
    document.querySelectorAll('.showdownbtn').forEach((btn) => { 
        btn.classList.remove('active');
    });
    document.querySelectorAll(`.${showdown}`).forEach((btn) => {
        btn.classList.add('active');
    });
}


document.addEventListener("click", (event) => {
    if (event.target.matches(".scorereset, .remove")) {
        const td = event.target.closest("td");
        const input = td.querySelector(".targetjudgeid");
        const judgeId = input ? input.value : null;
        const eventName = event.target.classList.contains("scorereset") ? "judgereset" : "judgeremove";
        const data = JSON.stringify({ type: eventName, judgeId });
        ws.send(data);
    }
});
