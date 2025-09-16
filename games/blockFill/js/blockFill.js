// ===== BlockFill - custom LEVEL layouts (one-stroke) =====
// タイル: 0=空（塗る対象）, 1=壁（通れない）, 2=スタート（★）

// --- 指定レイアウト ---
// ・LEVEL1 (5x5)
// □□□□□
/* □　□□　 */
/* □　□□　 */
/* □□□□　 */
/* ★□　　  */
//
// ・LEVEL2 (5x7)
// 　　□□□
/* □□□　□ */
/* □　　　□ */
/* ★□□　□ */
/* □□□□□ */
/* □　　□□ */
/* □　　    */

// 上記を数値グリッドに変換（0=□, 1=スペース, 2=★）
const LEVELS = [
    {
        name: "LEVEL 1",
        grid: [
            [0, 0, 0, 0, 0],
            [0, 1, 0, 0, 1],
            [0, 1, 0, 0, 1],
            [0, 0, 0, 0, 1],
            [2, 0, 1, 1, 1],
        ]
    },
    {
        name: "LEVEL 2",
        grid: [
            [1, 1, 0, 0, 0],
            [0, 0, 0, 1, 0],
            [0, 1, 1, 1, 0],
            [2, 0, 0, 1, 0],
            [0, 0, 0, 0, 0],
            [0, 1, 1, 0, 0],
            [0, 1, 1, 1, 1],
        ]
    },
    {
        name: "LEVEL 3",
        grid: [
            [0, 0, 0, 1, 0, 2],
            [0, 1, 0, 0, 0, 1],
            [0, 0, 0, 1, 1, 1],
            [1, 1, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 1, 1],
        ]
    },

];

const STORAGE_KEY = "blockfill_progress_v_custom_v1";

const boardEl = document.getElementById("board");
const levelSelectEl = document.getElementById("levelSelect");
const undoBtn = document.getElementById("undoBtn");
const restartBtn = document.getElementById("restartBtn");
const nextBtn = document.getElementById("nextBtn");
const movesEl = document.getElementById("moves");
const filledEl = document.getElementById("filled");
const totalEl = document.getElementById("total");
const msgEl = document.getElementById("msg");

let state = {
    levelIndex: 0,
    grid: [],
    w: 0,
    h: 0,
    start: null,     // {x,y}
    path: [],        // [{x,y}] 一筆順
    filledCount: 0,
    totalFillable: 0, // (0/2) セル総数
    isDrawing: false,
    lastPointer: null
};

// 多重登録防止
let listenersAttached = false;

function saveProgress() {
    const data = { levelIndex: state.levelIndex };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}
function loadProgress() {
    try {
        const s = localStorage.getItem(STORAGE_KEY);
        if (!s) return;
        const obj = JSON.parse(s);
        if (Number.isInteger(obj.levelIndex) && obj.levelIndex >= 0 && obj.levelIndex < LEVELS.length) {
            state.levelIndex = obj.levelIndex;
        }
    } catch { /* ignore */ }
}

function initUI() {
    levelSelectEl.innerHTML = "";
    LEVELS.forEach((lv, i) => {
        const opt = document.createElement("option");
        opt.value = String(i);
        opt.textContent = lv.name;
        levelSelectEl.appendChild(opt);
    });

    levelSelectEl.value = String(state.levelIndex);
    levelSelectEl.addEventListener("change", () => {
        state.levelIndex = parseInt(levelSelectEl.value, 10);
        saveProgress();
        loadLevel(state.levelIndex);
    });

    undoBtn.addEventListener("click", () => undo());
    restartBtn.addEventListener("click", () => loadLevel(state.levelIndex));
    nextBtn.addEventListener("click", () => {
        const n = (state.levelIndex + 1) % LEVELS.length;
        state.levelIndex = n;
        levelSelectEl.value = String(n);
        saveProgress();
        loadLevel(n);
    });
}

function loadLevel(idx) {
    const def = LEVELS[idx];
    const g = def.grid.map(row => row.slice());
    state.grid = g;
    state.h = g.length;
    state.w = g[0].length;
    state.path = [];
    state.filledCount = 0;
    state.totalFillable = 0;
    state.isDrawing = false;
    state.lastPointer = null;

    state.start = null;
    for (let y = 0; y < state.h; y++) {
        for (let x = 0; x < state.w; x++) {
            if (g[y][x] !== 1) state.totalFillable++;
            if (g[y][x] === 2) state.start = { x, y };
        }
    }
    if (!state.start) throw new Error("スタート地点(2)がありません");

    buildBoard();
    attachListenersOnce();
    updateHUD();
    setMessage("");
}

function buildBoard() {
    boardEl.innerHTML = "";
    boardEl.style.setProperty("--cols", state.w);
    boardEl.style.setProperty("--rows", state.h);

    for (let y = 0; y < state.h; y++) {
        for (let x = 0; x < state.w; x++) {
            const v = state.grid[y][x];
            const c = document.createElement("button");
            c.className = "cell";
            c.dataset.x = String(x);
            c.dataset.y = String(y);
            c.setAttribute("tabindex", "-1");

            if (v === 1) {
                c.classList.add("wall");
                c.setAttribute("aria-label", "壁");
            } else if (v === 2) {
                c.classList.add("start");
                c.setAttribute("aria-label", "スタート");
            } else {
                c.setAttribute("aria-label", "空き");
            }
            boardEl.appendChild(c);
        }
    }
}

function attachListenersOnce() {
    if (listenersAttached) return;
    listenersAttached = true;

    boardEl.addEventListener("pointerdown", onPointerDown);
    boardEl.addEventListener("pointermove", (e) => {
        e.preventDefault(); // スクロール抑制
        onPointerMove(e);
    }, { passive: false });
    window.addEventListener("pointerup", onPointerUp);

    // iOS系ハイライト抑制
    boardEl.addEventListener("touchstart", () => { }, { passive: true });
}

function updateHUD() {
    movesEl.textContent = String(Math.max(0, state.path.length - 1));
    filledEl.textContent = String(state.filledCount);
    totalEl.textContent = String(state.totalFillable);
}

function setMessage(text) {
    msgEl.textContent = text;
    msgEl.classList.toggle("show", !!text);
}

// --- 判定ユーティリティ ---
function coordFromEvent(e) {
    const target = e.target;
    if (!target || !target.classList || !target.classList.contains("cell")) return null;
    const x = parseInt(target.dataset.x, 10);
    const y = parseInt(target.dataset.y, 10);
    return { x, y };
}
function same(a, b) { return a && b && a.x === b.x && a.y === b.y; }
function isInside(x, y) { return x >= 0 && x < state.w && y >= 0 && y < state.h; }
function isWall(x, y) { return state.grid[y][x] === 1; }
function isStart(x, y) { return state.grid[y][x] === 2; }

function setFilled(x, y, filled = true) {
    const idx = y * state.w + x;
    const el = boardEl.children[idx];
    if (!el) return;
    if (filled) el.classList.add("filled");
    else el.classList.remove("filled");
}
function clearPaint() {
    for (let y = 0; y < state.h; y++) {
        for (let x = 0; x < state.w; x++) {
            if (!isWall(x, y)) setFilled(x, y, false);
        }
    }
}
function rebuildPaintFromPath() {
    clearPaint();
    state.filledCount = 0;
    const used = new Set();
    for (const p of state.path) {
        const key = p.x + "," + p.y;
        if (!used.has(key)) {
            used.add(key);
            setFilled(p.x, p.y, true);
            state.filledCount++;
        }
    }
    updateHUD();
}

// --- 分断チェック（未塗りセルが2成分以上に分かれる手は不可） ---
function wouldSplitUnfilledIfMove(to) {
    const pathSet = new Set(state.path.map(p => p.x + "," + p.y));
    const toKey = to.x + "," + to.y;
    pathSet.add(toKey);

    const unfilled = [];
    for (let y = 0; y < state.h; y++) {
        for (let x = 0; x < state.w; x++) {
            if (state.grid[y][x] !== 1) {
                const k = x + "," + y;
                if (!pathSet.has(k)) unfilled.push({ x, y });
            }
        }
    }
    if (unfilled.length <= 1) return false;

    const seen = new Set();
    let components = 0;
    const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
    function bfs(seed) {
        const q = [seed];
        seen.add(seed.x + "," + seed.y);
        while (q.length) {
            const p = q.shift();
            for (const [dx, dy] of dirs) {
                const nx = p.x + dx, ny = p.y + dy;
                const key = nx + "," + ny;
                if (!isInside(nx, ny)) continue;
                if (state.grid[ny][nx] === 1) continue;   // 壁
                if (pathSet.has(key)) continue;           // 既に塗ったセルは未塗りグラフから除外
                if (seen.has(key)) continue;
                seen.add(key);
                q.push({ x: nx, y: ny });
            }
        }
    }
    for (const cell of unfilled) {
        const key = cell.x + "," + cell.y;
        if (!seen.has(key)) {
            components++;
            if (components > 1) return true;
            bfs(cell);
        }
    }
    return false;
}

function onIllegalMoveFeedback() {
    msgEl.classList.add("show");
    msgEl.textContent = "その動きは未塗り領域を分断します";
    setTimeout(() => {
        if (msgEl.textContent === "その動きは未塗り領域を分断します") {
            msgEl.classList.remove("show");
            msgEl.textContent = "";
        }
    }, 900);
}

// --- 入力処理 ---
function canStep(from, to) {
    if (!isInside(to.x, to.y)) return false;
    if (isWall(to.x, to.y)) return false;
    if (!from) return isStart(to.x, to.y);
    const dx = Math.abs(to.x - from.x);
    const dy = Math.abs(to.y - from.y);
    return (dx === 1 && dy === 0) || (dx === 0 && dy === 1);
}

function tryMove(to) {
    const last = state.path[state.path.length - 1] || null;

    // 直前セルに戻る＝UNDO
    if (last && state.path.length >= 2) {
        const prev = state.path[state.path.length - 2];
        if (same(prev, to)) {
            undo();
            return true;
        }
    }

    if (!canStep(last, to)) return false;

    // 経路の再訪は禁止（既に通ったセルに入ろうとしたら巻き戻し）
    const already = state.path.findIndex((p, i) => i < state.path.length && p.x === to.x && p.y === to.y);
    if (already !== -1) {
        state.path = state.path.slice(0, already + 1);
        rebuildPaintFromPath();
        return true;
    }

    // 分断チェック
    if (wouldSplitUnfilledIfMove(to)) {
        onIllegalMoveFeedback();
        return false;
    }

    state.path.push({ x: to.x, y: to.y });
    rebuildPaintFromPath();
    checkClear();
    return true;
}

function startDraw(at) {
    if (!isStart(at.x, at.y)) return;
    state.isDrawing = true;
    state.path = [{ x: at.x, y: at.y }];
    rebuildPaintFromPath();
    setMessage("");
}
function onPointerDown(e) {
    const p = coordFromEvent(e);
    if (!p) return;
    e.preventDefault();
    startDraw(p);
    state.lastPointer = p;
}
function onPointerMove(e) {
    if (!state.isDrawing) return;
    const p = coordFromEvent(e);
    if (!p) return;
    if (!state.lastPointer || !same(p, state.lastPointer)) {
        tryMove(p);
        state.lastPointer = p;
    }
}
function onPointerUp() {
    state.isDrawing = false;
    state.lastPointer = null;
}

// --- 操作 ---
function undo() {
    if (state.path.length <= 1) return;
    state.path.pop();
    rebuildPaintFromPath();
    setMessage("");
}
function checkClear() {
    if (state.filledCount === state.totalFillable) {
        setMessage("CLEAR!  ▶ NEXT で次のレベルへ");
    }
}

// --- 起動 ---
function boot() {
    loadProgress();
    initUI();
    loadLevel(state.levelIndex);
}
boot();
