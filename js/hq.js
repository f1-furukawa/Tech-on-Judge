function allJudgeScoreReset()
{
    const data= JSON.stringify({type: 'AllJudgeScoreReset',courtId});
    ws.send(data);
}

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
