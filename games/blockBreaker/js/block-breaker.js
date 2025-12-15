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

const videoCutin = document.getElementById("videoCutin");
const cutinVideo = document.getElementById("cutinVideo");
const bgVideo = document.getElementById("bgVideo");

const VIDEO_TRIGGER_SCORE = 5;
let videoTriggered = false;

/* === 背景画像の読み込み（透過で描画） === */
const bgImage = new Image();
// bgImage.src = "./images/yo-ko-.jpg";
let bgLoaded = false;
bgImage.onload = () => { bgLoaded = true; };

function drawBackground() {
    if (!bgLoaded) return;
    const cw = canvas.width;
    const ch = canvas.height;
    const iw = bgImage.naturalWidth || bgImage.width;
    const ih = bgImage.naturalHeight || bgImage.height;
    let scale = Math.max(cw / iw, ch / ih);
    // 画像を少し縮小（全体的に0.8倍）
    scale *= 0.8;

    const dw = iw * scale;
    const dh = ih * scale;
    const dx = (cw - dw) / 2;
    const dy = (ch - dh) / 2;

    ctx.save();
    ctx.globalAlpha = 0.15;
    ctx.drawImage(bgImage, dx, dy, dw, dh);
    ctx.restore();
}
/* === 背景画像ここまで === */

/* === レベルアップ演出用画像（風船） === */
const itemImage = new Image();
//itemImage.src = "./images/yo-ko-.png";
let itemImageLoaded = false;
itemImage.onload = () => { itemImageLoaded = true; };

// 風船はこの画像を使用
const balloonImage = itemImage;
let balloonImageLoaded = true; // itemImage と同一のため真

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
class Balloon {
    constructor() {
        this.width = 48;
        this.height = 48;
        this.x = Math.random() * (canvas.width - this.width) + this.width / 2;
        this.y = canvas.height + this.height; // 画面下から出現
        this.vy = 1.2 + Math.random() * 1.0; // 上昇速度
        this.t = 0;
        this.swayAmplitude = 10 + Math.random() * 20; // 横ゆれ幅
        this.swaySpeed = 0.8 + Math.random() * 1.0;   // 横ゆれ速度
        this.rotationAmp = 0.08 + Math.random() * 0.06;
        this.alpha = 0.85;
    }
    move(dt) {
        const sec = dt * 0.001;
        this.t += sec;
        this.y -= this.vy; // 上昇
        this.x += Math.sin(this.t * this.swaySpeed * Math.PI * 2) * 0.6; // 微小な揺れ
    }
    draw(ctx) {
        if (!balloonImageLoaded || !itemImageLoaded) return;
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
        ctx.strokeStyle = "rgba(255,255,255,0.5)";
        ctx.stroke();
        ctx.restore();

        // 風船本体
        ctx.shadowColor = "#ff00ff";
        ctx.shadowBlur = 10;
        ctx.drawImage(balloonImage, -this.width / 2, -this.height / 2, this.width, this.height);
        ctx.shadowBlur = 0;

        ctx.restore();
    }
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

    videoTriggered = false;
    hideVideos();

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
    spawnLevelUpBalloons(6 + Math.floor(Math.random() * 3)); // 6〜8体
}

/* === 風船生成 === */
function spawnLevelUpBalloons(count = 25) {
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

    // ★スコア100超え：LEVEL UP → カットイン動画（スマホのみ・1回）
    if (!videoTriggered && score >= VIDEO_TRIGGER_SCORE && isMobileMode()) {
        videoTriggered = true;

        // ① まず LEVEL UP テキストを表示
        showLevelUpAnimation();

        // ② 少し溜めてからカットイン動画
        setTimeout(() => {
            playCutinThenBackground();
        }, 50); // ← LEVEL UP を読ませるための溜め（調整可）
    }

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

function isMobileMode() {
    return window.matchMedia("(max-width: 600px)").matches;
}

function stopAndResetVideo(v) {
    if (!v) return;
    try {
        v.pause();
        v.currentTime = 0;
    } catch (e) {}
}

function hideVideos() {
    if (videoCutin) videoCutin.classList.remove("show");
    if (bgVideo) bgVideo.style.opacity = "0";
    stopAndResetVideo(cutinVideo);
    stopAndResetVideo(bgVideo);
}

async function playCutinThenBackground() {
    if (!isMobileMode()) return;
    if (!cutinVideo || !bgVideo || !videoCutin) return;

    // カットイン表示
    videoCutin.classList.add("show");

    // カットイン再生（スマホはmuted+playsinlineで自動再生が通りやすい）
    try {
        cutinVideo.currentTime = 0;
        await cutinVideo.play();
    } catch (e) {
        // 自動再生がブロックされても、ゲームは続ける
        videoCutin.classList.remove("show");
        return;
    }

    // 終了したら背景動画へ
    const endHandler = async () => {
        cutinVideo.removeEventListener("ended", endHandler);
        videoCutin.classList.remove("show");

        // 背景動画をうっすら表示してループ再生
        try {
            bgVideo.currentTime = 0;
            await bgVideo.play();
            bgVideo.style.opacity = "0.28"; // ←お好みで調整
        } catch (e) {
            // 背景動画が再生できなくてもゲームは続ける
        }
    };

    cutinVideo.addEventListener("ended", endHandler);

    // 念のためタイムアウトでも背景化（動画が短い/endedが来ない保険）
    setTimeout(() => {
        if (videoCutin.classList.contains("show")) {
            try { cutinVideo.pause(); } catch (e) {}
            endHandler();
        }
    }, 4500);
}
