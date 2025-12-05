const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const titleScreen = document.getElementById("titleScreen");
const startButton = document.getElementById("startButton");
const retryButton = document.getElementById("retryButton");
const scoreDisplay = document.getElementById("scoreDisplay");
const gameOverDisplay = document.getElementById("gameOverDisplay");
const finalScoreText = document.getElementById("finalScoreText");
const finalLevelText = document.getElementById("finalLevelText");

let paddle, balls, blocks = [], items = [];
let score = 0, gameRunning = false;
let mouseDown = false;
let touchX = null;
let mouseXCache = 0;

let lastTimestamp = 0;
let spawnTimer = 0;
const spawnInterval = 3000;

let level = 1;
let levelUpScore = 50;
let levelUpText = document.getElementById("levelUpText");
let levelNumber = document.getElementById("levelNumber");

/* === 背景画像の読み込み（PC / スマホで出し分け） === */
const bgImage = new Image();
let bgLoaded = false;

// スマホ判定（幅600以下ならスマホ扱い）
const isMobile = window.innerWidth <= 600;

// ★ PC とスマホで画像を切り替え
bgImage.src = isMobile
    ? "./images/fugetsu/thum_800x600.jpeg"
    : "./images/fugetsu/thum.jpeg";

bgImage.onload = () => { bgLoaded = true; };

function drawBackground() {
    if (!bgLoaded) return;

    const cw = canvas.width;   // キャンバスの横幅
    const ch = canvas.height;  // キャンバスの縦幅
    const iw = bgImage.naturalWidth || bgImage.width;   // 686
    const ih = bgImage.naturalHeight || bgImage.height; // 843

    // ★ 画像はリサイズしない（等倍）
    const dw = iw;
    const dh = ih;

    // ★ 横は中央寄せ（左右の余白を均等に）
    const dx = (cw - dw) / 2;

    // ★ 縦は中央基準（多少はみ出てもOK）
    const dy = (ch - dh) / 2;

    ctx.save();
    ctx.globalAlpha = 0.15; // 透過度
    ctx.drawImage(bgImage, dx, dy, dw, dh);
    ctx.restore();
}

/* === 背景画像ここまで === */

/* === レベルアップ演出用画像（風船） === */
const balloonImages = [];
let balloonLoadedCount = 0;

function markBalloonLoaded() { balloonLoadedCount++; }
function balloonsReady() { return balloonLoadedCount >= 2; }

// 画像1
const balloonImgA = new Image();
balloonImgA.src = "./images/fugetsu/pt1.png";
balloonImgA.onload = markBalloonLoaded;
balloonImages.push(balloonImgA);

// 画像2
const balloonImgB = new Image();
balloonImgB.src = "./images/fugetsu/pt2.png";
balloonImgB.onload = markBalloonLoaded;
balloonImages.push(balloonImgB);

// 画像3
const balloonImgC = new Image();
balloonImgC.src = "./images/fugetsu/pt3.png";
balloonImgC.onload = markBalloonLoaded;
balloonImages.push(balloonImgC);

// 画像4
const balloonImgD = new Image();
balloonImgD.src = "./images/fugetsu/pt4.png";
balloonImgD.onload = markBalloonLoaded;
balloonImages.push(balloonImgD);

// 風船エフェクト管理配列
let balloons = [];

class Paddle {
    constructor() {
        this.width = 100;
        this.height = 10;
        this.x = (canvas.width - this.width) / 2;
        this.y = canvas.height - 40;
    }
    move(mouseX) {
        const rect = canvas.getBoundingClientRect();
        const canvasScale = canvas.width / rect.width;
        const adjustedX = (mouseX - rect.left) * canvasScale;
        this.x = adjustedX - this.width / 2;
        this.x = Math.max(0, Math.min(this.x, canvas.width - this.width));
    }
    draw(ctx) {
        const gradient = ctx.createLinearGradient(this.x, this.y, this.x, this.y + this.height);
        gradient.addColorStop(0, "#00ffe7");
        gradient.addColorStop(1, "#0055aa");
        ctx.fillStyle = gradient;
        ctx.shadowColor = "#00ffe7";
        ctx.shadowBlur = 10;
        ctx.fillRect(this.x, this.y, this.width, this.height);
        ctx.shadowBlur = 0;
    }
    getBounds() {
        return { x: this.x, y: this.y, width: this.width, height: this.height };
    }
}

class Ball {
    constructor(x, y) {
        this.diameter = 20;
        this.x = x || canvas.width / 2 - 10;
        this.y = y || canvas.height / 2;
        this.dx = 3;
        this.dy = 3;
    }
    move() {
        this.x += this.dx;
        this.y += this.dy;
        if (this.x < 0 || this.x > canvas.width - this.diameter) this.dx = -this.dx;
        if (this.y < 0) this.dy = -this.dy;
    }
    draw(ctx) {
        const gradient = ctx.createRadialGradient(
            this.x + this.diameter / 2,
            this.y + this.diameter / 2,
            2,
            this.x + this.diameter / 2,
            this.y + this.diameter / 2,
            this.diameter / 2
        );
        gradient.addColorStop(0, "#fff");
        gradient.addColorStop(0.2, "#ffff99");
        gradient.addColorStop(0.5, "#ffcc00");
        gradient.addColorStop(1, "#ff9900");
        ctx.fillStyle = gradient;
        ctx.shadowColor = "#ffcc00";
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(this.x + this.diameter / 2, this.y + this.diameter / 2, this.diameter / 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
    }
    getBounds() {
        return { x: this.x, y: this.y, width: this.diameter, height: this.diameter };
    }
}

class Block {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.width = 60;
        this.height = 20;
        this.dy = 0.1;
        this.color = color || ["#00ffe7", "#ffa500", "#ff4444", "#66ff66", "#ff00cc"][Math.floor(Math.random() * 5)];
    }
    move() {
        this.y += this.dy;
    }
    draw(ctx) {
        ctx.fillStyle = this.color;
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 10;
        ctx.fillRect(this.x, this.y, this.width, this.height);
        ctx.shadowBlur = 0;
    }
    getBounds() {
        return { x: this.x, y: this.y, width: this.width, height: this.height };
    }
}

/* === ここを星型描画に“復元” === */
class Item {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 20;   // 元サイズへ
        this.height = 20;  // 元サイズへ
        this.dy = 2;
        this.rotation = 0;
    }
    move() {
        this.y += this.dy;
        this.rotation += 0.1; // 元の回転速度
    }
    draw(ctx) {
        ctx.save();
        ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
        ctx.rotate(this.rotation);

        // 星型（5角形のスパイク）
        ctx.beginPath();
        const spikes = 5;
        const outerRadius = this.width / 2;
        const innerRadius = outerRadius / 2.5;

        // 初期点を明示（moveTo）
        let angle0 = -Math.PI / 2; // 上を起点に
        ctx.moveTo(outerRadius * Math.cos(angle0), outerRadius * Math.sin(angle0));

        for (let i = 1; i < spikes * 2; i++) {
            const r = (i % 2 === 0) ? outerRadius : innerRadius;
            const angle = angle0 + (i * Math.PI) / spikes;
            ctx.lineTo(r * Math.cos(angle), r * Math.sin(angle));
        }
        ctx.closePath();

        ctx.fillStyle = "#ff00ff";
        ctx.shadowColor = "#ff00ff";
        ctx.shadowBlur = 10;
        ctx.fill();
        ctx.shadowBlur = 0;

        ctx.restore();
    }
    getBounds() {
        return { x: this.x, y: this.y, width: this.width, height: this.height };
    }
}

/* === 風船（レベルアップ演出）クラス === */
// Balloon クラス内の constructor はそのまま（または alpha 初期値 0.95 推奨）
// this.alpha = 0.95;

class Balloon {
    constructor() {
        this.width = 165;
        this.height = 165;
        this.x = Math.random() * (canvas.width - this.width) + this.width / 2;
        this.y = canvas.height + this.height;
        this.vy = 1.2 + Math.random() * 1.5;
        this.t = 0;
        this.swayAmplitude = 10 + Math.random() * 25;
        this.swaySpeed = 0.6 + Math.random() * 1.2;
        this.rotationAmp = 0.08 + Math.random() * 0.06;
        this.alpha = 0.95;
        this.hue = Math.floor(Math.random() * 360);
        // 2種類の画像からランダム（既に実装済みの場合はそのまま使ってOK）
        this.img = balloonImages ? balloonImages[Math.floor(Math.random() * balloonImages.length)] : null;
    }

    move(dt) {
        const sec = dt * 0.001;
        this.t += sec;
        this.y -= this.vy;
        this.x += Math.sin(this.t * this.swaySpeed * Math.PI * 2) * 0.6;

        // ★ フェード制御を変更：上端近くまでは不透明、上端付近でのみフェード
        const fadeStart = 80; // 画面上から80pxに入ったらフェード開始
        if (this.y < fadeStart) {
            // 0〜1で上に行くほど0に近づく
            const range = fadeStart + this.height + 20; // 少し余裕をもって計算
            const t = Math.min(1, Math.max(0, (this.y + this.height + 20) / range));
            this.alpha = t; // t=1(フェード前) → 0(上端外へ)
        } else {
            this.alpha = 0.95;
        }
    }

    draw(ctx) {
        // 読み込み待ちガード（2種ランダム実装時）
        if (typeof balloonsReady === "function" && !balloonsReady()) return;
        const img = this.img || (typeof balloonImage !== "undefined" ? balloonImage : null);
        if (!img) return;

        ctx.save();
        ctx.globalAlpha = this.alpha;
        const angle = Math.sin(this.t * 2.0) * this.rotationAmp;
        ctx.translate(this.x, this.y);
        ctx.rotate(angle);

        // ひも
        ctx.save();
        ctx.rotate(-angle);
        ctx.beginPath();
        ctx.moveTo(0, this.height / 2);
        ctx.lineTo(0, this.height / 2 + 14);
        ctx.lineWidth = 1;
        ctx.strokeStyle = `hsla(${this.hue}, 100%, 80%, 0.6)`;
        ctx.stroke();
        ctx.restore();

        // 本体
        ctx.shadowColor = `hsl(${this.hue}, 100%, 70%)`;
        ctx.shadowBlur = 20;
        ctx.drawImage(img, -this.width / 2, -this.height / 2, this.width, this.height);
        ctx.shadowBlur = 0;

        ctx.restore();
    }

    // ★ 消滅判定は「画面外に出たら」だけにする（alphaでは消さない）
    isOffScreen() {
        return this.y + this.height < -20;
    }
}

/* === ユーティリティ === */
function isIntersecting(r1, r2) {
    return !(r2.x > r1.x + r1.width || r2.x + r2.width < r1.x || r2.y > r1.y + r1.height || r2.y + r2.height < r1.y);
}

function spawnNewBlockRow() {
    const cols = 10;
    const spacing = 65;
    for (let i = 0; i < cols; i++) {
        if (Math.random() < 0.5) {
            const color = Math.random() < 0.05 ? "#ff00cc" : null;
            const block = new Block(60 + i * spacing, 0, color);
            block.dy = 0.1 + (level - 1) * 0.5; // レベルがあがった際のスピード
            blocks.push(block);
        }
    }
}

function showGameOver() {
    gameOverDisplay.style.display = "block";
    finalScoreText.textContent = `FINAL SCORE: ${score}`;
    finalLevelText.textContent = `LEVEL: ${level}`;
    retryButton.style.display = "inline";
}

function initGame() {
    paddle = new Paddle();
    balls = [new Ball()];
    blocks = [];
    items = [];
    balloons = []; // 風船エフェクトも初期化
    score = 0;
    gameRunning = true;
    gameOverDisplay.style.display = "none";
    retryButton.style.display = "none";
    spawnTimer = 0;
    lastTimestamp = performance.now();

    level = 1;
    levelUpScore = 50;
    if (levelUpText) levelUpText.classList.remove("active");

    spawnNewBlockRow();
}

function showLevelUpAnimation() {
    levelUpText.classList.remove("fadeOut");
    void levelUpText.offsetWidth;
    levelUpText.innerHTML = `LEVEL UP！<br><span id="levelNumber">LEVEL ${level}</span>`;
    levelNumber = document.getElementById("levelNumber");
    levelUpText.classList.add("active");
    setTimeout(() => {
        levelUpText.classList.add("fadeOut");
        setTimeout(() => levelUpText.classList.remove("active", "fadeOut"), 1000);
    }, 3000);

    // レベルアップ時に風船を複数体出現
//    spawnLevelUpBalloons(6 + Math.floor(Math.random() * 5)); // 6〜8体
    spawnLevelUpBalloons(14 + Math.floor(Math.random() * 5));
}

/* === 風船生成 === */
function spawnLevelUpBalloons(count = 40 + level * 3) {
    for (let i = 0; i < count; i++) {
        balloons.push(new Balloon());
    }
}

function gameLoop(timestamp) {
    if (!gameRunning) return;

    const deltaTime = timestamp - lastTimestamp;
    lastTimestamp = timestamp;
    spawnTimer += deltaTime;

    // クリア → 背景描画
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawBackground();

    // 移動処理
    balls.forEach(ball => ball.move());
    blocks.forEach(b => b.move());
    items.forEach(it => it.move());
    balloons.forEach(bl => bl.move(deltaTime)); // 風船も更新

    if (mouseDown && mouseXCache != null) paddle.move(mouseXCache);
    if (touchX != null) paddle.move(touchX);

    // 衝突：ボールとパドル
    for (const ball of balls) {
        if (isIntersecting(ball.getBounds(), paddle.getBounds())) {
            ball.dy = -Math.abs(ball.dy);
        }
    }

    // 衝突：ボールとブロック
    for (let i = blocks.length - 1; i >= 0; i--) {
        const block = blocks[i];
        for (let j = balls.length - 1; j >= 0; j--) {
            if (isIntersecting(balls[j].getBounds(), block.getBounds())) {
                if (block.color === "#ff00cc") {
                    items.push(new Item(block.x + block.width / 2, block.y));
                }
                blocks.splice(i, 1);
                balls[j].dy = -balls[j].dy;
                score++;
                break;
            }
        }
    }

    // 衝突：ブロックとパドルライン
    for (const b of blocks) {
        if (b.y + b.height >= paddle.y) {
            gameRunning = false;
            showGameOver();
            return;
        }
    }

    // 衝突：アイテムとパドル
    for (let i = items.length - 1; i >= 0; i--) {
        if (isIntersecting(items[i].getBounds(), paddle.getBounds())) {
            balls.push(new Ball());
            items.splice(i, 1);
        } else if (items[i].y > canvas.height) {
            items.splice(i, 1);
        }
    }

    // 落下したボール除外（全消滅でゲームオーバー）
    balls = balls.filter(ball => ball.y <= canvas.height);
    if (balls.length === 0) {
        gameRunning = false;
        showGameOver();
        return;
    }

    // レベルアップ処理
    if (score >= levelUpScore) {
        level++;
        levelUpScore += 50;
        levelNumber.textContent = level;
        showLevelUpAnimation();
    }

    // ブロック追加
    if (spawnTimer >= spawnInterval) {
        spawnNewBlockRow();
        spawnTimer = 0;
    }

    // 描画
    paddle.draw(ctx);
    balls.forEach(b => b.draw(ctx));
    blocks.forEach(b => b.draw(ctx));
    items.forEach(it => it.draw(ctx));
    balloons.forEach(bl => bl.draw(ctx)); // 風船は最前面

    // 画面外へ出た風船は削除
    balloons = balloons.filter(bl => !bl.isOffScreen());

    scoreDisplay.innerText = "SCORE: " + score;

    requestAnimationFrame(gameLoop);
}

canvas.addEventListener("mousedown", () => mouseDown = true);
canvas.addEventListener("mouseup", () => mouseDown = false);
canvas.addEventListener("mouseleave", () => mouseDown = false);
canvas.addEventListener("mousemove", e => {
    if (mouseDown) mouseXCache = e.clientX;
});
canvas.addEventListener("touchstart", e => {
    if (e.touches.length > 0) touchX = e.touches[0].clientX;
});
canvas.addEventListener("touchmove", e => {
    if (e.touches.length > 0) touchX = e.touches[0].clientX;
});
canvas.addEventListener("touchend", () => touchX = null);

startButton.onclick = () => {
    titleScreen.style.display = "none";
    initGame();
    requestAnimationFrame(gameLoop);
};

retryButton.onclick = () => {
    initGame();
    requestAnimationFrame(gameLoop);
};
