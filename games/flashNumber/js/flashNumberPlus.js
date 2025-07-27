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
const clearButton = document.getElementById("clearButton");

let currentLevel = 1;
let digitLength = 1;
let flashSpeed = 500;

let inputNumber = "";
let isFlashing = false;
let countdownTimer = null;

let currentQuestion = 0;
let correctCount = 0;
let correctAnswer = 0;

let flashSequence = [];

// レベル設定（各数字の桁数）
const levelSettings = {
    1: { digits: 1, speed: 500 },
    2: { digits: 2, speed: 500 },
    3: { digits: 3, speed: 500 },
    4: { digits: 4, speed: 500 },
    5: { digits: 5, speed: 500 }
};

// レベル選択ボタン生成
function createLevelButtons() {
    for (let level = 1; level <= 5; level++) {
        const btn = document.createElement("button");
        btn.textContent = `LEVEL${level}`;
        btn.className = "level-button";
        btn.style.margin = "5px";
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

// 数字ボタン生成（電卓風）
function createNumberButtons() {
    inputPanel.innerHTML = "";

    const layout = [
        ["1", "2", "3","4", "5"],
        ["6", "7", "8","9", "0"],
    ];

    layout.forEach(row => {
        const rowDiv = document.createElement("div");
        rowDiv.style.display = "flex";
        rowDiv.style.justifyContent = "center";
        rowDiv.style.gap = "10px";
        rowDiv.style.marginBottom = "10px";

        row.forEach(num => {
            const btn = document.createElement("button");
            if (num === "") {
                btn.style.visibility = "hidden";
                btn.style.width = "60px";
                btn.style.height = "60px";
            } else {
                btn.className = "number-button";
                btn.textContent = num;
                btn.addEventListener("click", () => {
                    if (!isFlashing) {
                        inputNumber += num;
                        updateInputDisplay();
                    }
                });
            }
            rowDiv.appendChild(btn);
        });

        inputPanel.appendChild(rowDiv);
    });
}

function updateInputDisplay() {
    flashNumberEl.textContent = inputNumber || "";
}

function updateStatusInfo() {
    statusInfo.textContent = `レベル${currentLevel}　${currentQuestion + 1} / 10問`;
}

// 指定桁数のランダム数値を生成
function generateRandomNumber(digits) {
    let min = Math.pow(10, digits - 1);
    let max = Math.pow(10, digits) - 1;
    if (digits === 1) min = 0; // 1桁だけは0許容
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// フラッシュ表示処理（5回）
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

function updateCountdownDisplay(seconds) {
    countdownTimerArea.innerHTML = `制限時間：<span style="color: #ffa500; text-shadow: 0 0 10px #ffa500;">${seconds}</span> 秒`;
}

function stopCountdown() {
    clearInterval(countdownTimer);
    countdownTimerArea.innerHTML = "";
}

function handleTimeout() {
    resultModal.style.display = "block";
    resultText.textContent = "TIME UP!";
    resultValue.textContent = "答え：" + correctAnswer;

    resultText.style.color = "#ff3333";
    resultValue.style.color = "#ff3333";
    resultText.style.textShadow = "0 0 8px #ff3333";
    resultValue.style.textShadow = "0 0 8px #ff3333";

    disableInput(true);
    nextButton.style.display = "inline-block";
    resetButton.style.display = "none";
}

function disableInput(disabled) {
    document.querySelectorAll(".number-button").forEach(btn => {
        btn.disabled = disabled;
    });
    clearButton.disabled = disabled;
    answerButton.disabled = disabled;
}

startButton.addEventListener("click", () => {
    startNextQuestion();
});

clearButton.addEventListener("click", () => {
    if (!isFlashing) {
        inputNumber = "";
        updateInputDisplay();
    }
});

function startNextQuestion() {
    if (currentQuestion >= 10) return;

    inputNumber = "";
    correctAnswer = 0;
    flashSequence = [];

    for (let i = 0; i < 5; i++) {
        const num = generateRandomNumber(digitLength);
        flashSequence.push(num);
        correctAnswer += num;
    }

    isFlashing = true;
    disableInput(true);
    startButton.disabled = true;
    updateInputDisplay();
    updateStatusInfo();

    flashNumberSequence(flashSequence.map(n => n.toString()), 0, () => {
        isFlashing = false;
        disableInput(false);
        startCountdown(10);
    });
}

answerButton.addEventListener("click", () => {
    if (isFlashing) return;

    stopCountdown();

    const isCorrect = parseInt(inputNumber, 10) === correctAnswer;

    resultModal.style.display = "block";
    resultText.textContent = isCorrect ? "正解！" : "不正解";
    resultValue.textContent = isCorrect ? `合計：${correctAnswer}` : `正解：${correctAnswer}`;

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

    disableInput(true);
    currentQuestion++;

    if (currentQuestion >= 10) {
        finalScore.style.display = "block";
        finalScore.innerHTML = `<strong>${correctCount} / 10問 正解<br>スコア：${correctCount * 10}点</strong>`;
        nextButton.style.display = "none";
        resetButton.style.display = "inline-block";
    } else {
        nextButton.style.display = "inline-block";
        resetButton.style.display = "none";
    }
});

nextButton.addEventListener("click", () => {
    resultModal.style.display = "none";
    startNextQuestion();
});

resetButton.addEventListener("click", () => {
    location.reload();
});

function resetGame() {
    inputNumber = "";
    currentQuestion = 0;
    correctCount = 0;
    finalScore.style.display = "none";
    nextButton.style.display = "inline-block";
    resetButton.style.display = "none";
    startButton.disabled = false;
    updateStatusInfo();
}

// 初期化
createLevelButtons();
