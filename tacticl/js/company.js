/* ===================================================================
   company.js - チーム管理
     - チーム編集モーダルのプリフィル
   =================================================================== */

const teamData = {
  A: {
    name: 'CLFC（Aチーム）',
    color: '#00ff88',
    year: 2021,
    count: 10,
    area: '東京都',
    home: '渋谷区民体育館',
    level: '中級者',
    memo: 'スター選手揃いのトップチーム。企業交流大会では常に優勝候補。'
  },
  B: {
    name: 'CLFC（Bチーム）',
    color: '#00e5ff',
    year: 2023,
    count: 6,
    area: '東京都',
    home: '渋谷区民体育館',
    level: '初心者歓迎',
    memo: '初心者・若手中心のセカンドチーム。育成を重視。'
  }
};

function openEditTeam(teamKey) {
  const t = teamData[teamKey];
  if (!t) return;
  document.getElementById('editTeamName').value  = t.name;
  document.getElementById('editTeamColor').value = t.color;
  document.getElementById('editTeamYear').value  = t.year;
  document.getElementById('editTeamCount').value = t.count;
  document.getElementById('editTeamArea').value  = t.area;
  document.getElementById('editTeamHome').value  = t.home;
  document.getElementById('editTeamLevel').value = t.level;
  document.getElementById('editTeamMemo').value  = t.memo;
  openModal('modal-edit-team');
}
