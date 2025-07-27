let cardContainer, resultModal, resultMessage, resultStreak, modalNextBtn, statusMessage, streakCounter, modalLevelSelectBtn, probabilityLabel;
let selectedProbability = 2;

window.onload = () => {
    cardContainer = document.getElementById("cardContainer");
    resultModal = document.getElementById("resultModal");
    resultMessage = document.getElementById("resultMessage");
    resultStreak = document.getElementById("resultStreak");
    modalNextBtn = document.getElementById("modalNextBtn");
    statusMessage = document.getElementById("statusMessage");
    streakCounter = document.getElementById("streakCounter");
    modalLevelSelectBtn = document.getElementById("modalLevelSelectBtn");
    probabilityLabel = document.getElementById("probabilityLabel");

    modalLevelSelectBtn.onclick = () => {
        resultModal.style.display = "none";
        currentStreak = 0;
        updateStreakDisplay();
        document.getElementById("probabilityModal").style.display = "flex";
    };

    modalNextBtn.onclick = () => {
        resultModal.style.display = "none";

        // カードの枠とアニメーション状態を初期化
        const allCards = document.querySelectorAll(".card");
        allCards.forEach(c => {
            c.classList.remove("correct", "wrong", "zoom-flip", "flipped");
        });

        gatherCardsToCenter(() => {
            createCards();
            animateShuffleAndStart();
        });
    };

    document.getElementById("probabilityModal").style.display = "flex";
};

let correctCardIndex = 0;
let currentStreak = 0;

// カード生成
function createCards() {
    cardContainer.innerHTML = "";

    const correctMark = "〇";
    const wrongMark = "✕";
    const marks = [correctMark]; // 正解1つ

    for (let i = 1; i < selectedProbability; i++) {
        marks.push(wrongMark);
    }

    const shuffled = marks.sort(() => Math.random() - 0.5);
    correctCardIndex = shuffled.indexOf(correctMark);

    shuffled.forEach((mark, index) => {
        const card = document.createElement("div");
        card.classList.add("card");

        const cardInner = document.createElement("div");
        cardInner.classList.add("card-inner");

        const front = document.createElement("div");
        front.classList.add("card-front");
        front.textContent = mark;
        front.style.color = mark === correctMark ? "#00ffe7" : "#ff4444";

        const back = document.createElement("div");
        back.classList.add("card-back");
        back.textContent = "Card";

        cardInner.appendChild(front);
        cardInner.appendChild(back);
        card.appendChild(cardInner);
        card.dataset.mark = mark;
        card.style.transition = "transform 0.6s ease";

        card.onclick = () => handleCardClick(card);

        const centerX = cardContainer.clientWidth / 2 - 30;
        const centerY = cardContainer.clientHeight / 2 - 40;
        card.style.transform = `translate(${centerX}px, ${centerY}px) rotate(0deg)`;

        cardContainer.appendChild(card);
    });

    // 並び方調整
    const cards = document.querySelectorAll(".card");
    const spacing = 20;
    const cardWidth = 60;
    const totalWidth = cards.length * cardWidth + spacing * (cards.length - 1);
    const startX = (cardContainer.clientWidth - totalWidth) / 2;

    const isMobile = window.innerWidth <= 600;

    if (isMobile && selectedProbability === 5) {
        // スマホ & 1/5 → 2段（3枚＋2枚）
        cards.forEach((card, i) => {
            const row = i < 3 ? 0 : 1;
            const indexInRow = i % 3;
            const rowCount = row === 0 ? 3 : 2;
            const rowStartX = (cardContainer.clientWidth - (rowCount * cardWidth + spacing * (rowCount - 1))) / 2;
            const x = rowStartX + (indexInRow * (cardWidth + spacing));
            const y = row === 0 ? 80 : 180;
            card.style.transform = `translate(${x}px, ${y}px)`;
        });
    } else {
        // PC or 他の確率 → 横一列
        cards.forEach((card, i) => {
            const x = startX + i * (cardWidth + spacing);
            card.style.transform = `translate(${x}px, 100px)`;
        });
    }

    statusMessage.style.display = "none"; // 初期は非表示
    updateProbabilityLabel(); // 確率表示更新
}

function handleCardClick(card) {
    if (card.classList.contains("flipped")) return;

    const allCards = document.querySelectorAll(".card");

    allCards.forEach(c => {
        c.classList.add("flipped");
        c.classList.add("zoom-flip");

        setTimeout(() => {
            if (c.dataset.mark === "〇") {
                c.classList.add("correct");
            } else {
                c.classList.add("wrong");
            }
        }, 500);
    });

    statusMessage.style.display = "none";
    statusMessage.classList.remove("blinking");

    setTimeout(() => {
        if (card.dataset.mark === "〇") {
            currentStreak++;
            updateStreakDisplay();
            showResult(true);
        } else {
            showResult(false);
            currentStreak = 0;
            updateStreakDisplay();
        }
    }, 1000);
}

function updateStreakDisplay() {
    if (streakCounter) {
        streakCounter.textContent = `連続成功回数：${currentStreak}回`;
    }
}

function showResult(success) {
    resultModal.style.display = "flex";
    resultMessage.textContent = success ? "SUCCESS!" : "FAILED!";
    resultMessage.style.color = success ? "#00ffe7" : "#ff4444";
    resultMessage.style.textShadow = success ? "0 0 6px #00ffe7" : "0 0 6px #ff4444";

    resultStreak.textContent = success ? `連続正解回数：${currentStreak}回` : `記録：${currentStreak}回`;

    modalLevelSelectBtn.style.display = success ? "none" : "inline-block";
    modalNextBtn.style.display = success ? "inline-block" : "none";

    statusMessage.style.display = "none";
}

function animateShuffleAndStart() {
    const cards = document.querySelectorAll(".card");
    const centerX = cardContainer.clientWidth / 2 - 30;
    const centerY = cardContainer.clientHeight / 2 - 42;

    const isMobile = window.innerWidth <= 600;

    // ① すべてのカードを中央に集める
    cards.forEach(card => {
        card.style.transition = "transform 0.4s ease";
        card.style.transform = `translate(${centerX}px, ${centerY}px) rotate(0deg)`;
        card.classList.remove("flipped");
    });

    // ② シャッフル演出（360度回転）
    setTimeout(() => {
        cards.forEach(card => {
            card.style.transition = "transform 0.4s ease";
            card.style.transform += " rotate(360deg)";
        });
    }, 400);

    // ③ 再配置
    setTimeout(() => {
        const spacing = 20;
        const cardWidth = 60;
        const totalWidth = cards.length * cardWidth + spacing * (cards.length - 1);
        const startX = (cardContainer.clientWidth - totalWidth) / 2;

        if (isMobile && selectedProbability === 5) {
            // 2段配置（中央基準から±で整える）
            const verticalOffset = 45; // 上下段の距離の半分（中央基準）

            cards.forEach((card, i) => {
                const row = i < 3 ? 0 : 1;
                const indexInRow = i % 3;
                const rowCount = row === 0 ? 3 : 2;
                const rowStartX = (cardContainer.clientWidth - (rowCount * cardWidth + spacing * (rowCount - 1))) / 2;
                const x = rowStartX + (indexInRow * (cardWidth + spacing));
                const y = centerY + (row === 0 ? -verticalOffset : verticalOffset);
                card.style.transition = "transform 0.6s ease-in-out";
                card.style.transform = `translate(${x}px, ${y}px)`;
            });
        } else {
            // 横一列
            cards.forEach((card, i) => {
                const x = startX + i * (cardWidth + spacing);
                const y = centerY;
                card.style.transition = "transform 0.6s ease-in-out";
                card.style.transform = `translate(${x}px, ${y}px)`;
            });
        }

        // ④ 「選択してください」表示（点滅）
        setTimeout(() => {
            statusMessage.style.display = "block";
            statusMessage.classList.add("blinking");
        }, 1000);
    }, 1000);
}

function selectProbability(n) {
    selectedProbability = n;
    document.getElementById("probabilityModal").style.display = "none";
    updateProbabilityLabel();
    createCards();
    animateShuffleAndStart();
}

function updateProbabilityLabel() {
    if (probabilityLabel) {
        probabilityLabel.textContent = `確率：1/${selectedProbability}`;
    }
}

function gatherCardsToCenter(callback) {
    const cards = document.querySelectorAll(".card");
    const centerX = cardContainer.clientWidth / 2 - 30;
    const centerY = cardContainer.clientHeight / 2 - 42;

    cards.forEach(card => {
        card.style.transition = "transform 0.4s ease";
        card.style.transform = `translate(${centerX}px, ${centerY}px) rotate(0deg)`;
        card.classList.remove("flipped");
    });

    // 0.5秒後にコールバック（create + shuffle）
    setTimeout(() => {
        callback && callback();
    }, 500);
}
