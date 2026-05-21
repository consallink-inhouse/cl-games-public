/* ===================================================================
   records.js - 成績管理画面（ランキング / 試合履歴 / 試合詳細）
   =================================================================== */

const goalRankers = [
  { name: 'ズラタン・イブラヒモビッチ',   team: 'CLFC', val: 45, image: 'Zlatan-Ibrahimovic.jpg' },
  { name: 'クリスティアーノ・ロナウド',   team: 'CLFC', val: 41, image: 'ronald.jpg' },
  { name: 'ディディエ・ドログバ',         team: 'CLFC', val: 38, image: 'DidierDrogba.jpg' },
  { name: 'リオネル・メッシ',             team: 'CLFC', val: 45, image: 'messi.jpg' },
  { name: 'ガレス・ベイル',               team: 'CLFC', val: 24, image: 'bale.jpg' },
];
goalRankers.sort((a, b) => b.val - a.val);

const assistRankers = [
  { name: 'アンドレス・イニエスタ',         team: 'CLFC', val: 32, image: 'iniesta.jpg' },
  { name: 'スティーヴン・ジェラード',       team: 'CLFC', val: 23, image: 'gerade.jpg' },
  { name: 'リオネル・メッシ',               team: 'CLFC', val: 21, image: 'messi.jpg' },
  { name: 'カカ',                           team: 'CLFC', val: 20, image: 'kaka.jpg' },
  { name: 'アリエン・ロッベン',             team: 'CLFC', val: 19, image: 'roppen.jpg' },
];
assistRankers.sort((a, b) => b.val - a.val);

const rankClasses = ['rank-1', 'rank-2', 'rank-3', 'rank-other', 'rank-other'];

function renderRanking(data, containerId) {
  const el = document.getElementById(containerId);
  if (!el) return;
  el.innerHTML = data.map((r, i) => `
    <div class="ranking-item">
      <div class="rank-num ${rankClasses[i]}">${i < 3 ? ['🥇','🥈','🥉'][i] : i+1}</div>
      <div class="rank-avatar"><img src="image/${r.image}" alt="${r.name}" loading="lazy"></div>
      <div class="rank-info"><div class="rank-name">${r.name}</div><div class="rank-team">${r.team}</div></div>
      <div class="rank-val">${r.val}</div>
    </div>
  `).join('');
}

const matchHistory = [
  {
    date: '2025-01-19', opp: '横浜キッカーズ', score: '3-1', result: '勝',
    location: '駒沢オリンピック公園',
    homeAway: 'ホーム',
    formation: '4-4-2',
    goals: [
      { time: '12\'', team: 'home', scorer: 'ドログバ',         assist: 'イニエスタ' },
      { time: '34\'', team: 'away', scorer: '山田 一郎',       assist: '—' },
      { time: '58\'', team: 'home', scorer: 'ベイル',           assist: 'ロベルト・カルロス' },
      { time: '82\'', team: 'home', scorer: 'イブラヒモビッチ', assist: 'ロッベン' },
    ],
    mom: 'イブラヒモビッチ',
    note: '前半から積極的な高プレスで主導権を握り、サイドからの崩しで複数得点を奪った。'
  },
  {
    date: '2025-01-12', opp: 'SportsWorks United', score: '1-2', result: '敗',
    location: '横浜国際フットボールパーク',
    homeAway: 'アウェイ',
    formation: '4-3-3',
    goals: [
      { time: '23\'', team: 'away', scorer: '木村 翔太',       assist: '—' },
      { time: '47\'', team: 'home', scorer: 'メッシ',           assist: 'イニエスタ' },
      { time: '78\'', team: 'away', scorer: '木村 翔太',       assist: '—' },
    ],
    mom: 'イニエスタ',
    note: '相手のJFL経験者にやられる形に。守備の連携課題が浮き彫りになった一戦。'
  },
  {
    date: '2025-01-08', opp: 'BizSports FC', score: '4-0', result: '勝',
    location: '渋谷区民グラウンド',
    homeAway: 'ホーム',
    formation: '4-4-2',
    goals: [
      { time: '08\'', team: 'home', scorer: 'ロッベン',         assist: 'ベイル' },
      { time: '25\'', team: 'home', scorer: 'ベイル',           assist: 'ロッベン' },
      { time: '50\'', team: 'home', scorer: 'メッシ',           assist: '—' },
      { time: '72\'', team: 'home', scorer: 'ドログバ',         assist: 'イニエスタ' },
    ],
    mom: 'ロッベン',
    note: '両サイドの突破が冴え渡った完勝。GK ブッフォンの好セーブも光った。'
  },
  {
    date: '2024-12-22', opp: 'Tokyo Reds FC', score: '2-2', result: '分',
    location: '駒沢オリンピック公園',
    homeAway: 'ホーム',
    formation: '4-2-3-1',
    goals: [
      { time: '15\'', team: 'home', scorer: 'イブラヒモビッチ', assist: '—' },
      { time: '37\'', team: 'away', scorer: '高橋 拓海',       assist: '—' },
      { time: '63\'', team: 'home', scorer: 'ベイル',           assist: 'ジェラード' },
      { time: '90+2\'', team: 'away', scorer: '高橋 拓海',     assist: '—' },
    ],
    mom: 'イブラヒモビッチ',
    note: 'アディショナルタイムの失点で痛い引き分け。終盤の集中力が今後の課題。'
  },
  {
    date: '2024-12-15', opp: '名古屋 OB ユナイテッド', score: '5-1', result: '勝',
    location: '渋谷区民グラウンド',
    homeAway: 'ホーム',
    formation: '4-3-3',
    goals: [
      { time: '05\'', team: 'home', scorer: 'メッシ',           assist: '—' },
      { time: '21\'', team: 'home', scorer: 'ドログバ',         assist: 'メッシ' },
      { time: '40\'', team: 'away', scorer: '佐々木 健',       assist: '—' },
      { time: '55\'', team: 'home', scorer: 'ベイル',           assist: 'ロッベン' },
      { time: '67\'', team: 'home', scorer: 'メッシ',           assist: 'イニエスタ' },
      { time: '88\'', team: 'home', scorer: 'C.ロナウド',       assist: 'ベイル' },
    ],
    mom: 'メッシ',
    note: '攻撃陣が爆発した試合。連動した動きから多彩な得点パターンを披露。'
  },
];

function renderMatchHistory() {
  const el = document.getElementById('matchHistory');
  if (!el) return;
  const colors = { '勝': 'var(--neon-green)', '敗': '#ff8080', '分': 'var(--neon-yellow)' };
  el.innerHTML = matchHistory.map((m, i) => `
    <div class="match-row" data-match-idx="${i}">
      <div class="match-row-date">${m.date}</div>
      <div class="match-row-opp">vs ${m.opp}<span class="match-row-tag">${m.homeAway}</span></div>
      <div class="match-row-score">${m.score}</div>
      <div class="match-row-result" style="color:${colors[m.result]}">${m.result}</div>
      <div class="match-row-chevron">›</div>
    </div>
  `).join('');

  el.querySelectorAll('.match-row').forEach(row => {
    row.addEventListener('click', () => {
      const idx = parseInt(row.dataset.matchIdx, 10);
      openMatchDetail(idx);
    });
  });
}

function openMatchDetail(idx) {
  const m = matchHistory[idx];
  if (!m) return;
  const resultColor = { '勝': 'var(--neon-green)', '敗': '#ff8080', '分': 'var(--neon-yellow)' }[m.result];
  const [homeScore, awayScore] = m.score.split('-');

  document.getElementById('matchDetailBody').innerHTML = `
    <div class="match-detail">
      <div class="match-detail-header">
        <div class="match-detail-result" style="color:${resultColor}">${m.result === '勝' ? '勝利' : m.result === '敗' ? '敗北' : '引分'}</div>
        <div class="match-detail-date">${m.date} ・ ${m.homeAway}試合</div>
      </div>

      <div class="match-detail-scoreboard">
        <div class="match-side">
          <div class="match-side-label">CLFC</div>
          <div class="match-side-score">${homeScore}</div>
        </div>
        <div class="match-vs">VS</div>
        <div class="match-side">
          <div class="match-side-label">${m.opp}</div>
          <div class="match-side-score">${awayScore}</div>
        </div>
      </div>

      <div class="match-detail-grid">
        <div class="match-detail-row"><div class="match-detail-label">📍 場所</div>      <div class="match-detail-value">${m.location}</div></div>
        <div class="match-detail-row"><div class="match-detail-label">⚙ フォーメーション</div><div class="match-detail-value">${m.formation}</div></div>
        <div class="match-detail-row"><div class="match-detail-label">⭐ MVP</div>        <div class="match-detail-value">${m.mom}</div></div>
      </div>

      <div class="match-detail-section">
        <div class="match-detail-section-title">⚽ 得点ログ</div>
        <div class="match-goals-list">
          ${m.goals.map(g => `
            <div class="match-goal-row ${g.team === 'home' ? 'goal-home' : 'goal-away'}">
              <div class="match-goal-time">${g.time}</div>
              <div class="match-goal-team">${g.team === 'home' ? 'コンサルリンク' : m.opp}</div>
              <div class="match-goal-scorer">⚽ ${g.scorer}</div>
              <div class="match-goal-assist">${g.assist === '—' ? '' : 'A: ' + g.assist}</div>
            </div>
          `).join('')}
        </div>
      </div>

      <div class="match-detail-section">
        <div class="match-detail-section-title">📝 試合レビュー</div>
        <div class="match-detail-note">${m.note}</div>
      </div>
    </div>
  `;
  openModal('modal-match-detail');
}

document.addEventListener('DOMContentLoaded', () => {
  renderRanking(goalRankers, 'goalRanking');
  renderRanking(assistRankers, 'assistRanking');
  renderMatchHistory();
});
