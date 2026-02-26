(() => {
    "use strict";

    // ====== Canvas & HUD ======
    const canvas = document.getElementById("gameCanvas");
    const ctx = canvas.getContext("2d");

    const hudTime = document.getElementById("hudTime");
    const hudCoin = document.getElementById("hudCoin");
    const hudCoinTotal = document.getElementById("hudCoinTotal");
    const hudBest = document.getElementById("hudBest");
    const hudGoalHint = document.getElementById("hudGoalHint");

    const heartsEl = document.getElementById("hearts");

    const overlay = document.getElementById("overlay");
    const overlayTitle = document.getElementById("overlayTitle");
    const overlayText = document.getElementById("overlayText");
    const overlayScore = document.getElementById("overlayScore");

    const btnStart = document.getElementById("btnStart");
    const btnReset = document.getElementById("btnReset");

    // ====== Game settings ======
    const W = canvas.width;
    const H = canvas.height;

    const TILE = 36;
    const GRAVITY = 2200;
    const FRICTION = 0.85;
    const AIR_FRICTION = 0.96;

    const SPEED = 320;
    const DASH_SPEED = 520;
    const JUMP_V = 820;
    const COYOTE_TIME = 0.09;
    const JUMP_BUFFER = 0.10;
    const CROUCH_SCALE = 0.60;

    const CAMERA_LERP = 0.12;

    // ====== Input ======
    const keys = {
        left: false,
        right: false,
        up: false,
        down: false,
        jump: false, // A
        dash: false, // B / Space
    };

    // Keyboard
    window.addEventListener("keydown", (e) => {
        if (e.repeat) return;
        switch (e.code) {
            case "ArrowLeft": keys.left = true; break;
            case "ArrowRight": keys.right = true; break;
            case "ArrowUp": keys.up = true; keys.jump = true; break;
            case "ArrowDown": keys.down = true; break;
            case "Space": keys.dash = true; break;
            case "KeyP": togglePause(); break;
            case "Enter":
                if (overlay.classList.contains("is-visible")) startGame();
                break;
        }
    });

    window.addEventListener("keyup", (e) => {
        switch (e.code) {
            case "ArrowLeft": keys.left = false; break;
            case "ArrowRight": keys.right = false; break;
            case "ArrowUp": keys.up = false; keys.jump = false; break;
            case "ArrowDown": keys.down = false; break;
            case "Space": keys.dash = false; break;
        }
    });

    // Mobile
    const mobile = document.getElementById("mobileControls");
    mobile.querySelectorAll("[data-key]").forEach((btn) => {
        const k = btn.dataset.key;

        const press = (ev) => {
            ev.preventDefault();
            if (k === "left") keys.left = true;
            if (k === "right") keys.right = true;
            if (k === "up") { keys.up = true; keys.jump = true; }
            if (k === "down") keys.down = true;
            if (k === "jump") keys.jump = true;
            if (k === "dash") keys.dash = true;
        };

        const release = (ev) => {
            ev.preventDefault();
            if (k === "left") keys.left = false;
            if (k === "right") keys.right = false;
            if (k === "up") { keys.up = false; keys.jump = false; }
            if (k === "down") keys.down = false;
            if (k === "jump") keys.jump = false;
            if (k === "dash") keys.dash = false;
        };

        btn.addEventListener("touchstart", press, { passive: false });
        btn.addEventListener("touchend", release, { passive: false });
        btn.addEventListener("touchcancel", release, { passive: false });

        btn.addEventListener("mousedown", press);
        btn.addEventListener("mouseup", release);
        btn.addEventListener("mouseleave", release);
    });

    // ====== Utility ======
    const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
    const aabb = (ax, ay, aw, ah, bx, by, bw, bh) =>
        ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;

    function neonStrokeRect(x, y, w, h, glow, alpha = 1) {
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.shadowBlur = glow;
        ctx.shadowColor = "#00ffe7";
        ctx.strokeStyle = "#00ffe7";
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, w, h);
        ctx.restore();
    }

    function neonFillRect(x, y, w, h, color, glow, alpha = 1) {
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.shadowBlur = glow;
        ctx.shadowColor = color;
        ctx.fillStyle = color;
        ctx.fillRect(x, y, w, h);
        ctx.restore();
    }

    // ====== Level (ORIGINAL layout) ======
    // '.' empty / '#' ground / 'B' block / 'C' coin / 'E' enemy / 'S' start / 'G' goal
    const level = [
        "............................................................................................",
        "............................................................................................",
        "............................................................................................",
        "............................................................................................",
        ".................................................................................C..........",
        "....................................................C...............B..B..B.................",
        "..............................C.............B..B..B.............C..........................G",
        "....................B..B..B.........................E.......................................",
        "...........C......................E..........................B..B..............C............",
        ".....S.............................................C........................................",
        "####################....##################....###############....###########################",
        "####################....##################....###############....###########################",
    ];

    const tiles = [];
    const coins = [];
    const enemies = [];
    let goal = { x: 0, y: 0, w: TILE, h: TILE * 2 };

    let startX = TILE * 2;
    let startY = TILE * 7;

    let totalCoins = 0;

    function buildLevel() {
        tiles.length = 0;
        coins.length = 0;
        enemies.length = 0;
        totalCoins = 0;

        for (let r = 0; r < level.length; r++) {
            const row = level[r];
            for (let c = 0; c < row.length; c++) {
                const ch = row[c];
                const x = c * TILE;
                const y = r * TILE;

                if (ch === "#" || ch === "B") {
                    tiles.push({ x, y, w: TILE, h: TILE, type: ch });
                } else if (ch === "C") {
                    coins.push({ x: x + TILE * 0.25, y: y + TILE * 0.25, r: TILE * 0.20, taken: false });
                    totalCoins++;
                } else if (ch === "E") {
                    enemies.push(makeEnemy(x + TILE * 0.10, y + TILE * 0.20));
                } else if (ch === "S") {
                    startX = x;
                    startY = y - TILE * 0.2;
                } else if (ch === "G") {
                    goal = { x: x, y: y - TILE, w: TILE, h: TILE * 2 };
                }
            }
        }
    }

    function makeEnemy(x, y) {
        return {
            x, y,
            w: TILE * 0.8,
            h: TILE * 0.8,
            vx: -90,
            vy: 0,
            alive: true,
            stompedTimer: 0,
        };
    }

    // ====== Player ======
    const player = {
        x: 0, y: 0,
        w: TILE * 0.78,
        h: TILE * 0.92,
        vx: 0, vy: 0,
        onGround: false,
        facing: 1,
        crouching: false,
        coyote: 0,
        jumpBuffer: 0,
        invuln: 0,
    };

    // ====== Game state ======
    let running = false;
    let paused = false;
    let lastT = 0;

    // score/time
    let timeSec = 0;

    // coin & life
    let coinCount = 0;
    const MAX_LIFE = 3;
    let lives = MAX_LIFE;

    // goal lock
    let goalUnlocked = false;

    // best time
    const BEST_KEY = "speed_action_best_time";
    let bestTime = null;

    const camera = { x: 0, y: 0 };

    function loadBestTime() {
        const v = localStorage.getItem(BEST_KEY);
        const n = v ? Number(v) : null;
        if (n && Number.isFinite(n) && n > 0) bestTime = n;
        else bestTime = null;
    }

    function saveBestTime(sec) {
        if (!bestTime || sec < bestTime) {
            bestTime = sec;
            localStorage.setItem(BEST_KEY, String(sec));
        }
    }

    function showOverlay(mode, title, text, scoreHtml = "", showScore = false) {
        overlay.classList.add("is-visible");
        overlay.classList.remove("mode-clear", "mode-over");

        if (mode === "clear") overlay.classList.add("mode-clear");
        if (mode === "over") overlay.classList.add("mode-over");

        overlayTitle.textContent = title;
        overlayText.innerHTML = text;

        overlayScore.style.display = showScore ? "block" : "none";
        overlayScore.innerHTML = scoreHtml;

        btnStart.textContent = (mode === "pause") ? "RESUME" : "START";
    }

    function hideOverlay() {
        overlay.classList.remove("is-visible");
        overlay.classList.remove("mode-clear", "mode-over");
        overlayScore.style.display = "none";
    }

    function resetGame() {
        buildLevel();
        loadBestTime();

        timeSec = 0;
        coinCount = 0;
        lives = MAX_LIFE;
        goalUnlocked = false;

        player.x = startX;
        player.y = startY;
        player.vx = 0;
        player.vy = 0;
        player.onGround = false;
        player.facing = 1;
        player.crouching = false;
        player.coyote = 0;
        player.jumpBuffer = 0;
        player.invuln = 0;

        camera.x = 0;
        camera.y = 0;

        updateHUD();
        updateHearts();
    }

    function updateHearts() {
        heartsEl.innerHTML = "";
        for (let i = 0; i < MAX_LIFE; i++) {
            const span = document.createElement("span");
            span.className = "heart" + (i < lives ? "" : " is-lost");
            span.textContent = "♥";
            heartsEl.appendChild(span);
        }
    }

    function updateHUD() {
        hudTime.textContent = Math.floor(timeSec).toString();
        hudCoin.textContent = coinCount.toString();
        hudCoinTotal.textContent = totalCoins.toString();

        hudBest.textContent = bestTime ? `${bestTime.toFixed(2)}s` : "--";

        goalUnlocked = (coinCount >= totalCoins);
        hudGoalHint.textContent = goalUnlocked ? "GOAL: UNLOCKED" : "GOAL: LOCKED";
    }

    function startGame() {
        if (!running) {
            running = true;
            paused = false;
            lastT = performance.now();
            hideOverlay();
            requestAnimationFrame(loop);
            return;
        }
        // resume
        paused = false;
        hideOverlay();
        lastT = performance.now();
        requestAnimationFrame(loop);
    }

    function endClear() {
        running = false;
        paused = false;

        const score = Number(timeSec.toFixed(2));
        saveBestTime(score);
        updateHUD();

        showOverlay(
            "clear",
            "CLEAR!",
            "コインを全て回収してゴール！",
            `<div>Score (Time): <b>${score.toFixed(2)}s</b></div>
       <div>Best: <b>${bestTime ? bestTime.toFixed(2) + "s" : "--"}</b></div>`,
            true
        );
    }

    function endGameOver() {
        running = false;
        paused = false;

        showOverlay(
            "over",
            "GAME OVER",
            "もう一度挑戦しよう！",
            "",
            false
        );
    }

    function togglePause() {
        if (!running) return;
        paused = !paused;

        if (paused) {
            showOverlay("pause", "PAUSED", "Pキーでも再開できます。", "", false);
        } else {
            startGame();
        }
    }

    // ====== Collision helpers ======
    function moveAndCollide(entity, dt) {
        // Horizontal
        entity.x += entity.vx * dt;
        for (const t of tiles) {
            if (aabb(entity.x, entity.y, entity.w, entity.h, t.x, t.y, t.w, t.h)) {
                if (entity.vx > 0) entity.x = t.x - entity.w;
                else if (entity.vx < 0) entity.x = t.x + t.w;
                entity.vx = 0;
            }
        }

        // Vertical
        entity.y += entity.vy * dt;
        let grounded = false;
        for (const t of tiles) {
            if (aabb(entity.x, entity.y, entity.w, entity.h, t.x, t.y, t.w, t.h)) {
                if (entity.vy > 0) {
                    entity.y = t.y - entity.h;
                    entity.vy = 0;
                    grounded = true;
                } else if (entity.vy < 0) {
                    entity.y = t.y + t.h;
                    entity.vy = 0;
                }
            }
        }
        return grounded;
    }

    // ====== Update ======
    function update(dt) {
        timeSec += dt;

        if (player.invuln > 0) player.invuln -= dt;

        // crouch
        const wantCrouch = keys.down && player.onGround;
        if (wantCrouch && !player.crouching) {
            player.crouching = true;
            player.h = TILE * 0.92 * CROUCH_SCALE;
            player.y += TILE * 0.92 * (1 - CROUCH_SCALE);
        } else if (!wantCrouch && player.crouching) {
            const oldH = player.h;
            player.crouching = false;
            player.h = TILE * 0.92;
            player.y -= (player.h - oldH);

            for (const t of tiles) {
                if (aabb(player.x, player.y, player.w, player.h, t.x, t.y, t.w, t.h)) {
                    player.crouching = true;
                    player.y += (player.h - oldH);
                    player.h = oldH;
                    break;
                }
            }
        }

        // movement
        const maxSpeed = keys.dash ? DASH_SPEED : SPEED;
        const accel = player.onGround ? 2400 : 1700;
        let ax = 0;
        if (keys.left) ax -= accel;
        if (keys.right) ax += accel;

        player.vx += ax * dt;
        player.vx = clamp(player.vx, -maxSpeed, maxSpeed);

        if (!keys.left && !keys.right) {
            player.vx *= player.onGround ? FRICTION : AIR_FRICTION;
            if (Math.abs(player.vx) < 6) player.vx = 0;
        }

        if (player.vx !== 0) player.facing = player.vx > 0 ? 1 : -1;

        // jump buffer & coyote
        player.jumpBuffer = Math.max(0, player.jumpBuffer - dt);
        player.coyote = Math.max(0, player.coyote - dt);

        if (keys.jump || keys.up) {
            player.jumpBuffer = JUMP_BUFFER;
        }

        // gravity
        player.vy += GRAVITY * dt;
        player.vy = Math.min(player.vy, 1600);

        // move + collision
        const wasGround = player.onGround;
        player.onGround = moveAndCollide(player, dt);
        if (player.onGround) player.coyote = COYOTE_TIME;
        if (!player.onGround && wasGround) player.coyote = COYOTE_TIME;

        // jump
        if (player.jumpBuffer > 0 && player.coyote > 0) {
            player.vy = -JUMP_V;
            player.jumpBuffer = 0;
            player.coyote = 0;
        }

        // fall out -> lose life
        if (player.y > H + TILE * 6) {
            loseLife();
            return;
        }

        // coins
        for (const c of coins) {
            if (c.taken) continue;
            const cx = c.x - c.r;
            const cy = c.y - c.r;
            const cr = c.r * 2;
            if (aabb(player.x, player.y, player.w, player.h, cx, cy, cr, cr)) {
                c.taken = true;
                coinCount++;
            }
        }

        // enemies
        for (const e of enemies) {
            if (!e.alive) {
                e.stompedTimer -= dt;
                continue;
            }

            e.vy += GRAVITY * dt;
            e.vy = Math.min(e.vy, 1600);

            const grounded = moveAndCollide(e, dt);
            if (grounded) e.vy = 0;

            if (e.vx === 0) {
                e.vx = (Math.random() < 0.5 ? -1 : 1) * 90;
            }

            // edge detection
            const aheadX = e.x + (e.vx > 0 ? e.w + 2 : -2);
            const footY = e.y + e.h + 2;
            const col = Math.floor(aheadX / TILE);
            const row = Math.floor(footY / TILE);
            const isSolidBelow = tiles.some(t => (t.x / TILE) === col && (t.y / TILE) === row);
            if (!isSolidBelow) e.vx *= -1;

            // collide with player
            if (aabb(player.x, player.y, player.w, player.h, e.x, e.y, e.w, e.h)) {
                const playerBottom = player.y + player.h;
                const enemyTop = e.y;
                const falling = player.vy > 120;

                if (falling && playerBottom - enemyTop < 18) {
                    e.alive = false;
                    e.stompedTimer = 0.6;
                    player.vy = -JUMP_V * 0.55;
                } else {
                    if (player.invuln <= 0) {
                        player.invuln = 1.2;
                        lives--;
                        updateHearts();
                        if (lives <= 0) {
                            endGameOver();
                            return;
                        }
                        player.vx = (player.x < e.x ? -1 : 1) * 360;
                        player.vy = -520;
                    }
                }
            }
        }

        // goal: only if unlocked
        const touchingGoal = aabb(player.x, player.y, player.w, player.h, goal.x, goal.y, goal.w, goal.h);
        if (touchingGoal && goalUnlocked) {
            endClear();
            return;
        }

        // camera follow
        const targetX = clamp(player.x - W * 0.35, 0, level[0].length * TILE - W);
        camera.x += (targetX - camera.x) * CAMERA_LERP;

        updateHUD();
    }

    function loseLife() {
        lives--;
        updateHearts();
        if (lives <= 0) {
            endGameOver();
            return;
        }
        // respawn
        player.x = startX;
        player.y = startY;
        player.vx = 0;
        player.vy = 0;
        player.invuln = 1.2;
    }

    // ====== Render ======
    function drawBackground() {
        ctx.clearRect(0, 0, W, H);

        const sx = camera.x;

        // stars
        ctx.save();
        ctx.globalAlpha = 0.9;
        for (let i = 0; i < 120; i++) {
            const x = (i * 173) % (W * 2);
            const y = (i * 97) % (H * 0.55);
            const px = (x - (sx * 0.15)) % (W * 1.2);
            ctx.fillStyle = (i % 3 === 0) ? "rgba(0,255,231,0.8)" : "rgba(255,0,204,0.7)";
            ctx.fillRect(px, y, 2, 2);
        }
        ctx.restore();

        // distant mountains
        ctx.save();
        ctx.translate(-sx * 0.25, 0);
        ctx.fillStyle = "rgba(255,0,204,0.08)";
        ctx.beginPath();
        ctx.moveTo(0, H * 0.72);
        for (let x = 0; x <= W * 2; x += 80) {
            ctx.quadraticCurveTo(x + 40, H * 0.58, x + 80, H * 0.72);
        }
        ctx.lineTo(W * 2, H);
        ctx.lineTo(0, H);
        ctx.closePath();
        ctx.fill();
        ctx.restore();

        // horizon glow
        ctx.save();
        const grd = ctx.createLinearGradient(0, H * 0.55, 0, H);
        grd.addColorStop(0, "rgba(0,255,231,0.10)");
        grd.addColorStop(1, "rgba(0,0,0,0.95)");
        ctx.fillStyle = grd;
        ctx.fillRect(0, H * 0.55, W, H * 0.45);
        ctx.restore();
    }

    function drawWorld() {
        const ox = Math.floor(camera.x);

        // tiles
        for (const t of tiles) {
            const x = t.x - ox;
            const y = t.y;

            if (x < -TILE || x > W + TILE) continue;

            if (t.type === "#") {
                neonFillRect(x, y, t.w, t.h, "rgba(0,255,231,0.14)", 10, 1);
                neonStrokeRect(x + 1, y + 1, t.w - 2, t.h - 2, 10, 0.9);
            } else {
                neonFillRect(x, y, t.w, t.h, "rgba(255,0,204,0.12)", 10, 1);
                ctx.save();
                ctx.shadowBlur = 10;
                ctx.shadowColor = "#ff00cc";
                ctx.strokeStyle = "rgba(255,0,204,0.85)";
                ctx.lineWidth = 2;
                ctx.strokeRect(x + 2, y + 2, t.w - 4, t.h - 4);
                ctx.restore();
            }
        }

        // coins
        for (const c of coins) {
            if (c.taken) continue;
            const x = c.x - ox;
            const y = c.y;
            ctx.save();
            ctx.shadowBlur = 16;
            ctx.shadowColor = "#ffa500";
            ctx.fillStyle = "rgba(255,165,0,0.85)";
            ctx.beginPath();
            ctx.arc(x, y, c.r, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }

        // enemies
        for (const e of enemies) {
            const x = e.x - ox;
            const y = e.y;
            if (x < -TILE || x > W + TILE) continue;

            if (e.alive) {
                neonFillRect(x, y, e.w, e.h, "rgba(255,0,204,0.18)", 12, 1);
                ctx.save();
                ctx.shadowBlur = 14;
                ctx.shadowColor = "#ff00cc";
                ctx.strokeStyle = "rgba(255,0,204,0.85)";
                ctx.lineWidth = 2;
                ctx.strokeRect(x + 2, y + 2, e.w - 4, e.h - 4);
                ctx.restore();

                ctx.save();
                ctx.fillStyle = "rgba(234,234,255,0.95)";
                ctx.fillRect(x + e.w * 0.25, y + e.h * 0.30, 6, 6);
                ctx.fillRect(x + e.w * 0.60, y + e.h * 0.30, 6, 6);
                ctx.restore();
            } else if (e.stompedTimer > 0) {
                ctx.save();
                ctx.globalAlpha = clamp(e.stompedTimer / 0.6, 0, 1);
                neonFillRect(x, y + e.h * 0.6, e.w, e.h * 0.35, "rgba(255,0,204,0.12)", 10, 1);
                ctx.restore();
            }
        }

        // goal marker (locked/unlocked visual)
        {
            const x = goal.x - ox;
            const y = goal.y;

            const active = goalUnlocked;
            ctx.save();
            ctx.shadowBlur = active ? 20 : 10;
            ctx.shadowColor = active ? "#00ffe7" : "#ff3b6b";
            ctx.fillStyle = active ? "rgba(0,255,231,0.10)" : "rgba(255,59,107,0.08)";
            ctx.fillRect(x, y, goal.w, goal.h);

            ctx.strokeStyle = active ? "rgba(0,255,231,0.85)" : "rgba(255,59,107,0.75)";
            ctx.lineWidth = 2;
            ctx.strokeRect(x + 2, y + 2, goal.w - 4, goal.h - 4);

            ctx.fillStyle = active ? "rgba(0,255,231,0.90)" : "rgba(255,59,107,0.90)";
            ctx.font = "bold 14px Segoe UI, sans-serif";
            ctx.fillText(active ? "GOAL" : "LOCK", x - 8, y - 8);
            ctx.restore();
        }

        drawPlayer(ox);
    }

    function drawPlayer(ox) {
        const x = player.x - ox;
        const y = player.y;

        const blink = player.invuln > 0 && Math.floor(player.invuln * 12) % 2 === 0;
        if (blink) return;

        neonFillRect(x, y, player.w, player.h, "rgba(0,255,231,0.22)", 14, 1);
        neonStrokeRect(x + 2, y + 2, player.w - 4, player.h - 4, 14, 0.95);

        // visor
        ctx.save();
        ctx.shadowBlur = 14;
        ctx.shadowColor = "#ffa500";
        ctx.fillStyle = "rgba(255,165,0,0.65)";
        const vx = player.facing > 0 ? x + player.w * 0.55 : x + player.w * 0.15;
        ctx.fillRect(vx, y + player.h * 0.20, player.w * 0.28, player.h * 0.20);
        ctx.restore();

        // feet
        ctx.save();
        ctx.shadowBlur = 10;
        ctx.shadowColor = "#ff00cc";
        ctx.fillStyle = "rgba(255,0,204,0.55)";
        ctx.fillRect(x + player.w * 0.15, y + player.h * 0.82, player.w * 0.25, player.h * 0.12);
        ctx.fillRect(x + player.w * 0.60, y + player.h * 0.82, player.w * 0.25, player.h * 0.12);
        ctx.restore();
    }

    function render() {
        drawBackground();
        drawWorld();
    }

    // ====== Main loop ======
    function loop(t) {
        if (!running) return;
        if (paused) return;

        const dt = clamp((t - lastT) / 1000, 0, 1 / 20);
        lastT = t;

        update(dt);
        render();

        requestAnimationFrame(loop);
    }

    // ====== Buttons ======
    btnStart.addEventListener("click", () => startGame());

    btnReset.addEventListener("click", () => {
        resetGame();
        showOverlay(
            "title",
            "SPEED ACTION",
            "PC：←→ 移動 / ↑ ジャンプ / ↓ しゃがむ / Space ダッシュ<br />スマホ：十字キー / A ジャンプ / B ダッシュ<br />ルール：コインを全て回収するとゴール可能。タイムを競おう！",
            "",
            false
        );
    });

    // ====== Init ======
    resetGame();
    showOverlay(
        "title",
        "SPEED ACTION",
        "PC：←→ 移動 / ↑ ジャンプ / ↓ しゃがむ / Space ダッシュ<br />スマホ：十字キー / A ジャンプ / B ダッシュ<br />ルール：コインを全て回収するとゴール可能。タイムを競おう！",
        "",
        false
    );
})();