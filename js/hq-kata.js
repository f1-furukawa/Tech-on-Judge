const ws = new WebSocket(wsurl);
const urlParams = new URLSearchParams(window.location.search);
const courtId = urlParams.get('courtId');
const judgeId = `main`;

const kataNameList = [
    {ja:'チョンジ（天地）',en:'CHON-JI'},
    {ja:'タングン（檀君）',en:'DAN-GUN'},
    {ja:'トサン（島山）',en:'DO-SAN'},
    {ja:'ウォニョ（元曉）',en:'WON-HYO'},
    {ja:'ユルゴク（栗谷）',en:'YUL-GOK'},
    {ja:'チュングン（重根）',en:'JOONG-GUN'},
    {ja:'テェゲ（退渓）',en:'TOI-GYE'},
    {ja:'ファラン（花郎）',en:'HWA-RANG'},
    {ja:'チュンム（忠武）',en:'CHOONG-MOO'},
    {ja:'クワンゲ（廣開）',en:'KWANG-GAE'},
    {ja:'ポウン（圃隠）',en:'PO-EUN'},
    {ja:'ケベク（階伯）',en:'GE-BAEK'},
    {ja:'ウィアム（義菴）',en:'EUI-AM'},
    {ja:'チュンジャン（忠壮）',en:'CHOONG-JANG'},
    {ja:'チュチェ（主体）',en:'JUCHE'},
    {ja:'サミル（三一）',en:'SAM-IL'},
    {ja:'ユシン（庚信）',en:'YOO-SIN'},
    {ja:'チェヨン（崔瑩）',en:'CHOI-YONG'},
    {ja:'ヨンゲ（淵蓋）',en:'YON-GAE'},
    {ja:'ウルチ（乙支）',en:'UL-JI'},
    {ja:'ムンム（文武）',en:'MOON-MOO'},
    {ja:'ソサン（西山）',en:'SO-SAN'},
    {ja:'セジョン（世宗）',en:'SE-JONG'},
    {ja:'トンイル（統一）',en:'TONG-IL'},
];

const katabtn = document.getElementById('katabtn');
kataNameList.forEach(kataName => {

    const btn = `<button class="katabtn">${kataName.ja}</button>`
    katabtn.innerHTML += btn;

})

document.title = `${courtId} | 本部`;
document.getElementById('courtId').textContent = courtId;

ws.onopen = () => {
    ws.send(JSON.stringify({ type: 'joincourt', courtId, judgeId, role:'main',mode:'kata' }));

};

ws.onmessage = (event) => {
    const data = JSON.parse(event.data);

    if (data.type === 'scores') {
        const scores = data.Scores;
        const judgeScores = document.getElementById('judgeScores');
        judgeScores.innerHTML = ''; // テーブルをクリア

        scores.forEach(score => {
            const judgeScores = document.getElementById('judgeScores');
            const { judgeId, red, blue,red2,blue2, diff } = score;

            // ジャッジごとのスコアをテーブルに追加
            const row = `<tr>
                <td>${judgeId}</td>
                <td>${getKataScore(red)}</br>${getKataScore(red2)}</td>
                <td>${getKataScore(blue)}</br>${getKataScore(blue2)}</td>
                <td>
                    <input type="hidden" class="targetjudgeid" value='${judgeId}'>
                    <button class="scorereset" >スコアリセット</button>
                    <button class="remove" >ジャッジ退出</button>
                </td>
            </tr>`;
            judgeScores.innerHTML += row;
        });

        const ctrl = data.Controls;
        judgeCountMarks(ctrl.maxJudgeCount);
        numberofmatchMarks(ctrl.numberOfMatche);

    }
};

function numberofmatch(number)
{
    const data = JSON.stringify({type: 'NumberOfMatche',number})
    ws.send(data);
}

function getKataScore(point)
{
    return ((100 - (point * 2)) / 10).toFixed(1);
}

function numberofmatchMarks(number)
{
    document.querySelectorAll('.nmbtn').forEach((btn) => { 
        btn.classList.remove('active');
    });

    document.querySelectorAll(`.nm${number}`).forEach((btn) => {
        btn.classList.add('active');
    });
}



document.querySelectorAll('.katabtn').forEach(button => {
    // 各ボタンにクリックイベントを追加
    button.addEventListener('click', function () {
        // 表示文字（テキスト）を取得
        let text = this.textContent;
        if(text === 'クリア') text = '';

        kataNameList.forEach(kataName =>{
            if(kataName.ja === text) text = kataName.en;
        });
    
        console.log('kataname',text);
        const data = JSON.stringify({type: 'kataName',kataName: text})
        ws.send(data);
    });
  });