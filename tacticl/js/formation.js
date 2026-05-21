/* ===================================================================
   formation.js - フォーメーション画面（サッカー11人制）
     - デフォルト 横向き
     - 4プリセット
     - フィールド選手クリックで選手詳細ダイアログ
     - 控え→フィールドドロップで「その場で」選手交代（座標を維持）
     - フォーメーション①〜③ 保存・読込
   =================================================================== */

const slotLayouts = {
  '4-4-2': [
    { x: 50, y: 92, role: 'GK', pos: 'GK' },
    { x: 12, y: 75, role: 'DF', pos: 'DF' },
    { x: 38, y: 78, role: 'DF', pos: 'DF' },
    { x: 62, y: 78, role: 'DF', pos: 'DF' },
    { x: 88, y: 75, role: 'DF', pos: 'DF' },
    { x: 12, y: 50, role: 'MF', pos: 'MF' },
    { x: 38, y: 53, role: 'MF', pos: 'MF' },
    { x: 62, y: 53, role: 'MF', pos: 'MF' },
    { x: 88, y: 50, role: 'MF', pos: 'MF' },
    { x: 35, y: 22, role: 'FW', pos: 'FW' },
    { x: 65, y: 22, role: 'FW', pos: 'FW' },
  ],
  '4-3-3': [
    { x: 50, y: 92, role: 'GK', pos: 'GK' },
    { x: 12, y: 75, role: 'DF', pos: 'DF' },
    { x: 38, y: 78, role: 'DF', pos: 'DF' },
    { x: 62, y: 78, role: 'DF', pos: 'DF' },
    { x: 88, y: 75, role: 'DF', pos: 'DF' },
    { x: 25, y: 50, role: 'MF', pos: 'MF' },
    { x: 50, y: 55, role: 'MF', pos: 'MF' },
    { x: 75, y: 50, role: 'MF', pos: 'MF' },
    { x: 15, y: 22, role: 'FW', pos: 'LWG' },
    { x: 50, y: 16, role: 'FW', pos: 'CF' },
    { x: 85, y: 22, role: 'FW', pos: 'RWG' },
  ],
  '3-5-2': [
    { x: 50, y: 92, role: 'GK', pos: 'GK' },
    { x: 25, y: 78, role: 'DF', pos: 'DF' },
    { x: 50, y: 80, role: 'DF', pos: 'DF' },
    { x: 75, y: 78, role: 'DF', pos: 'DF' },
    { x: 10, y: 50, role: 'MF', pos: 'WB' },
    { x: 30, y: 55, role: 'MF', pos: 'MF' },
    { x: 50, y: 58, role: 'MF', pos: 'MF' },
    { x: 70, y: 55, role: 'MF', pos: 'MF' },
    { x: 90, y: 50, role: 'MF', pos: 'WB' },
    { x: 35, y: 22, role: 'FW', pos: 'FW' },
    { x: 65, y: 22, role: 'FW', pos: 'FW' },
  ],
  '4-2-3-1': [
    { x: 50, y: 92, role: 'GK', pos: 'GK' },
    { x: 12, y: 75, role: 'DF', pos: 'DF' },
    { x: 38, y: 78, role: 'DF', pos: 'DF' },
    { x: 62, y: 78, role: 'DF', pos: 'DF' },
    { x: 88, y: 75, role: 'DF', pos: 'DF' },
    { x: 35, y: 58, role: 'MF', pos: 'DMF' },
    { x: 65, y: 58, role: 'MF', pos: 'DMF' },
    { x: 20, y: 35, role: 'MF', pos: 'AMF' },
    { x: 50, y: 32, role: 'MF', pos: 'AMF' },
    { x: 80, y: 35, role: 'MF', pos: 'AMF' },
    { x: 50, y: 14, role: 'FW', pos: 'CF' },
  ],
};

/* 選手マスタ */
const formationPlayers = {
  ibrahimovic: { number: 10, name: 'イブラヒモビッチ', image: 'Zlatan-Ibrahimovic.jpg', role: 'FW' },
  drogba:      { number:  9, name: 'ドログバ',         image: 'DidierDrogba.jpg',       role: 'FW' },
  robben:      { number: 11, name: 'ロッベン',         image: 'roppen.jpg',             role: 'MF' },
  yoshimura:   { number: 18, name: '吉村 彰吾',         image: 'yoshimura1.jpeg',        role: 'MF', highlight: true },
  bale:        { number: 14, name: 'ベイル',           image: 'bale.jpg',               role: 'MF' },
  iniesta:     { number:  6, name: 'イニエスタ',       image: 'iniesta.jpg',            role: 'MF' },
  gerrard:     { number:  8, name: 'ジェラード',       image: 'gerade.jpg',             role: 'MF' },
  roberto:     { number:  3, name: 'ロベルト・カルロス', image: 'roberto.jpg',           role: 'DF' },
  maicon:      { number:  2, name: 'マイコン',         image: 'maicon.jpg',             role: 'DF' },
  puyol:       { number:  5, name: 'プジョル',         image: 'Carles_Puyol.jpg',       role: 'DF' },
  ramos:       { number:  4, name: 'ラモス',           image: 'Ramos.jpg',              role: 'DF' },
  buffon:      { number:  1, name: 'ブッフォン',       image: 'Buffon.jpg',             role: 'GK' },
  messi:       { number: 30, name: 'メッシ',           image: 'messi.jpg',              role: 'FW' },
  kaka:        { number: 22, name: 'カカ',             image: 'kaka.jpg',               role: 'MF' },
  ronaldo:     { number:  7, name: 'C.ロナウド',       image: 'ronald.jpg',             role: 'MF' },
  pique:       { number: 15, name: 'ピケ',             image: 'pike.jpg',               role: 'DF' },
  vandersar:   { number: 16, name: 'V.デル・サール',   image: 'saul.jpg',               role: 'GK' },
};

/* 初期スタメン: ジェラード → 吉村 にスワップ */
let starterIds = [
  'buffon','roberto','puyol','ramos','maicon',
  'bale','iniesta','yoshimura','robben',
  'drogba','ibrahimovic',
];
/* ベンチ: ジェラードを追加 */
let benchIds = ['gerrard', 'messi', 'kaka', 'ronaldo', 'pique', 'vandersar'];

let currentFormation = '4-4-2';
let savedFormations = [null, null, null];
// ★ デフォルト: PC(>768px)は横、スマホは縦
let fieldOrientation = (typeof window !== 'undefined' && window.innerWidth <= 768) ? 'portrait' : 'landscape';

try {
  const stored = JSON.parse(localStorage.getItem('tacticl_saved_formations') || 'null');
  if (Array.isArray(stored) && stored.length === 3) savedFormations = stored;
  const ori = localStorage.getItem('tacticl_field_orientation');
  if (ori === 'landscape' || ori === 'portrait') fieldOrientation = ori;
} catch (e) {}

function setFormation(name, btn) {
  currentFormation = name;
  document.querySelectorAll('.preset-btn').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  renderFormation();
}

function toggleOrientation(mode) {
  fieldOrientation = mode;
  try { localStorage.setItem('tacticl_field_orientation', mode); } catch(e) {}
  document.querySelectorAll('.orient-btn').forEach(b => b.classList.toggle('active', b.dataset.orient === mode));
  renderFormation();
}

function projectCoords(x, y) {
  if (fieldOrientation === 'landscape') {
    return { x: 100 - y, y: x };
  }
  return { x, y };
}

function playerTokenHtml(player) {
  if (player.image) {
    return `<img src="image/${player.image}" alt="${player.name}" loading="lazy" draggable="false">`;
  }
  return `<div class="player-token-ph">${player.name.charAt(0)}</div>`;
}

function renderFormation() {
  const field = document.getElementById('soccerField');
  if (!field) return;

  field.classList.toggle('landscape', fieldOrientation === 'landscape');
  field.querySelectorAll('.player-token').forEach(t => t.remove());

  const slots = slotLayouts[currentFormation];
  if (!slots) return;
  slots.forEach((slot, slotIdx) => {
    const playerId = starterIds[slotIdx];
    const player = formationPlayers[playerId];
    if (!player) return;

    const coords = projectCoords(slot.x, slot.y);
    const token = document.createElement('div');
    token.className = 'player-token' + (player.highlight ? ' token-highlight' : '');
    token.dataset.slotIdx = slotIdx;
    token.dataset.playerId = playerId;
    token.style.left = `${coords.x}%`;
    token.style.top  = `${coords.y}%`;
    token.innerHTML = `
      ${playerTokenHtml(player)}
      <div class="player-name-label">#${player.number} ${player.name}</div>
      <div class="pos-label">${slot.pos}</div>
    `;

    makeDraggable(token, field);
    makeDropTarget(token);
    makeClickable(token);
    field.appendChild(token);
  });

  renderBench();
  renderSavedSlots();
}

function renderBench() {
  const benchDiv = document.getElementById('benchPlayers');
  if (!benchDiv) return;
  benchDiv.innerHTML = `
    <div class="bench-hint">⤵ ドラッグでスタメンと交代</div>
    ${benchIds.map((id, i) => {
      const p = formationPlayers[id];
      return `
        <div class="bench-player${p.highlight ? ' bench-player-highlight' : ''}" draggable="true" data-bench-idx="${i}" data-player-id="${id}">
          <div class="bench-avatar">${p.image ? `<img src="image/${p.image}" alt="${p.name}" loading="lazy" draggable="false">` : `<div class="bench-avatar-ph">${p.name.charAt(0)}</div>`}</div>
          <div class="bench-info">
            <div class="bench-name">#${p.number} ${p.name}</div>
            <div class="bench-pos">${p.role}</div>
          </div>
          <div class="bench-drag-icon">⋮⋮</div>
        </div>
      `;
    }).join('')}
  `;

  benchDiv.querySelectorAll('.bench-player').forEach(el => {
    el.addEventListener('dragstart', e => {
      e.dataTransfer.setData('text/plain', el.dataset.benchIdx);
      e.dataTransfer.effectAllowed = 'move';
      el.classList.add('dragging-bench');
    });
    el.addEventListener('dragend', () => {
      el.classList.remove('dragging-bench');
      document.querySelectorAll('.player-token.drop-target').forEach(t => t.classList.remove('drop-target'));
    });
  });
}

function renderSavedSlots() {
  const wrap = document.getElementById('savedFormations');
  if (!wrap) return;
  wrap.innerHTML = [0,1,2].map(i => {
    const s = savedFormations[i];
    const hasData = !!s;
    const sub = hasData ? `${s.name} ・ ${new Date(s.savedAt).toLocaleDateString('ja-JP')}` : '未保存';
    return `
      <div class="saved-slot ${hasData ? 'filled' : ''}">
        <div class="saved-slot-label">フォーメーション${['①','②','③'][i]}</div>
        <div class="saved-slot-sub">${sub}</div>
        <div class="saved-slot-actions">
          <button class="btn btn-outline" style="font-size:11px;padding:4px 10px" onclick="loadFormationSlot(${i})" ${hasData ? '' : 'disabled'}>読込</button>
          <button class="btn btn-primary" style="font-size:11px;padding:4px 10px" onclick="saveFormationSlot(${i})">保存</button>
        </div>
      </div>
    `;
  }).join('');
}

function saveFormationSlot(idx) {
  savedFormations[idx] = {
    name: currentFormation,
    starterIds: [...starterIds],
    benchIds: [...benchIds],
    savedAt: Date.now(),
  };
  try { localStorage.setItem('tacticl_saved_formations', JSON.stringify(savedFormations)); } catch(e) {}
  renderSavedSlots();
  flashSubstitution(`フォーメーション${['①','②','③'][idx]} に保存しました`);
}

function loadFormationSlot(idx) {
  const s = savedFormations[idx];
  if (!s) return;
  currentFormation = s.name;
  starterIds = [...s.starterIds];
  benchIds = [...s.benchIds];
  document.querySelectorAll('.preset-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.fname === currentFormation);
  });
  renderFormation();
  flashSubstitution(`フォーメーション${['①','②','③'][idx]} を読み込みました`);
}

/* === D&D で「その場で」選手交代（座標維持） === */
function makeDropTarget(token) {
  token.addEventListener('dragover', e => {
    if (e.dataTransfer.types.includes('text/plain')) {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      token.classList.add('drop-target');
    }
  });
  token.addEventListener('dragleave', () => token.classList.remove('drop-target'));
  token.addEventListener('drop', e => {
    e.preventDefault();
    const benchIdx = parseInt(e.dataTransfer.getData('text/plain'), 10);
    const slotIdx  = parseInt(token.dataset.slotIdx, 10);
    if (isNaN(benchIdx) || isNaN(slotIdx)) return;

    const outId = starterIds[slotIdx];
    const inId  = benchIds[benchIdx];
    starterIds[slotIdx] = inId;
    benchIds[benchIdx]  = outId;

    // ★ token を再生成せず、その場で中身を差し替え（座標維持）
    const newPlayer = formationPlayers[inId];
    token.classList.remove('drop-target');
    token.classList.toggle('token-highlight', !!newPlayer.highlight);
    token.dataset.playerId = inId;

    // 既存の name-label / pos-label を取得
    const nameEl = token.querySelector('.player-name-label');
    const posEl  = token.querySelector('.pos-label');
    if (nameEl) nameEl.textContent = `#${newPlayer.number} ${newPlayer.name}`;

    // img/placeholder を入れ替え
    const oldImg = token.querySelector('img, .player-token-ph');
    if (oldImg) oldImg.remove();
    const refNode = nameEl || posEl;
    if (newPlayer.image) {
      const img = document.createElement('img');
      img.src = `image/${newPlayer.image}`;
      img.alt = newPlayer.name;
      img.loading = 'lazy';
      img.draggable = false;
      token.insertBefore(img, refNode || null);
    } else {
      const ph = document.createElement('div');
      ph.className = 'player-token-ph';
      ph.textContent = newPlayer.name.charAt(0);
      token.insertBefore(ph, refNode || null);
    }

    renderBench();

    const outP = formationPlayers[outId];
    flashSubstitution(`${outP.name} OUT  →  ${newPlayer.name} IN`);
  });
}

/* === トークンクリックで選手詳細モーダル === */
function makeClickable(token) {
  // ドラッグ完了の判別のため、mousedown/up 間で大きく動いた場合はクリック扱いにしない
  let downX = 0, downY = 0, moved = false;
  token.addEventListener('mousedown', e => {
    downX = e.clientX; downY = e.clientY; moved = false;
  });
  token.addEventListener('mousemove', e => {
    if (Math.abs(e.clientX - downX) > 3 || Math.abs(e.clientY - downY) > 3) moved = true;
  });
  token.addEventListener('click', e => {
    if (moved) return;
    const pid = token.dataset.playerId;
    openPlayerDetail(pid);
  });
}

function openPlayerDetail(playerId) {
  const p = formationPlayers[playerId];
  if (!p) return;
  const slotIdx = starterIds.indexOf(playerId);
  const slot = slotLayouts[currentFormation][slotIdx] || {};

  document.getElementById('playerDetailBody').innerHTML = `
    <div class="player-detail">
      <div class="player-detail-top">
        <div class="player-detail-avatar${p.highlight ? ' player-detail-avatar-highlight' : ''}">
          ${p.image ? `<img src="image/${p.image}" alt="${p.name}">` : `<div class="player-detail-ph">${p.name.charAt(0)}</div>`}
        </div>
        <div class="player-detail-info">
          <div class="player-detail-number">#${p.number}</div>
          <div class="player-detail-name">${p.name}</div>
          <div class="player-detail-pos">${slot.pos || p.role} ・ ${p.role}</div>
        </div>
      </div>

      <div class="player-detail-grid">
        <div class="player-detail-row"><div class="player-detail-label">スロット</div><div class="player-detail-value">${slotIdx + 1} / 11</div></div>
        <div class="player-detail-row"><div class="player-detail-label">配置ポジション</div><div class="player-detail-value">${slot.pos || '-'}</div></div>
        <div class="player-detail-row"><div class="player-detail-label">役割カテゴリ</div><div class="player-detail-value">${p.role}</div></div>
        <div class="player-detail-row"><div class="player-detail-label">フォーメーション</div><div class="player-detail-value">${currentFormation}</div></div>
      </div>

      <div class="player-detail-actions">
        <a class="btn btn-outline" href="members.html" style="text-decoration:none">📇 メンバー管理で詳細編集</a>
      </div>
    </div>
  `;
  openModal('modal-player-detail');
}

function flashSubstitution(msg) {
  let toast = document.getElementById('substToast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'substToast';
    toast.className = 'subst-toast';
    document.body.appendChild(toast);
  }
  toast.textContent = '🔄 ' + msg;
  toast.classList.add('show');
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => toast.classList.remove('show'), 2200);
}

function makeDraggable(token, field) {
  let startX, startY, initLeft, initTop, dragging = false;

  token.addEventListener('mousedown', e => {
    dragging = true;
    token.classList.add('dragging');
    startX = e.clientX; startY = e.clientY;
    initLeft = parseFloat(token.style.left);
    initTop = parseFloat(token.style.top);
    e.preventDefault();
  });

  token.addEventListener('touchstart', e => {
    dragging = true;
    token.classList.add('dragging');
    const t = e.touches[0];
    startX = t.clientX; startY = t.clientY;
    initLeft = parseFloat(token.style.left);
    initTop = parseFloat(token.style.top);
  }, { passive: true });

  document.addEventListener('mousemove', e => {
    if (!dragging) return;
    const fRect = field.getBoundingClientRect();
    const dx = (e.clientX - startX) / fRect.width * 100;
    const dy = (e.clientY - startY) / fRect.height * 100;
    token.style.left = Math.max(5, Math.min(95, initLeft + dx)) + '%';
    token.style.top  = Math.max(5, Math.min(95, initTop + dy)) + '%';
  });

  document.addEventListener('touchmove', e => {
    if (!dragging) return;
    const fRect = field.getBoundingClientRect();
    const t = e.touches[0];
    const dx = (t.clientX - startX) / fRect.width * 100;
    const dy = (t.clientY - startY) / fRect.height * 100;
    token.style.left = Math.max(5, Math.min(95, initLeft + dx)) + '%';
    token.style.top  = Math.max(5, Math.min(95, initTop + dy)) + '%';
  }, { passive: true });

  const stopDrag = () => { dragging = false; token.classList.remove('dragging'); };
  document.addEventListener('mouseup', stopDrag);
  document.addEventListener('touchend', stopDrag);
}

function clearFormation() {
  starterIds = ['buffon','roberto','puyol','ramos','maicon','bale','iniesta','yoshimura','robben','drogba','ibrahimovic'];
  benchIds = ['gerrard','messi','kaka','ronaldo','pique','vandersar'];
  renderFormation();
  flashSubstitution('スタメンを初期化しました');
}

function saveFormation() {
  saveFormationSlot(0);
}

function toggleCard(headerEl) {
  const card = headerEl.closest('.f-card-collapsible');
  if (!card) return;
  card.classList.toggle('collapsed');
}

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.orient-btn').forEach(b => b.classList.toggle('active', b.dataset.orient === fieldOrientation));
  renderFormation();
});
