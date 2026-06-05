/* ===================================================================
   members.js - メンバー管理画面（サッカー11人制）
     - 16名を1グリッドで表示
     - 背番号付き、カードクリックで編集モーダル
     - 検索 / ポジションフィルタ
   =================================================================== */

const members = [
  /* === スタメン候補 === */
  { number: 10, name: 'ズラタン・イブラヒモビッチ',     pos: 'FW',  posDetail: 'FW',       foot: '右', exp: 21, goals: 45, assists: 12, image: 'Zlatan-Ibrahimovic.jpg' },
  { number:  9, name: 'ディディエ・ドログバ',            pos: 'FW',  posDetail: 'FW',       foot: '右', exp: 18, goals: 38, assists: 10, image: 'DidierDrogba.jpg', admin: true },
  { number: 11, name: 'アリエン・ロッベン',              pos: 'MF',  posDetail: 'MF（右）', foot: '左', exp: 16, goals: 22, assists: 19, image: 'roppen.jpg' },
  { number: 18, name: '吉村 彰吾',                       pos: 'MF',  posDetail: 'MF',       foot: '右', exp: 0, expLabel: '3か月', goals: 8, assists: 14, image: 'yoshimura1.jpeg', editImage: 'yoshimura2.jpeg', bio: '山口さんを倒しておれがERP界のベッケンバウアーになる！', highlight: true },
  { number: 14, name: 'ガレス・ベイル',                  pos: 'MF',  posDetail: 'MF（左）', foot: '左', exp: 14, goals: 24, assists: 15, image: 'bale.jpg' },
  { number:  6, name: 'アンドレス・イニエスタ',          pos: 'MF',  posDetail: 'MF',       foot: '右', exp: 20, goals: 11, assists: 32, image: 'iniesta.jpg' },
  { number:  8, name: 'スティーヴン・ジェラード',        pos: 'MF',  posDetail: 'MF',       foot: '右', exp: 18, goals: 17, assists: 23, image: 'gerade.jpg' },
  { number:  3, name: 'ロベルト・カルロス',              pos: 'DF',  posDetail: 'DF（左）', foot: '左', exp: 19, goals:  9, assists: 18, image: 'roberto.jpg' },
  { number:  2, name: 'マイコン',                        pos: 'DF',  posDetail: 'DF（右）', foot: '右', exp: 15, goals:  4, assists: 12, image: 'maicon.jpg' },
  { number:  5, name: 'カルレス・プジョル',              pos: 'DF',  posDetail: 'DF',       foot: '右', exp: 17, goals:  4, assists:  3, image: 'Carles_Puyol.jpg' },
  { number:  4, name: 'セルヒオ・ラモス',                pos: 'DF',  posDetail: 'DF',       foot: '右', exp: 18, goals: 12, assists:  4, image: 'Ramos.jpg' },
  { number:  1, name: 'ジャンルイジ・ブッフォン',        pos: 'GK',  posDetail: 'GK',       foot: '右', exp: 22, goals:  0, assists:  1, image: 'Buffon.jpg' },

  /* === ベンチメンバー === */
  { number: 30, name: 'リオネル・メッシ',                pos: 'FW',  posDetail: 'FW',       foot: '左', exp: 19, goals: 45, assists: 21, image: 'messi.jpg' },
  { number: 22, name: 'カカ',                            pos: 'MF',  posDetail: 'MF',       foot: '右', exp: 17, goals: 18, assists: 20, image: 'kaka.jpg' },
  { number:  7, name: 'クリスティアーノ・ロナウド',      pos: 'MF',  posDetail: 'MF',       foot: '右', exp: 20, goals: 41, assists: 14, image: 'ronald.jpg' },
  { number: 15, name: 'ジェラール・ピケ',                pos: 'DF',  posDetail: 'DF',       foot: '右', exp: 15, goals:  6, assists:  2, image: 'pike.jpg' },
  { number: 16, name: 'エトヴィン・ファン・デル・サール', pos: 'GK',  posDetail: 'GK',       foot: '右', exp: 21, goals:  0, assists:  0, image: 'saul.jpg' },
];

const memberFilter = { search: '', pos: '' };

function memberCardHtml(m, idx) {
  return `
    <div class="member-card${m.highlight ? ' member-card-highlight' : ''}" data-member-idx="${idx}">
      <div class="member-number">#${m.number}</div>
      <div class="member-avatar">
        ${m.image ? `<img src="image/${m.image}" alt="${m.name}" loading="lazy">` : `<div class="member-avatar-placeholder">${m.name.charAt(0)}</div>`}
        ${m.admin ? '<div class="member-role-admin-dot" title="管理者"></div>' : ''}
      </div>
      <div class="member-name">${m.name}${m.admin ? '<span class="member-role-admin"></span>' : ''}</div>
      <div class="member-pos">${m.posDetail}</div>
      <div class="member-stats">
        <div class="member-stat"><div class="member-stat-val">${m.goals}</div><div class="member-stat-lbl">得点</div></div>
        <div class="member-stat"><div class="member-stat-val">${m.assists}</div><div class="member-stat-lbl">アシスト</div></div>
        <div class="member-stat"><div class="member-stat-val">${m.expLabel || m.exp}</div><div class="member-stat-lbl">${m.expLabel ? '経歴' : '経験年'}</div></div>
      </div>
    </div>
  `;
}

function memberMatches(m, q) {
  const hay = `${m.name} ${m.pos} ${m.posDetail} ${m.foot} #${m.number}`.toLowerCase();
  return hay.includes(q.toLowerCase());
}

function applyFilters() {
  return members
    .map((m, idx) => ({ m, idx }))
    .filter(({ m }) => {
      if (memberFilter.pos && m.pos !== memberFilter.pos) return false;
      if (memberFilter.search.trim() && !memberMatches(m, memberFilter.search.trim())) return false;
      return true;
    });
}

function renderMembers() {
  const root = document.getElementById('membersGrid');
  if (!root) return;

  const filtered = applyFilters();
  const isFiltered = memberFilter.search.trim() || memberFilter.pos;

  if (filtered.length === 0) {
    root.innerHTML = `
      <div class="member-empty">
        <div class="member-empty-icon">🔍</div>
        <div class="member-empty-text">該当するメンバーが見つかりませんでした</div>
        <button class="btn btn-outline" onclick="clearMemberFilters()">フィルタをクリア</button>
      </div>
    `;
    return;
  }

  root.innerHTML = `
    <div class="member-section">
      <div class="member-section-header">
        <span class="member-section-title">メンバー</span>
        <span class="member-section-count">${filtered.length}名${isFiltered ? ` / ${members.length}名中` : ''}</span>
      </div>
      <div class="members-grid">
        ${filtered.map(({ m, idx }) => memberCardHtml(m, idx)).join('')}
      </div>
    </div>
  `;

  // カードクリックで編集モーダル
  root.querySelectorAll('.member-card').forEach(card => {
    card.addEventListener('click', () => {
      const idx = parseInt(card.dataset.memberIdx, 10);
      openMemberEdit(idx);
    });
  });
}

function clearMemberFilters() {
  memberFilter.search = '';
  memberFilter.pos = '';
  const s = document.getElementById('memberSearch');    if (s) s.value = '';
  const p = document.getElementById('memberPosFilter'); if (p) p.value = '';
  renderMembers();
}

/* === メンバー編集モーダル === */
function openMemberEdit(idx) {
  const m = members[idx];
  if (!m) return;
  document.getElementById('editMemberIdx').value      = idx;
  document.getElementById('editMemberName').value     = m.name;
  document.getElementById('editMemberNumber').value   = m.number;
  document.getElementById('editMemberPos').value      = m.pos;
  document.getElementById('editMemberPosDetail').value= m.posDetail;
  document.getElementById('editMemberFoot').value     = m.foot === '右' ? '右足' : (m.foot === '左' ? '左足' : '両足');
  // 経験年: expLabel があれば文字列表示用 (input type=text に切替)
  const expInput = document.getElementById('editMemberExp');
  if (m.expLabel) {
    expInput.type = 'text';
    expInput.value = m.expLabel;
  } else {
    expInput.type = 'number';
    expInput.value = m.exp;
  }
  document.getElementById('editMemberGoals').value    = m.goals;
  document.getElementById('editMemberAssists').value  = m.assists;
  document.getElementById('editMemberAdmin').checked  = !!m.admin;
  document.getElementById('editMemberBio').value      = m.bio || '';

  // プレビュー画像 (編集用に editImage 優先、なければ image)
  const previewImg = document.getElementById('editMemberPreview');
  const displayImg = m.editImage || m.image;
  if (displayImg) {
    previewImg.src = 'image/' + displayImg;
    previewImg.style.display = '';
    const ph = document.getElementById('editMemberPreviewPh');
    if (ph) ph.style.display = 'none';
  } else {
    previewImg.style.display = 'none';
    let ph = document.getElementById('editMemberPreviewPh');
    if (!ph) {
      ph = document.createElement('div');
      ph.id = 'editMemberPreviewPh';
      ph.className = 'edit-member-placeholder';
      previewImg.parentElement.appendChild(ph);
    }
    ph.textContent = m.name.charAt(0);
    ph.style.display = '';
  }

  // モーダル全体のピンク強調切替
  const modalEl = document.querySelector('#modal-edit-member .modal');
  if (modalEl) modalEl.classList.toggle('modal-highlight', !!m.highlight);

  document.getElementById('editMemberTitle').textContent = `${m.name} の編集`;
  openModal('modal-edit-member');
}

/* === メンバー画像変更（プレビュー用） === */
function onEditMemberImageChange(e) {
  const file = e.target.files && e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = ev => {
    const previewImg = document.getElementById('editMemberPreview');
    previewImg.src = ev.target.result;
    previewImg.style.display = '';
    const ph = document.getElementById('editMemberPreviewPh');
    if (ph) ph.style.display = 'none';
  };
  reader.readAsDataURL(file);
  // 同じファイルを再選択できるようにinputをリセット
  e.target.value = '';
}

document.addEventListener('DOMContentLoaded', () => {
  const search = document.getElementById('memberSearch');
  const posSel = document.getElementById('memberPosFilter');

  if (search) {
    search.addEventListener('input', e => {
      memberFilter.search = e.target.value;
      renderMembers();
    });
  }
  if (posSel) {
    posSel.addEventListener('change', e => {
      memberFilter.pos = e.target.value;
      renderMembers();
    });
  }

  renderMembers();
});
