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

class Item {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 20;
        this.height = 20;
        this.dy = 2;
        this.rotation = 0;
    }
    move() {
        this.y += this.dy;
        this.rotation += 0.1;
    }
    draw(ctx) {
        ctx.save();
        ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
        ctx.rotate(this.rotation);
        ctx.beginPath();
        const spikes = 5;
        const outerRadius = this.width / 2;
        const innerRadius = outerRadius / 2.5;
        for (let i = 0; i < spikes * 2; i++) {
            const r = (i % 2 === 0) ? outerRadius : innerRadius;
            const angle = (i * Math.PI) / spikes;
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
  levelUpText.classList.add("active");
  setTimeout(() => {
    levelUpText.classList.add("fadeOut");
    setTimeout(() => levelUpText.classList.remove("active", "fadeOut"), 1000);
  }, 3000);
}

function gameLoop(timestamp) {
  if (!gameRunning) return;

  const deltaTime = timestamp - lastTimestamp;
  lastTimestamp = timestamp;
  spawnTimer += deltaTime;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // 移動処理
  balls.forEach(ball => ball.move());
  blocks.forEach(b => b.move());
  items.forEach(it => it.move());

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

  // ボールが落ちたか確認（すべて消えるとゲームオーバー）
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
