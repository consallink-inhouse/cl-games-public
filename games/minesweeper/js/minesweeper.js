// ===== Neon Minesweeper (with WALL / Settings Modal / Boom & Congrats / Flag by RightClick & DoubleClick) =====

// DOM
const boardWrapEl = document.getElementById('boardWrap');
const boardEl = document.getElementById('board');

const timeValEl = document.getElementById('timeVal');
const mineValEl = document.getElementById('mineVal');
const flagValEl = document.getElementById('flagVal');
const wallValEl = document.getElementById('wallVal');
const statusValEl = document.getElementById('statusVal');

const settingsModal = document.getElementById('settingsModal');
const difficultyEl = document.getElementById('difficulty');
const wallRateEl = document.getElementById('wallRate');
const startBtn = document.getElementById('startBtn');

const openSettingsBtn = document.getElementById('openSettingsBtn');
const newGameBtn = document.getElementById('newGameBtn');

// ★追加：ZOOM切替ボタン
const zoomToggleBtn = document.getElementById('zoomToggleBtn');

const resultScreen = document.getElementById('resultScreen');
const resultText = document.getElementById('resultText');
const resultSub = document.getElementById('resultSub');
const restartButton = document.getElementById('restartButton');

const celebrateLayer = document.getElementById('celebrateLayer');

// Difficulty presets
const DIFF = {
    easy: { w: 9, h: 9, mines: 10 },
    medium: { w: 16, h: 16, mines: 40 },
    hard: { w: 30, h: 16, mines: 99 }
};

let W = 9, H = 9, MINES = 10;
let wallRate = 0.07;

// cell model: { mine, open, flag, adj, wall }
let grid = [];
let firstClickDone = false;
let gameOver = false;
let started = false;

let timerId = null;
let timeSec = 0;

// 以前の疑似ダブルクリック判定用変数（残っていても動作に影響はありません）
let clickTimer = null;
let clickCount = 0;
const DOUBLE_CLICK_MS = 240;

// ====== ZOOM切替（スマホ向け） ======
const ZOOMS = [1, 1.25, 1.5];
let zoomIndex = 0;

function applyZoom() {
    boardWrapEl.classList.remove('zoom-1', 'zoom-125', 'zoom-150');

    const z = ZOOMS[zoomIndex];
    if (z === 1) boardWrapEl.classList.add('zoom-1');
    else if (z === 1.25) boardWrapEl.classList.add('zoom-125');
    else boardWrapEl.classList.add('zoom-150');

    if (zoomToggleBtn) {
        zoomToggleBtn.textContent = `ZOOM: ${z === 1 ? 'OFF' : 'x' + z}`;
    }
}

// ====== dblclick高速フラグ：誤オープン抑止 ======
let suppressClickUntil = 0;

// ---------- Helpers ----------
function setStatus(txt) {
    statusValEl.textContent = txt;
}

function stopTimer() {
    if (timerId) {
        clearInterval(timerId);
        timerId = null;
    }
}

function startTimer() {
    if (timerId) return;
    timerId = setInterval(() => {
        timeSec++;
        timeValEl.textContent = String(timeSec);
    }, 1000);
}

function showResult(title, sub) {
    resultText.innerHTML = title;
    resultSub.textContent = sub || '';
    resultScreen.classList.add('show');
}

function hideResult() {
    resultScreen.classList.remove('show');
}

function showSettings() {
    settingsModal.style.display = 'flex';
}

function hideSettings() {
    settingsModal.style.display = 'none';
}

function inBounds(x, y) {
    return x >= 0 && x < W && y >= 0 && y < H;
}

function idx(x, y) {
    return y * W + x;
}

function neighbors(x, y) {
    const res = [];
    for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
            if (dx === 0 && dy === 0) continue;
            const nx = x + dx, ny = y + dy;
            if (inBounds(nx, ny)) res.push([nx, ny]);
        }
    }
    return res;
}

function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

// ---------- Grid ----------
function makeEmptyGrid() {
    grid = new Array(W * H).fill(null).map(() => ({
        mine: false,
        open: false,
        flag: false,
        adj: 0,
        wall: false
    }));
}

function placeWalls() {
    const total = W * H;
    const maxWalls = Math.floor(total * 0.18);
    const targetWalls = Math.min(Math.floor(total * wallRate), maxWalls);

    const candidates = [];
    for (let i = 0; i < total; i++) candidates.push(i);
    shuffle(candidates);

    let placed = 0;
    for (let k = 0; k < candidates.length && placed < targetWalls; k++) {
        const i = candidates[k];
        const x = i % W, y = Math.floor(i / W);

        const isCorner =
            (x === 0 && y === 0) || (x === W - 1 && y === 0) ||
            (x === 0 && y === H - 1) || (x === W - 1 && y === H - 1);

        if (isCorner) continue;
        grid[i].wall = true;
        placed++;
    }
    wallValEl.textContent = String(placed);
}

function placeMinesAvoiding(safeX, safeY) {
    // safe cell + around + walls are banned
    const banned = new Set();
    banned.add(idx(safeX, safeY));
    neighbors(safeX, safeY).forEach(([nx, ny]) => banned.add(idx(nx, ny)));

    const candidates = [];
    for (let y = 0; y < H; y++) {
        for (let x = 0; x < W; x++) {
            const i = idx(x, y);
            if (banned.has(i)) continue;
            if (grid[i].wall) continue;
            candidates.push(i);
        }
    }
    shuffle(candidates);

    const canPlace = Math.min(MINES, candidates.length);
    for (let k = 0; k < canPlace; k++) {
        grid[candidates[k]].mine = true;
    }

    // adj counts
    for (let y = 0; y < H; y++) {
        for (let x = 0; x < W; x++) {
            const c = grid[idx(x, y)];
            if (c.wall) { c.adj = 0; continue; }
            if (c.mine) continue;

            let cnt = 0;
            neighbors(x, y).forEach(([nx, ny]) => {
                if (grid[idx(nx, ny)].mine) cnt++;
            });
            c.adj = cnt;
        }
    }
}

// ---------- UI Build ----------
function buildBoardUI() {
    boardEl.innerHTML = '';
    boardEl.style.gridTemplateColumns = `repeat(${W}, 34px)`;

    for (let y = 0; y < H; y++) {
        for (let x = 0; x < W; x++) {
            const d = document.createElement('div');
            d.className = 'cell';
            d.dataset.x = String(x);
            d.dataset.y = String(y);

            const t = document.createElement('span');
            t.className = 'txt';
            t.textContent = '';
            d.appendChild(t);

            // シングル：即オープン（遅延なし）
            d.addEventListener('click', (e) => {
                if (!started || gameOver) return;
                if (e.button !== 0) return;

                // dblclick直後は click を無視（誤オープン防止）
                if (Date.now() < suppressClickUntil) return;

                const cx = Number(d.dataset.x);
                const cy = Number(d.dataset.y);
                openCell(cx, cy);
            });

            // ダブルクリック/ダブルタップ：即フラグ（高速）
            d.addEventListener('dblclick', (e) => {
                e.preventDefault();
                if (!started || gameOver) return;

                // 直後の click を抑制
                suppressClickUntil = Date.now() + 250;

                const cx = Number(d.dataset.x);
                const cy = Number(d.dataset.y);
                toggleFlag(cx, cy);
            });

            // 右クリック：flag
            d.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                if (!started || gameOver) return;
                const cx = Number(d.dataset.x);
                const cy = Number(d.dataset.y);
                toggleFlag(cx, cy);
            });

            boardEl.appendChild(d);
        }
    }
}

function cellEl(x, y) {
    return boardEl.children[idx(x, y)];
}

function updateHud() {
    mineValEl.textContent = String(MINES);
    const flags = grid.reduce((a, c) => a + (c.flag ? 1 : 0), 0);
    flagValEl.textContent = String(flags);

    const walls = grid.reduce((a, c) => a + (c.wall ? 1 : 0), 0);
    wallValEl.textContent = String(walls);
}

function clearCellClasses(el) {
    el.classList.remove('open', 'flag', 'boom', 'wall', 'boom-anim', 'n1', 'n2', 'n3', 'n4', 'n5', 'n6', 'n7', 'n8');
}

function renderCell(x, y) {
    const c = grid[idx(x, y)];
    const el = cellEl(x, y);
    const txt = el.querySelector('.txt');

    clearCellClasses(el);
    txt.textContent = '';

    if (c.wall) {
        el.classList.add('wall');
        txt.textContent = '⬛';
        return;
    }

    if (c.flag && !c.open) {
        el.classList.add('flag');
        txt.textContent = '🚩';
        return;
    }

    if (c.open) {
        el.classList.add('open');
        if (c.mine) {
            el.classList.add('boom');
            txt.textContent = '💣';
        } else if (c.adj > 0) {
            txt.textContent = String(c.adj);
            el.classList.add('n' + c.adj);
        } else {
            txt.textContent = '';
        }
    }
}

function renderAll() {
    for (let y = 0; y < H; y++) {
        for (let x = 0; x < W; x++) renderCell(x, y);
    }
    updateHud();
}

// ---------- Game actions ----------
function toggleFlag(x, y) {
    const c = grid[idx(x, y)];
    if (c.wall || c.open) return;

    c.flag = !c.flag;
    renderCell(x, y);
    updateHud();
    checkWin();
}

function openCell(x, y) {
    const c = grid[idx(x, y)];
    if (c.wall || c.open || c.flag) return;

    if (!firstClickDone) {
        firstClickDone = true;
        placeMinesAvoiding(x, y);
        startTimer();
        setStatus('PLAYING');
    }

    c.open = true;
    renderCell(x, y);

    if (c.mine) {
        onBoom(x, y);
        return;
    }

    if (c.adj === 0) floodOpenZeros(x, y);
    checkWin();
}

function floodOpenZeros(sx, sy) {
    const q = [[sx, sy]];
    const seen = new Set([idx(sx, sy)]);

    while (q.length) {
        const [x, y] = q.shift();
        neighbors(x, y).forEach(([nx, ny]) => {
            const ni = idx(nx, ny);
            if (seen.has(ni)) return;
            seen.add(ni);

            const nc = grid[ni];
            if (nc.wall || nc.open || nc.flag || nc.mine) return;

            nc.open = true;
            renderCell(nx, ny);

            if (nc.adj === 0) q.push([nx, ny]);
        });
    }
}

function revealMines(hitX, hitY) {
    for (let i = 0; i < grid.length; i++) {
        if (grid[i].mine) grid[i].open = true;
    }
    renderAll();
    const hit = cellEl(hitX, hitY);
    hit.classList.add('boom');
}

// ---------- ③ 爆弾クリック演出 ----------
function onBoom(x, y) {
    gameOver = true;
    stopTimer();
    setStatus('BOOM');

    // 爆発セルをパルス
    const hit = cellEl(x, y);
    hit.classList.add('boom', 'boom-anim');

    // 画面シェイク
    document.body.classList.add('shake');
    setTimeout(() => document.body.classList.remove('shake'), 380);

    // 地雷を表示して、結果モーダル
    setTimeout(() => {
        revealMines(x, y);
        showResult('GAME OVER 💥', `Time: ${timeSec}s`);
    }, 420);
}

// ---------- ④ クリア演出（congratulations） ----------
function fireCelebration() {
    celebrateLayer.innerHTML = '';
    celebrateLayer.classList.add('show');

    // ネオン粒子（紙吹雪風）
    const count = 90;
    for (let i = 0; i < count; i++) {
        const p = document.createElement('div');
        p.className = 'particle';

        const left = Math.random() * 100;
        const delay = Math.random() * 0.25;
        const size = 6 + Math.random() * 8;
        const hue = Math.random() < 0.5 ? 'rgba(0,255,231,0.95)' : 'rgba(255,0,204,0.95)';

        p.style.left = `${left}vw`;
        p.style.animationDelay = `${delay}s`;
        p.style.width = `${size}px`;
        p.style.height = `${size}px`;
        p.style.background = hue;

        celebrateLayer.appendChild(p);
    }

    // 少し残して消す
    setTimeout(() => {
        celebrateLayer.classList.remove('show');
        celebrateLayer.innerHTML = '';
    }, 1800);
}

function checkWin() {
    if (!firstClickDone || gameOver) return;

    // クリック可能マス（壁/地雷以外）を全部openしたら勝ち
    const openedSafe = grid.reduce((a, c) => a + (c.open && !c.mine && !c.wall ? 1 : 0), 0);
    const safeTotal = grid.reduce((a, c) => a + (!c.mine && !c.wall ? 1 : 0), 0);

    if (openedSafe === safeTotal) {
        gameOver = true;
        stopTimer();
        setStatus('CLEAR');

        // 演出：地雷に旗
        for (let i = 0; i < grid.length; i++) {
            if (grid[i].mine) grid[i].flag = true;
        }
        renderAll();

        // congratulations演出
        fireCelebration();
        resultText.classList.add('congrats-pulse');

        setTimeout(() => {
            showResult('CONGRATULATIONS 🎉', `Time: ${timeSec}s`);
            // pulse classは再利用したいので外す
            setTimeout(() => resultText.classList.remove('congrats-pulse'), 800);
        }, 250);
    }
}

// ---------- Setup / New Game ----------
function setDifficulty(key) {
    const d = DIFF[key] || DIFF.easy;
    W = d.w; H = d.h; MINES = d.mines;
}

function resetRuntime() {
    stopTimer();
    timeSec = 0;
    timeValEl.textContent = '0';

    firstClickDone = false;
    gameOver = false;

    // 旧変数（残していてもOK）
    clickCount = 0;
    if (clickTimer) {
        clearTimeout(clickTimer);
        clickTimer = null;
    }

    setStatus('READY');
}

function prepareBoard() {
    makeEmptyGrid();
    placeWalls();
    buildBoardUI();
    renderAll();
}

function startGame() {
    started = true;
    newGameBtn.disabled = false;

    // ★ZOOMボタンを有効化
    if (zoomToggleBtn) zoomToggleBtn.disabled = false;

    boardWrapEl.classList.remove('hidden');

    // ★初期はOFF（=zoom-1）で反映
    zoomIndex = 0;
    applyZoom();

    hideSettings();
}

function newGame() {
    hideResult();
    resetRuntime();

    setDifficulty(difficultyEl.value);
    wallRate = Number(wallRateEl.value || '0');

    prepareBoard();
    setStatus('READY');

    // ★盤面を左上へ戻す
    boardWrapEl.scrollLeft = 0;
    boardWrapEl.scrollTop = 0;
}

function showStartModalOnLoad() {
    // 初期表示：設定モーダルを出す
    settingsModal.style.display = 'flex';
    boardWrapEl.classList.add('hidden');
    newGameBtn.disabled = true;
    started = false;

    // ★開始前はZOOM不可
    if (zoomToggleBtn) {
        zoomToggleBtn.disabled = true;
        zoomToggleBtn.textContent = 'ZOOM: OFF';
    }
}

// ---------- Event wiring ----------
startBtn.addEventListener('click', () => {
    newGame();
    startGame();
});

openSettingsBtn.addEventListener('click', () => {
    settingsModal.style.display = 'flex';
});

newGameBtn.addEventListener('click', () => {
    newGame();
});

restartButton.addEventListener('click', () => {
    // RESTARTは設定そのまま
    newGame();
    // 盤面は見えている状態を維持
    boardWrapEl.classList.remove('hidden');
});

// ★ZOOMトグル
if (zoomToggleBtn) {
    zoomToggleBtn.addEventListener('click', () => {
        if (!started) return;
        zoomIndex = (zoomIndex + 1) % ZOOMS.length;
        applyZoom();
    });
}

window.addEventListener('keydown', (e) => {
    // ESC：開始前だけ閉じられる
    if (e.key === 'Escape' && !started) {
        hideSettings();
    }
});

window.addEventListener('load', () => {
    showStartModalOnLoad();
});
