/* ===================================================================
   score.js - 試合状況管理
     - 試合選択（スケジュールから抽出）
     - 得点 / カード / 交代 のイベントログ
     - 累積カード集計
     - 味方/相手の両陣形ボード（相手はクリックで編集）
   =================================================================== */

/* ===== 自チーム選手マスタ ===== */
const homePlayers = [
  { id: 'buffon',      number:  1, name: 'ブッフォン',       pos: 'GK', role: 'starter' },
  { id: 'roberto',     number:  3, name: 'ロベルト・カルロス', pos: 'DF', role: 'starter' },
  { id: 'puyol',       number:  5, name: 'プジョル',         pos: 'DF', role: 'starter' },
  { id: 'ramos',       number:  4, name: 'ラモス',           pos: 'DF', role: 'starter' },
  { id: 'maicon',      number:  2, name: 'マイコン',         pos: 'DF', role: 'starter' },
  { id: 'bale',        number: 14, name: 'ベイル',           pos: 'MF', role: 'starter' },
  { id: 'iniesta',     number:  6, name: 'イニエスタ',       pos: 'MF', role: 'starter' },
  { id: 'yoshimura',   number: 18, name: '吉村 彰吾',         pos: 'MF', role: 'starter', highlight: true },
  { id: 'robben',      number: 11, name: 'ロッベン',         pos: 'MF', role: 'starter' },
  { id: 'drogba',      number:  9, name: 'ドログバ',         pos: 'FW', role: 'starter' },
  { id: 'ibrahimovic', number: 10, name: 'イブラヒモビッチ', pos: 'FW', role: 'starter' },
  /* ベンチ */
  { id: 'gerrard',     number:  8, name: 'ジェラード',       pos: 'MF', role: 'bench' },
  { id: 'messi',       number: 30, name: 'メッシ',           pos: 'FW', role: 'bench' },
  { id: 'kaka',        number: 22, name: 'カカ',             pos: 'MF', role: 'bench' },
  { id: 'ronaldo',     number:  7, name: 'C.ロナウド',       pos: 'MF', role: 'bench' },
  { id: 'pique',       number: 15, name: 'ピケ',             pos: 'DF', role: 'bench' },
  { id: 'vandersar',   number: 16, name: 'V.デル・サール',   pos: 'GK', role: 'bench' },
];

/* スターターのフィールド配置 (4-4-2) */
const homeFieldLayout = [
  { x: 50, y: 92, pid: 'buffon' },
  { x: 15, y: 75, pid: 'roberto' },
  { x: 38, y: 78, pid: 'puyol' },
  { x: 62, y: 78, pid: 'ramos' },
  { x: 85, y: 75, pid: 'maicon' },
  { x: 15, y: 50, pid: 'bale' },
  { x: 38, y: 52, pid: 'iniesta' },
  { x: 62, y: 52, pid: 'yoshimura' },
  { x: 85, y: 50, pid: 'robben' },
  { x: 35, y: 22, pid: 'drogba' },
  { x: 65, y: 22, pid: 'ibrahimovic' },
];

/* スケジュールから試合データ（schedule.jsと同期） */
const scheduledMatches = [
  { id: 'm1', date: '2025-01-25', time: '19:00', opp: 'DigitalForce FC',  location: '駒沢オリンピック公園', type: '練習試合' },
  { id: 'm2', date: '2025-02-02', time: '09:00', opp: '第3回 社会人サッカーオープン', location: '駒沢オリンピック公園', type: '大会' },
  { id: 'm3', date: '2025-02-16', time: '14:00', opp: 'SportsWorks United', location: '横浜国際フットボールパーク', type: '練習試合' },
  { id: 'm4', date: '2025-01-19', time: '15:00', opp: '横浜キッカーズ',   location: '駒沢オリンピック公園', type: '練習試合' },
];

/* 相手チーム選手 (デフォルト 11名 + 編集可能) */
function defaultAwayPlayers() {
  return Array.from({ length: 11 }, (_, i) => ({
    number: i + 1,
    name: `選手 ${i + 1}`,
    pos: ['GK','DF','DF','DF','DF','MF','MF','MF','MF','FW','FW'][i],
    comment: ''
  }));
}

/* 相手のフィールド配置 (4-4-2 ミラー、自チームの左右反転) */
const awayFieldLayout = [
  { x: 50, y: 92, idx: 0  },
  { x: 15, y: 75, idx: 1  },
  { x: 38, y: 78, idx: 2  },
  { x: 62, y: 78, idx: 3  },
  { x: 85, y: 75, idx: 4  },
  { x: 15, y: 50, idx: 5  },
  { x: 38, y: 52, idx: 6  },
  { x: 62, y: 52, idx: 7  },
  { x: 85, y: 50, idx: 8  },
  { x: 35, y: 22, idx: 9  },
  { x: 65, y: 22, idx: 10 },
];

/* ===== ステート ===== */
let state = {
  matchId: 'm1',
  scoreHome: 0,
  scoreAway: 0,
  timerSeconds: 45 * 60,
  timerRunning: false,
  timerInterval: null,
  half: 1,
  events: { goals: [], cards: [], subs: [] },
  awayTeam: { name: '対戦相手', players: defaultAwayPlayers() },
};

/* ===== 初期化 ===== */
function init() {
  // 試合セレクト
  const sel = document.getElementById('matchSelect');
  sel.innerHTML = scheduledMatches.map(m => `<option value="${m.id}">${m.date} ${m.time} ・ vs ${m.opp}</option>`).join('');
  sel.value = state.matchId;
  sel.addEventListener('change', e => {
    state.matchId = e.target.value;
    onMatchChanged();
  });
  onMatchChanged();

  renderUnifiedField();
  updateUI();
  populatePlayerSelects();
}

function currentMatch() {
  return scheduledMatches.find(m => m.id === state.matchId) || scheduledMatches[0];
}

function onMatchChanged() {
  const m = currentMatch();
  document.getElementById('matchBarInfo').innerHTML = `
    <div class="match-bar-tags">
      <span class="match-tag">📅 ${m.date} ${m.time}</span>
      <span class="match-tag">📍 ${m.location}</span>
      <span class="match-tag match-tag-type">${m.type}</span>
    </div>
  `;
  document.getElementById('awayTeamName').textContent = m.opp;
  document.getElementById('awayFieldLabel').textContent = `🔴 ${m.opp}（相手）`;
  state.awayTeam.name = m.opp;
  renderUnifiedField();
}

/* ===== スコア & タイマー ===== */
function updateScore(side, delta) {
  if (side === 'home') state.scoreHome = Math.max(0, state.scoreHome + delta);
  else                 state.scoreAway = Math.max(0, state.scoreAway + delta);
  document.getElementById('scoreHome').textContent = state.scoreHome;
  document.getElementById('scoreAway').textContent = state.scoreAway;
}

function toggleTimer() {
  if (state.timerRunning) {
    clearInterval(state.timerInterval);
    state.timerRunning = false;
    document.getElementById('timerBtn').textContent = '▶ スタート';
  } else {
    state.timerRunning = true;
    document.getElementById('timerBtn').textContent = '⏸ 停止';
    state.timerInterval = setInterval(() => {
      if (state.timerSeconds > 0) { state.timerSeconds--; updateTimerDisplay(); }
      else {
        clearInterval(state.timerInterval);
        state.timerRunning = false;
        document.getElementById('timerBtn').textContent = '▶ スタート';
      }
    }, 1000);
  }
}

function resetTimer() {
  clearInterval(state.timerInterval);
  state.timerRunning = false;
  state.timerSeconds = 45 * 60;
  updateTimerDisplay();
  document.getElementById('timerBtn').textContent = '▶ スタート';
}

function toggleHalf() {
  state.half = state.half === 1 ? 2 : 1;
  state.timerSeconds = 45 * 60;
  updateTimerDisplay();
  document.getElementById('halfLabel').textContent = state.half === 1 ? '前半' : '後半';
  document.getElementById('halfBtn').textContent = state.half === 1 ? '▶ 後半へ' : '◀ 前半へ';
}

function updateTimerDisplay() {
  const m = Math.floor(state.timerSeconds / 60), s = state.timerSeconds % 60;
  document.getElementById('timerDisplay').textContent = `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
}

function currentMinute() {
  // 現在の試合分（後半は 45 + minute）
  const elapsed = (45 * 60 - state.timerSeconds);
  const base = state.half === 1 ? 0 : 45;
  return base + Math.floor(elapsed / 60);
}

/* ===== 選手 select の populate ===== */
function populatePlayerSelects() {
  const homeOpts = homePlayers.map(p => `<option value="${p.id}">#${p.number} ${p.name} (${p.pos})</option>`).join('');
  const homeStartersOpts = homePlayers.filter(p => p.role === 'starter').map(p => `<option value="${p.id}">#${p.number} ${p.name}</option>`).join('');
  const homeBenchOpts    = homePlayers.filter(p => p.role === 'bench').map(p => `<option value="${p.id}">#${p.number} ${p.name}</option>`).join('');
  const awayOpts = state.awayTeam.players.map((p, i) => `<option value="A_${i}">#${p.number} ${p.name} (${p.pos})</option>`).join('');

  // 得点者: 全選手 (home or away)
  rePopulateGoalScorerByTeam();

  // カード: 全選手
  rePopulateCardPlayerByTeam();

  // 交代: home OUT=starter, IN=bench
  document.getElementById('subOut').innerHTML = homeStartersOpts;
  document.getElementById('subIn').innerHTML  = homeBenchOpts;
  document.getElementById('subTeam').addEventListener('change', () => {
    const t = document.getElementById('subTeam').value;
    if (t === 'home') {
      document.getElementById('subOut').innerHTML = homeStartersOpts;
      document.getElementById('subIn').innerHTML  = homeBenchOpts;
    } else {
      document.getElementById('subOut').innerHTML = awayOpts;
      document.getElementById('subIn').innerHTML  = '<option value="">（相手選手 - 自由入力）</option>' + awayOpts;
    }
  });

  document.getElementById('goalTeam').addEventListener('change', rePopulateGoalScorerByTeam);
  document.getElementById('cardTeam').addEventListener('change', rePopulateCardPlayerByTeam);
}

function rePopulateGoalScorerByTeam() {
  const team = document.getElementById('goalTeam').value;
  if (team === 'home') {
    const opts = homePlayers.map(p => `<option value="${p.id}">#${p.number} ${p.name}</option>`).join('');
    document.getElementById('goalScorer').innerHTML = opts;
    document.getElementById('goalAssist').innerHTML = '<option value="">（なし）</option>' + opts;
  } else {
    const opts = state.awayTeam.players.map((p, i) => `<option value="A_${i}">#${p.number} ${p.name}</option>`).join('');
    document.getElementById('goalScorer').innerHTML = opts;
    document.getElementById('goalAssist').innerHTML = '<option value="">（なし）</option>' + opts;
  }
}

function rePopulateCardPlayerByTeam() {
  const team = document.getElementById('cardTeam').value;
  if (team === 'home') {
    document.getElementById('cardPlayer').innerHTML = homePlayers.map(p => `<option value="${p.id}">#${p.number} ${p.name}</option>`).join('');
  } else {
    document.getElementById('cardPlayer').innerHTML = state.awayTeam.players.map((p, i) => `<option value="A_${i}">#${p.number} ${p.name}</option>`).join('');
  }
}

function getPlayerDisplay(team, id) {
  if (team === 'home') {
    const p = homePlayers.find(p => p.id === id);
    return p ? `#${p.number} ${p.name}` : id;
  } else {
    const i = parseInt(String(id).replace('A_',''), 10);
    const p = state.awayTeam.players[i];
    return p ? `#${p.number} ${p.name}` : `相手選手 ${i+1}`;
  }
}

/* ===== 得点登録 ===== */
function submitGoal() {
  const team   = document.getElementById('goalTeam').value;
  const time   = parseInt(document.getElementById('goalTime').value || currentMinute(), 10);
  const scorer = document.getElementById('goalScorer').value;
  const assist = document.getElementById('goalAssist').value;
  const note   = document.getElementById('goalNote').value;
  if (!scorer) return;

  state.events.goals.push({ time, team, scorer, assist, note });
  state.events.goals.sort((a, b) => a.time - b.time);

  // スコアも自動加算
  if (team === 'home') state.scoreHome++;
  else                  state.scoreAway++;

  closeModal('modal-add-goal');
  document.getElementById('goalNote').value = '';
  document.getElementById('goalTime').value = '';
  updateUI();
}

/* ===== カード登録 ===== */
function openCardModal(type) {
  document.getElementById('cardType').value = type;
  document.getElementById('cardModalTitle').textContent = type === 'Y' ? '🟨 イエローカード登録' : '🟥 レッドカード登録';
  rePopulateCardPlayerByTeam();
  openModal('modal-add-card');
}

function submitCard() {
  const type   = document.getElementById('cardType').value;
  const team   = document.getElementById('cardTeam').value;
  const time   = parseInt(document.getElementById('cardTime').value || currentMinute(), 10);
  const player = document.getElementById('cardPlayer').value;
  const note   = document.getElementById('cardNote').value;
  if (!player) return;

  state.events.cards.push({ type, time, team, player, note });
  state.events.cards.sort((a, b) => a.time - b.time);

  closeModal('modal-add-card');
  document.getElementById('cardNote').value = '';
  document.getElementById('cardTime').value = '';
  updateUI();
}

function adjustCard(team, playerId, type, delta) {
  if (delta > 0) {
    state.events.cards.push({ type, time: currentMinute(), team, player: playerId, note: '（直接加算）' });
  } else {
    // 最後の該当カードを削除
    for (let i = state.events.cards.length - 1; i >= 0; i--) {
      const c = state.events.cards[i];
      if (c.team === team && c.player === playerId && c.type === type) {
        state.events.cards.splice(i, 1);
        break;
      }
    }
  }
  updateUI();
}

/* ===== 交代登録 ===== */
function submitSub() {
  const team = document.getElementById('subTeam').value;
  const time = parseInt(document.getElementById('subTime').value || currentMinute(), 10);
  const out  = document.getElementById('subOut').value;
  const inn  = document.getElementById('subIn').value;
  const note = document.getElementById('subNote').value;

  state.events.subs.push({ time, team, out, in: inn, note });
  state.events.subs.sort((a, b) => a.time - b.time);

  // 自チームの場合は role を入れ替え (擬似)
  if (team === 'home') {
    const outP = homePlayers.find(p => p.id === out);
    const inP  = homePlayers.find(p => p.id === inn);
    if (outP) outP.role = 'bench';
    if (inP) inP.role  = 'starter';
  }

  closeModal('modal-add-sub');
  document.getElementById('subNote').value = '';
  document.getElementById('subTime').value = '';
  populatePlayerSelects();
  updateUI();
}

/* ===== UI 更新 ===== */
function updateUI() {
  // タブカウンタ
  document.getElementById('goalsCount').textContent = state.events.goals.length;
  document.getElementById('cardsCount').textContent = state.events.cards.length;
  document.getElementById('subsCount').textContent  = state.events.subs.length;

  // スコア
  document.getElementById('scoreHome').textContent = state.scoreHome;
  document.getElementById('scoreAway').textContent = state.scoreAway;

  // 得点ログ
  const goalsHtml = state.events.goals.length === 0
    ? '<div class="event-empty">まだ得点は登録されていません</div>'
    : state.events.goals.map(g => `
        <div class="event-row event-${g.team}">
          <div class="event-time">${g.time}'</div>
          <div class="event-icon">⚽</div>
          <div class="event-main">
            <div class="event-primary">${getPlayerDisplay(g.team, g.scorer)}</div>
            ${g.assist ? `<div class="event-secondary">A: ${getPlayerDisplay(g.team, g.assist)}</div>` : ''}
          </div>
          <div class="event-side">${g.team === 'home' ? 'CLFC' : state.awayTeam.name}</div>
          ${g.note ? `<div class="event-note">${g.note}</div>` : ''}
        </div>
      `).join('');
  document.getElementById('goalLog').innerHTML = goalsHtml;

  // カードログ
  const cardsHtml = state.events.cards.length === 0
    ? '<div class="event-empty">カードイベントなし</div>'
    : state.events.cards.map(c => `
        <div class="event-row event-${c.team}">
          <div class="event-time">${c.time}'</div>
          <div class="event-icon">${c.type === 'Y' ? '🟨' : '🟥'}</div>
          <div class="event-main">
            <div class="event-primary">${getPlayerDisplay(c.team, c.player)}</div>
            ${c.note ? `<div class="event-secondary">${c.note}</div>` : ''}
          </div>
          <div class="event-side">${c.team === 'home' ? 'CLFC' : state.awayTeam.name}</div>
        </div>
      `).join('');
  document.getElementById('cardLog').innerHTML = cardsHtml;

  // 累積カード集計（自チーム）
  const summary = {};
  state.events.cards.filter(c => c.team === 'home').forEach(c => {
    if (!summary[c.player]) summary[c.player] = { Y: 0, R: 0 };
    summary[c.player][c.type]++;
  });
  const sumHtml = Object.keys(summary).length === 0
    ? '<div class="event-empty" style="padding:12px">累積なし</div>'
    : Object.entries(summary).map(([pid, cnt]) => `
        <div class="card-sum-row">
          <div class="card-sum-name">${getPlayerDisplay('home', pid)}</div>
          <div class="card-sum-counts">
            <div class="card-counter card-counter-y">
              <button class="card-mini-btn" onclick="adjustCard('home', '${pid}', 'Y', -1)">−</button>
              <span class="card-mini-label">🟨</span>
              <span class="card-mini-val">${cnt.Y}</span>
              <button class="card-mini-btn" onclick="adjustCard('home', '${pid}', 'Y', 1)">+</button>
            </div>
            <div class="card-counter card-counter-r">
              <button class="card-mini-btn" onclick="adjustCard('home', '${pid}', 'R', -1)">−</button>
              <span class="card-mini-label">🟥</span>
              <span class="card-mini-val">${cnt.R}</span>
              <button class="card-mini-btn" onclick="adjustCard('home', '${pid}', 'R', 1)">+</button>
            </div>
          </div>
        </div>
      `).join('');
  document.getElementById('cardSummary').innerHTML = sumHtml;

  // 交代ログ
  const subsHtml = state.events.subs.length === 0
    ? '<div class="event-empty">交代記録なし</div>'
    : state.events.subs.map(s => `
        <div class="event-row event-${s.team}">
          <div class="event-time">${s.time}'</div>
          <div class="event-icon">🔄</div>
          <div class="event-main">
            <div class="event-primary">OUT ${getPlayerDisplay(s.team, s.out)}</div>
            <div class="event-secondary">IN  ${getPlayerDisplay(s.team, s.in)}</div>
            ${s.note ? `<div class="event-note">${s.note}</div>` : ''}
          </div>
          <div class="event-side">${s.team === 'home' ? 'CLFC' : state.awayTeam.name}</div>
        </div>
      `).join('');
  document.getElementById('subLog').innerHTML = subsHtml;

  // ピッチビューも再描画（バッジ反映）
  renderUnifiedField();
}

function switchEventTab(name) {
  document.querySelectorAll('.event-tab').forEach(t => t.classList.toggle('active', t.dataset.tab === name));
  document.querySelectorAll('.event-panel').forEach(p => p.classList.toggle('active', p.id === 'panel-' + name));
}

/* ===== 統合フィールド描画 ===== */
// 元の縦向き座標 (x:0-100, y:0-100, y大=自陣ゴール) を
// 横向き統合ピッチの座標へ変換する
function toUnifiedHome(x, y) {
  // 味方: 左サイド (自陣ゴール=左, 攻める方向=右)
  return { left: (100 - y) / 2, top: x };
}
function toUnifiedAway(x, y) {
  // 相手: 右サイド (自陣ゴール=右, 攻める方向=左)
  return { left: 50 + y / 2, top: 100 - x };
}
// 逆変換: 統合ピッチ上の % 座標 → 元の (x, y) 座標
function fromUnifiedHome(left, top) {
  return { x: top, y: 100 - 2 * left };
}
function fromUnifiedAway(left, top) {
  return { x: 100 - top, y: 2 * (left - 50) };
}

/* ===== ドラッグ&クリック共用ハンドラ ===== */
// クリック (移動量 < 閾値) なら onClick を呼び、ドラッグなら onDragEnd(left%, top%) を呼ぶ
function attachDragOrClick(dot, fieldEl, onClick, onDragEnd) {
  let pid = null, startX = 0, startY = 0, startLeft = 0, startTop = 0, dragging = false;
  const THRESHOLD = 4;

  dot.addEventListener('pointerdown', e => {
    pid = e.pointerId;
    dragging = false;
    startX = e.clientX;
    startY = e.clientY;
    startLeft = parseFloat(dot.style.left) || 0;
    startTop  = parseFloat(dot.style.top)  || 0;
    try { dot.setPointerCapture(pid); } catch(_) {}
    e.preventDefault();
  });

  dot.addEventListener('pointermove', e => {
    if (e.pointerId !== pid) return;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    if (!dragging && (Math.abs(dx) > THRESHOLD || Math.abs(dy) > THRESHOLD)) {
      dragging = true;
      dot.classList.add('mini-token-dragging');
    }
    if (dragging) {
      const rect = fieldEl.getBoundingClientRect();
      const newLeft = Math.max(0, Math.min(100, startLeft + (dx / rect.width)  * 100));
      const newTop  = Math.max(0, Math.min(100, startTop  + (dy / rect.height) * 100));
      dot.style.left = `${newLeft}%`;
      dot.style.top  = `${newTop}%`;
    }
  });

  const endHandler = e => {
    if (e.pointerId !== pid) return;
    try { dot.releasePointerCapture(pid); } catch(_) {}
    pid = null;
    if (dragging) {
      dot.classList.remove('mini-token-dragging');
      const finalLeft = parseFloat(dot.style.left) || 0;
      const finalTop  = parseFloat(dot.style.top)  || 0;
      dragging = false;
      onDragEnd(finalLeft, finalTop);
    } else {
      onClick();
    }
  };
  dot.addEventListener('pointerup', endHandler);
  dot.addEventListener('pointercancel', endHandler);
}

function renderUnifiedField() {
  const field = document.getElementById('unifiedField');
  if (!field) return;
  field.innerHTML = `
    <div class="unified-field-center-circle"></div>
    <div class="unified-field-penarea left"></div>
    <div class="unified-field-penarea right"></div>
    <div class="unified-field-goalarea left"></div>
    <div class="unified-field-goalarea right"></div>
    <div class="unified-field-goal left"></div>
    <div class="unified-field-goal right"></div>
    <div class="unified-field-penspot left"></div>
    <div class="unified-field-penspot right"></div>
  `;

  // 味方
  homeFieldLayout.forEach(slot => {
    const p = homePlayers.find(pp => pp.id === slot.pid);
    if (!p) return;
    const pos = toUnifiedHome(slot.x, slot.y);
    const goalCnt = state.events.goals.filter(g => g.team === 'home' && g.scorer === p.id).length;
    const yCnt    = state.events.cards.filter(c => c.team === 'home' && c.player === p.id && c.type === 'Y').length;
    const rCnt    = state.events.cards.filter(c => c.team === 'home' && c.player === p.id && c.type === 'R').length;
    const dot = document.createElement('div');
    dot.className = 'mini-token mini-home' + (p.highlight ? ' mini-token-highlight' : '');
    dot.style.left = `${pos.left}%`;
    dot.style.top  = `${pos.top}%`;
    dot.title = `クリック=イベント記録 / ドラッグ=位置変更 / 得点${goalCnt} 🟨${yCnt} 🟥${rCnt}`;
    dot.innerHTML = `
      <div class="mini-token-number">${p.number}</div>
      <div class="mini-token-name">${p.name}</div>
      ${(goalCnt || yCnt || rCnt) ? `<div class="mini-event-dot">${goalCnt ? '⚽'+goalCnt : ''}${yCnt ? '🟨'+yCnt : ''}${rCnt ? '🟥'+rCnt : ''}</div>` : ''}
    `;
    attachDragOrClick(
      dot, field,
      () => openHomePlayerEdit(p.id),
      (left, top) => {
        const coord = fromUnifiedHome(left, top);
        slot.x = coord.x;
        slot.y = coord.y;
      }
    );
    field.appendChild(dot);
  });

  // 相手
  awayFieldLayout.forEach((slot) => {
    const p = state.awayTeam.players[slot.idx];
    if (!p) return;
    const pos = toUnifiedAway(slot.x, slot.y);
    const dot = document.createElement('div');
    dot.className = 'mini-token mini-away' + (p.comment ? ' mini-has-comment' : '');
    dot.style.left = `${pos.left}%`;
    dot.style.top  = `${pos.top}%`;
    dot.title = p.comment || 'クリック=編集 / ドラッグ=位置変更';
    dot.innerHTML = `
      <div class="mini-token-number">${p.number}</div>
      <div class="mini-token-name">${p.name}</div>
      ${p.comment ? '<div class="mini-comment-dot">📝</div>' : ''}
    `;
    attachDragOrClick(
      dot, field,
      () => openAwayPlayerEdit(slot.idx),
      (left, top) => {
        const coord = fromUnifiedAway(left, top);
        slot.x = coord.x;
        slot.y = coord.y;
      }
    );
    field.appendChild(dot);
  });
}

/* ===== 味方選手 イベントダイアログ ===== */
function openHomePlayerEdit(pid) {
  document.getElementById('homePlayerId').value = pid;
  const p = homePlayers.find(pp => pp.id === pid);
  document.getElementById('homePlayerModalTitle').textContent =
    p ? `🟢 #${p.number} ${p.name}（${p.pos}）` : '🟢 味方選手 イベント';
  refreshHomePlayerModal();
  openModal('modal-home-player');
}

function refreshHomePlayerModal() {
  const pid = document.getElementById('homePlayerId').value;
  if (!pid) return;
  const goals = state.events.goals.filter(g => g.team === 'home' && g.scorer === pid);
  const ys    = state.events.cards.filter(c => c.team === 'home' && c.player === pid && c.type === 'Y');
  const rs    = state.events.cards.filter(c => c.team === 'home' && c.player === pid && c.type === 'R');
  const subs  = state.events.subs.filter(s => s.team === 'home' && s.out === pid);
  document.getElementById('homePlayerGoalCount').textContent = goals.length;
  document.getElementById('homePlayerYCount').textContent    = ys.length;
  document.getElementById('homePlayerRCount').textContent    = rs.length;
  document.getElementById('homePlayerSubCount').textContent  = subs.length;

  // 最近の記録（時系列）
  const all = [
    ...goals.map(g => ({ time: g.time, label: '⚽ 得点' + (g.note ? `（${g.note}）` : '') })),
    ...ys.map(c    => ({ time: c.time, label: '🟨 イエロー' + (c.note ? `（${c.note}）` : '') })),
    ...rs.map(c    => ({ time: c.time, label: '🟥 レッド' + (c.note ? `（${c.note}）` : '') })),
    ...subs.map(s  => ({ time: s.time, label: `🔄 交代OUT → ${getPlayerDisplay('home', s.in)}` })),
  ].sort((a, b) => a.time - b.time);
  const recent = document.getElementById('homePlayerRecentEvents');
  recent.innerHTML = all.length === 0
    ? '<div style="color:var(--text-muted)">この選手の記録はまだありません</div>'
    : all.map(e => `<div class="home-player-recent-item"><span style="color:var(--neon-yellow);min-width:36px">${e.time}'</span><span>${e.label}</span></div>`).join('');
}

function adjustHomePlayerGoal(delta) {
  const pid = document.getElementById('homePlayerId').value;
  if (!pid) return;
  if (delta > 0) {
    state.events.goals.push({ time: currentMinute(), team: 'home', scorer: pid, assist: '', note: '（ピッチビューから登録）' });
    state.events.goals.sort((a, b) => a.time - b.time);
    state.scoreHome++;
  } else {
    // 最後の該当得点を削除
    for (let i = state.events.goals.length - 1; i >= 0; i--) {
      const g = state.events.goals[i];
      if (g.team === 'home' && g.scorer === pid) {
        state.events.goals.splice(i, 1);
        state.scoreHome = Math.max(0, state.scoreHome - 1);
        break;
      }
    }
  }
  refreshHomePlayerModal();
  updateUI();
}

function adjustHomePlayerCard(type, delta) {
  const pid = document.getElementById('homePlayerId').value;
  if (!pid) return;
  adjustCard('home', pid, type, delta);
  refreshHomePlayerModal();
}

function openSubFromHomePlayer() {
  const pid = document.getElementById('homePlayerId').value;
  if (!pid) return;
  // 交代モーダルを「home + 該当選手をOUT」で開く
  document.getElementById('subTeam').value = 'home';
  // populatePlayerSelects 内で home の場合は starters/bench がセットされる
  const starters = homePlayers.filter(p => p.role === 'starter');
  document.getElementById('subOut').innerHTML = starters.map(p => `<option value="${p.id}">#${p.number} ${p.name}</option>`).join('');
  document.getElementById('subOut').value = pid;
  document.getElementById('subIn').innerHTML = homePlayers.filter(p => p.role === 'bench').map(p => `<option value="${p.id}">#${p.number} ${p.name}</option>`).join('');
  document.getElementById('subTime').value = '';
  document.getElementById('subNote').value = '';
  closeModal('modal-home-player');
  openModal('modal-add-sub');
}

function openAwayPlayerEdit(idx) {
  const p = state.awayTeam.players[idx];
  document.getElementById('awayPlayerIdx').value     = idx;
  document.getElementById('awayPlayerNumber').value  = p.number;
  document.getElementById('awayPlayerName').value    = p.name;
  document.getElementById('awayPlayerPos').value     = p.pos;
  document.getElementById('awayPlayerComment').value = p.comment || '';
  openModal('modal-away-player');
}

function submitAwayPlayer() {
  const idx = parseInt(document.getElementById('awayPlayerIdx').value, 10);
  const p = state.awayTeam.players[idx];
  p.number  = parseInt(document.getElementById('awayPlayerNumber').value, 10) || p.number;
  p.name    = document.getElementById('awayPlayerName').value || p.name;
  p.comment = document.getElementById('awayPlayerComment').value;
  closeModal('modal-away-player');
  renderUnifiedField();
  // 選手選択肢も再構築
  rePopulateGoalScorerByTeam();
  rePopulateCardPlayerByTeam();
}

document.addEventListener('DOMContentLoaded', init);
