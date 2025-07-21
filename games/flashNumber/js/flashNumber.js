const flashNumberEl = document.getElementById("flashNumber");
const startButton = document.getElementById("startButton");
const answerButton = document.getElementById("answerButton");
const inputPanel = document.getElementById("inputPanel");
const countdownTimerArea = document.getElementById("countdownTimerArea");

const resultModal = document.getElementById("resultModal");
const resultText = document.getElementById("resultText");
const resultValue = document.getElementById("resultValue");
const nextButton = document.getElementById("nextButton");
const resetButton = document.getElementById("resetButton");
const finalScore = document.getElementById("finalScore");

const levelModal = document.getElementById("levelModal");
const levelButtons = document.getElementById("levelButtons");
const statusInfo = document.getElementById("statusInfo");

let correctNumber = "";
let inputNumber = "";
let isFlashing = false;
let countdownTimer = null;

let currentLevel = 1;
let flashSpeed = 500;
let digitLength = 5;

let currentQuestion = 0;
let correctCount = 0;

// レベル設定マスタ
const levelSettings = {
    1: { digits: 5, speed: 700 },
    2: { digits: 5, speed: 500 },
    3: { digits: 5, speed: 300 },
    4: { digits: 7, speed: 700 },
    5: { digits: 7, speed: 500 },
    6: { digits: 7, speed: 300 },
    7: { digits: 10, speed: 700 },
    8: { digits: 10, speed: 500 },
    9: { digits: 10, speed: 300 },
    10: { digits: 10, speed: 100 }
};

// レベルボタン生成
function createLevelButtons() {
    for (let level = 1; level <= 10; level++) {
        const btn = document.createElement("button");
        btn.textContent = `LEVEL${level}`;
        btn.style.margin = "5px";
        btn.className = "level-button";
        btn.addEventListener("click", () => {
            selectLevel(level);
        });
        levelButtons.appendChild(btn);
    }
}

// レベル選択処理
function selectLevel(level) {
    currentLevel = level;
    digitLength = levelSettings[level].digits;
    flashSpeed = levelSettings[level].speed;

    levelModal.style.display = "none";
    document.getElementById("gameContainer").style.display = "block";

    resetGame();
    createNumberButtons();
    updateInputDisplay();
    updateStatusInfo();
}

// 数字ボタン生成
function createNumberButtons() {
    inputPanel.innerHTML = "";
    for (let i = 0; i <= 9; i++) {
        const btn = document.createElement("button");
        btn.className = "number-button";
        btn.textContent = i;
        btn.addEventListener("click", () => {
            if (!isFlashing && inputNumber.length < correctNumber.length) {
                inputNumber += i.toString();
                updateInputDisplay();
            }
        });
        inputPanel.appendChild(btn);
    }
}

// 表示更新
function updateInputDisplay() {
    flashNumberEl.textContent = inputNumber || "";
}

// フラッシュ表示（1文字ずつ）
function flashNumberSequence(sequence, index = 0, callback) {
    if (index >= sequence.length) {
        flashNumberEl.textContent = "";
        if (callback) callback();
        return;
    }

    flashNumberEl.textContent = sequence[index];
    setTimeout(() => {
        flashNumberEl.textContent = "";
        setTimeout(() => {
            flashNumberSequence(sequence, index + 1, callback);
        }, 100);
    }, flashSpeed);
}

// カウントダウン表示
function startCountdown(seconds = 10) {
    updateCountdownDisplay(seconds);

    countdownTimer = setInterval(() => {
        seconds--;
        updateCountdownDisplay(seconds);

        if (seconds <= 0) {
            clearInterval(countdownTimer);
            handleTimeout();
        }
    }, 1000);
}

// 残り時間表示
function updateCountdownDisplay(seconds) {
    countdownTimerArea.innerHTML = `制限時間：<span style="color: #ffa500; text-shadow: 0 0 10px #ffa500;">${seconds}</span> 秒`;
}

function stopCountdown() {
    clearInterval(countdownTimer);
    countdownTimerArea.innerHTML = "";
}

function updateStatusInfo() {
    statusInfo.textContent = `LEVEL${currentLevel}　${currentQuestion + 1} / 10問`;
}

// タイムアウト処理
function handleTimeout() {
    if (!correctNumber) return;

    resultModal.style.display = "block";
    resultText.textContent = "TIME UP!";
    resultValue.textContent = "正解：" + correctNumber;

    resultText.style.color = "#ff3333";
    resultValue.style.color = "#ff3333";
    resultText.style.textShadow = "0 0 8px #ff3333";
    resultValue.style.textShadow = "0 0 8px #ff3333";

    correctNumber = "";
    inputNumber = "";
    disableInput(true);

    nextButton.style.display = "inline-block";
    resetButton.style.display = "none";
}

// 入力無効化
function disableInput(disabled) {
    document.querySelectorAll(".number-button").forEach(btn => {
        btn.disabled = disabled;
    });
    answerButton.disabled = disabled;
}

// ランダム数生成
function generateFixedLengthNumber(length) {
    let number = "";
    for (let i = 0; i < length; i++) {
        number += Math.floor(Math.random() * 10).toString();
    }
    return number;
}

// STARTボタン押下時
startButton.addEventListener("click", () => {
    startNextQuestion();
});

function startNextQuestion() {
    if (currentQuestion >= 10) return;
    updateStatusInfo();
    inputNumber = "";
    correctNumber = generateFixedLengthNumber(digitLength);
    isFlashing = true;
    disableInput(true);
    startButton.disabled = true;
    updateInputDisplay();

    flashNumberSequence(correctNumber.split(""), 0, () => {
        isFlashing = false;
        disableInput(false);
        startCountdown(10);
    });
}

// ANSWERボタン押下
answerButton.addEventListener("click", () => {
    if (isFlashing || !correctNumber) return;

    stopCountdown();
    const isCorrect = inputNumber === correctNumber;

    resultModal.style.display = "block";
    resultText.textContent = isCorrect ? "正解！" : "不正解";
    resultValue.textContent = isCorrect ? correctNumber : "正解：" + correctNumber;

    if (isCorrect) {
        correctCount++;
        resultText.style.color = "#00ffe7";
        resultValue.style.color = "#00ffe7";
        resultText.style.textShadow = "0 0 8px #00ffe7";
        resultValue.style.textShadow = "0 0 8px #00ffe7";
    } else {
        resultText.style.color = "#ff3333";
        resultValue.style.color = "#ff3333";
        resultText.style.textShadow = "0 0 8px #ff3333";
        resultValue.style.textShadow = "0 0 8px #ff3333";
    }

    correctNumber = "";
    inputNumber = "";
    disableInput(true);

    currentQuestion++;

    if (currentQuestion >= 10) {
        // 最終結果
        finalScore.style.display = "block";
        finalScore.innerHTML = `<strong>${correctCount} / 10問 正解<br>スコア：${correctCount * 10}点</strong>`;
        nextButton.style.display = "none";
        resetButton.style.display = "inline-block";
    } else {
        nextButton.style.display = "inline-block";
        resetButton.style.display = "none";
    }
});

// 次へ
nextButton.addEventListener("click", () => {
    resultModal.style.display = "none";
    startNextQuestion();
});

// リセット（レベル選択に戻る）
resetButton.addEventListener("click", () => {
    location.reload();
});

// ゲーム初期化
function resetGame() {
    correctNumber = "";
    inputNumber = "";
    currentQuestion = 0;
    correctCount = 0;
    finalScore.style.display = "none";
    nextButton.style.display = "inline-block";
    resetButton.style.display = "none";
    startButton.disabled = false;
    updateStatusInfo();
}

// 初期化処理
createLevelButtons();
