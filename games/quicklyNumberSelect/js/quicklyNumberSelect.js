const cardContainer = document.getElementById("cardContainer");
const shuffleBtn = document.getElementById("shuffleBtn");
const timerDisplay = document.getElementById("timer");
const modalShuffleBtn = document.getElementById("modalShuffleBtn");
const resultModal = document.getElementById("resultModal");
const finalTime = document.getElementById("finalTime");

let numbers = [...Array(10).keys()].map(n => n + 1); // [1〜10]
let currentTarget = 1;
let isStarted = false;
let startTime, timerInterval;

// カード生成
function createCards() {
    cardContainer.innerHTML = "";
    const shuffled = [...numbers].sort(() => Math.random() - 0.5);
    const positions = [];

    shuffled.forEach(num => {
        const card = document.createElement("div");
        card.classList.add("card");

        const cardInner = document.createElement("div");
        cardInner.classList.add("card-inner");

        const front = document.createElement("div");
        front.classList.add("card-front");
        front.textContent = num;

        // 6や9に下線を追加
        if (num === 6 || num === 9) {
            front.style.textDecoration = "underline";
        }

        const back = document.createElement("div");
        back.classList.add("card-back");
        back.textContent = "Card";

        cardInner.appendChild(front);
        cardInner.appendChild(back);
        card.appendChild(cardInner);

        card.dataset.number = num;
        card.addEventListener("click", handleCardClick);

        // ランダム位置（非重なり） + ランダム角度
        let maxAttempts = 100;
        let x, y;
        do {
            x = Math.random() * (cardContainer.clientWidth - 60);
            y = Math.random() * (cardContainer.clientHeight - 85);
            maxAttempts--;
        } while (
            positions.some(p => Math.abs(p.x - x) < 60 && Math.abs(p.y - y) < 85) &&
            maxAttempts > 0
        );

        const angle = Math.floor(Math.random() * 360); // ランダム角度
        card.style.transform = `translate(${x}px, ${y}px) rotate(${angle}deg)`;
        positions.push({ x, y });

        cardContainer.appendChild(card);
    });
}

// カードクリック処理
function handleCardClick(e) {
    if (!isStarted) return;

    const card = e.currentTarget;
    const number = parseInt(card.dataset.number);

    if (card.classList.contains("correct")) return;

    if (!card.classList.contains("flipped")) {
        card.classList.add("flipped");
    }

    if (number === currentTarget) {
        // 正解時、前の赤枠をすべて消す
        document.querySelectorAll(".card.wrong").forEach(c => c.classList.remove("wrong"));

        card.classList.remove("wrong");
        card.classList.add("correct");
        currentTarget++;

        if (currentTarget > 10) {
            stopGame();
        }
    } else {
        // 間違い時、すでに付いている wrong をすべて外す
        document.querySelectorAll(".card.wrong").forEach(c => c.classList.remove("wrong"));

        card.classList.add("wrong", "shake");
        setTimeout(() => card.classList.remove("shake"), 300);
    }
}

// 終了処理
function stopGame() {
    isStarted = false;
    clearInterval(timerInterval);

    const now = performance.now();
    const elapsed = (now - startTime) / 1000; // 秒単位
    finalTime.textContent = `Your Time: ${elapsed.toFixed(2)}s`;

    resultModal.style.display = "flex";
}

// タイマー更新
function updateTimer() {
    const now = performance.now();
    const elapsed = (now - startTime) / 1000;
    timerDisplay.textContent = `TIME: ${elapsed.toFixed(2)}s`;
}

// シャッフル＆再スタート
shuffleBtn.onclick = () => {
    resultModal.style.display = "none";
    animateShuffleAndStart();
};

modalShuffleBtn.onclick = () => {
    resultModal.style.display = "none";
    animateShuffleAndStart();
};

// 初期表示
window.onload = () => {
    createCards();
};

// シャッフルアニメーション＋ゲーム開始
function animateShuffleAndStart() {
    const cards = document.querySelectorAll(".card");
    const centerX = cardContainer.clientWidth / 2 - 30;
    const centerY = cardContainer.clientHeight / 2 - 40;

    currentTarget = 1;
    isStarted = false;
    clearInterval(timerInterval);
    timerDisplay.textContent = "TIME: 0.00s";

    // ①中央に集める
    cards.forEach(card => {
        card.style.transition = "transform 0.4s ease";
        card.style.transform = `translate(${centerX}px, ${centerY}px) rotate(0deg)`;
        card.classList.remove("correct", "wrong", "flipped");
    });

    // ②回転
    setTimeout(() => {
        cards.forEach(card => {
            card.style.transition = "transform 0.4s ease";
            card.style.transform += " rotate(360deg)";
        });
    }, 400);

    // ③ランダムに散らす
    setTimeout(() => {
        const usedPositions = [];

        cards.forEach(card => {
            let maxAttempts = 100;
            let x, y;
            do {
                x = Math.random() * (cardContainer.clientWidth - 60);
                y = Math.random() * (cardContainer.clientHeight - 85);
                maxAttempts--;
            } while (
                usedPositions.some(p => Math.abs(p.x - x) < 60 && Math.abs(p.y - y) < 85)
            );

            const angle = Math.floor(Math.random() * 360);
            card.style.transition = "transform 0.6s ease-in-out";
            card.style.transform = `translate(${x}px, ${y}px) rotate(${angle}deg)`;

            usedPositions.push({ x, y });
        });

        // ④カードめくりと同時にタイマー開始
        setTimeout(() => {
            startTime = performance.now();
            isStarted = true;
            timerInterval = setInterval(updateTimer, 10);

            cards.forEach(card => {
                card.classList.add("flipped");
            });
        }, 500);
    }, 1000);
}
