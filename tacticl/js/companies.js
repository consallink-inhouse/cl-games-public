/* ===================================================================
   companies.js - チーム一覧
     - 社会人サッカークラブの一覧 + 詳細モーダル
   =================================================================== */

const companies = [
  { name: 'DigitalForce FC',      area: '東京都',   prefecture: '東京都新宿区',   level: 'mid',      wins: 22, losses: 8,  draws: 4, logo: 'DF', color: '#00cc6a', category: '社会人クラブ', founded: 2019, captain: '中村 拓也',   homeCourt: '新宿スポーツセンター',         following: true,  description: '都内の社会人サッカークラブ。攻撃的なスタイルでテンポの良いパスサッカーが特徴。' },
  { name: 'SportsWorks United',   area: '神奈川県', prefecture: '神奈川県横浜市', level: 'pro',      wins: 30, losses: 5,  draws: 3, logo: 'SW', color: '#0099cc', category: '社会人クラブ', founded: 2015, captain: '木村 翔太',   homeCourt: '横浜国際フットボールパーク',   following: false, description: '神奈川を拠点とする強豪クラブ。プロ・JFL経験者を多数擁するハイレベルチーム。' },
  { name: 'BizSports FC',         area: '東京都',   prefecture: '東京都品川区',   level: 'beginner', wins: 8,  losses: 12, draws: 6, logo: 'BS', color: '#cc6600', category: '企業チーム',   founded: 2022, captain: '加藤 直樹',   homeCourt: '品川区民グラウンド',           following: true,  description: '社員交流促進を目的に発足したチーム。初心者歓迎の和気あいあいとした雰囲気。' },
  { name: '横浜キッカーズ',        area: '神奈川県', prefecture: '神奈川県横浜市', level: 'mid',      wins: 18, losses: 10, draws: 5, logo: 'YK', color: '#8800cc', category: '地域リーグ',   founded: 2017, captain: '山田 一郎',   homeCourt: '日産フィールド小机',           following: false, description: '横浜市民で構成される地域密着型クラブ。週末リーグで活発に活動中。' },
  { name: 'Tokyo Reds FC',        area: '東京都',   prefecture: '東京都港区',     level: 'pro',      wins: 25, losses: 6,  draws: 4, logo: 'TR', color: '#cc0044', category: '社会人クラブ', founded: 2018, captain: '高橋 拓海',   homeCourt: '駒沢オリンピック公園',         following: false, description: '都内 top クラスの社会人クラブ。年間複数大会で優勝経験あり。' },
  { name: '名古屋 OB ユナイテッド', area: '愛知県',   prefecture: '愛知県名古屋市', level: 'beginner', wins: 5,  losses: 15, draws: 4, logo: 'NU', color: '#447700', category: '大学OB',       founded: 2024, captain: '佐々木 健', homeCourt: '名古屋市瑞穂公園陸上競技場',   following: false, description: '名古屋の大学OBで構成されたばかりの新興クラブ。楽しさ重視の活動方針。' },
];

const levelLabel = { beginner: '初心者歓迎', mid: '中級者', pro: '上級者' };
const levelClass = { beginner: 'level-beginner', mid: 'level-mid', pro: 'level-pro' };

function renderCompanies() {
  const grid = document.getElementById('companiesGrid');
  if (!grid) return;
  grid.innerHTML = companies.map((c, i) => {
    const total = c.wins + c.losses + c.draws;
    const wr = total ? Math.round(c.wins / total * 100) : 0;
    return `
      <div class="company-card" data-company-idx="${i}">
        <div class="company-card-header" style="background:${c.color}22">
          <div class="company-card-logo" style="background:${c.color}33;color:${c.color}">${c.logo}</div>
          <button class="follow-btn ${c.following ? 'following' : ''}" onclick="toggleFollow(event, ${i}, this)">${c.following ? 'フォロー中' : 'フォロー'}</button>
        </div>
        <div class="company-card-body">
          <div class="company-card-name">${c.name}</div>
          <div class="company-card-team">
            ${c.category} ・ ${c.area}
            <span class="level-tag ${levelClass[c.level]}">${levelLabel[c.level]}</span>
          </div>
          <div class="win-rate-bar"><div class="win-rate-fill" style="width:${wr}%"></div></div>
          <div class="company-card-stats">
            <div class="cstat"><div class="cstat-val">${c.wins}</div><div class="cstat-lbl">勝</div></div>
            <div class="cstat"><div class="cstat-val">${c.losses}</div><div class="cstat-lbl">敗</div></div>
            <div class="cstat"><div class="cstat-val">${c.draws}</div><div class="cstat-lbl">引分</div></div>
            <div class="cstat"><div class="cstat-val">${wr}%</div><div class="cstat-lbl">勝率</div></div>
          </div>
        </div>
      </div>
    `;
  }).join('');

  grid.querySelectorAll('.company-card').forEach(card => {
    card.addEventListener('click', () => {
      const idx = parseInt(card.dataset.companyIdx, 10);
      openCompanyDetail(idx);
    });
  });
}

function toggleFollow(e, idx, btn) {
  e.stopPropagation();
  companies[idx].following = !companies[idx].following;
  btn.textContent = companies[idx].following ? 'フォロー中' : 'フォロー';
  btn.classList.toggle('following', companies[idx].following);
}

function openCompanyDetail(idx) {
  const c = companies[idx];
  if (!c) return;
  const total = c.wins + c.losses + c.draws;
  const wr = total ? Math.round(c.wins / total * 100) : 0;

  document.getElementById('companyDetailBody').innerHTML = `
    <div class="company-detail">
      <div class="company-detail-header" style="background:linear-gradient(135deg, ${c.color}44, ${c.color}11)">
        <div class="company-detail-logo" style="background:${c.color}55;color:${c.color}">${c.logo}</div>
        <div class="company-detail-headinfo">
          <div class="company-detail-name">${c.name}</div>
          <div class="company-detail-team">${c.category}<span class="level-tag ${levelClass[c.level]}" style="margin-left:8px">${levelLabel[c.level]}</span></div>
        </div>
        <button class="follow-btn ${c.following ? 'following' : ''}" id="detailFollowBtn" onclick="toggleFollowFromDetail(${idx}, this)">${c.following ? 'フォロー中' : 'フォロー'}</button>
      </div>

      <div class="company-detail-grid">
        <div class="company-detail-row"><div class="company-detail-label">所在地</div>     <div class="company-detail-value">${c.prefecture}</div></div>
        <div class="company-detail-row"><div class="company-detail-label">ホーム</div>     <div class="company-detail-value">${c.homeCourt}</div></div>
        <div class="company-detail-row"><div class="company-detail-label">設立</div>       <div class="company-detail-value">${c.founded}年</div></div>
        <div class="company-detail-row"><div class="company-detail-label">キャプテン</div> <div class="company-detail-value">${c.captain}</div></div>
      </div>

      <div class="company-detail-section">
        <div class="company-detail-section-title">紹介</div>
        <div class="company-detail-description">${c.description}</div>
      </div>

      <div class="company-detail-section">
        <div class="company-detail-section-title">通算成績（${total}試合）</div>
        <div class="company-detail-record">
          <div class="record-item"><div class="record-val" style="color:var(--neon-green)">${c.wins}</div><div class="record-lbl">勝</div></div>
          <div class="record-item"><div class="record-val" style="color:#ff8080">${c.losses}</div><div class="record-lbl">敗</div></div>
          <div class="record-item"><div class="record-val" style="color:var(--neon-yellow)">${c.draws}</div><div class="record-lbl">引分</div></div>
          <div class="record-item"><div class="record-val" style="color:var(--neon-cyan)">${wr}%</div><div class="record-lbl">勝率</div></div>
        </div>
        <div class="win-rate-bar" style="margin-top:12px"><div class="win-rate-fill" style="width:${wr}%"></div></div>
      </div>
    </div>
  `;
  openModal('modal-company-detail');
}

function toggleFollowFromDetail(idx, btn) {
  companies[idx].following = !companies[idx].following;
  btn.textContent = companies[idx].following ? 'フォロー中' : 'フォロー';
  btn.classList.toggle('following', companies[idx].following);
  renderCompanies();
}

document.addEventListener('DOMContentLoaded', renderCompanies);
