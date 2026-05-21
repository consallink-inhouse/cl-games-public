/* ===================================================================
   schedule.js - スケジュール / カレンダー
     - 予定チップクリックで詳細モーダル + Map表示
   =================================================================== */

let calYear = 2025, calMonth = 0;

const calEvents = [
  { date: '2025-01-08', type: 'practice', title: 'チーム練習',
    time: '19:00 - 21:00', location: '渋谷区民グラウンド', address: '東京都渋谷区宇田川町1-1',
    description: '基礎練習＋戦術確認。アジリティドリル中心。' },
  { date: '2025-01-10', type: 'meeting', title: '戦略ミーティング',
    time: '12:00 - 13:00', location: '本社会議室B', address: '東京都新宿区西新宿2-8-1',
    description: '次節に向けたフォーメーション確認とビデオ分析。' },
  { date: '2025-01-15', type: 'practice', title: 'チーム練習',
    time: '19:00 - 21:00', location: '渋谷区民グラウンド', address: '東京都渋谷区宇田川町1-1',
    description: 'シュート練習＋セットプレー確認。' },
  { date: '2025-01-19', type: 'match', title: 'vs 山田 FC',
    time: '15:00 - 17:00', location: '駒沢オリンピック公園 サッカーコート', address: '東京都文京区後楽1-3-61',
    description: '練習試合 / CLFC（Aチーム）出場。' },
  { date: '2025-01-22', type: 'practice', title: 'チーム練習',
    time: '19:00 - 21:00', location: '渋谷区民グラウンド', address: '東京都渋谷区宇田川町1-1',
    description: '基礎フィジカル＋連携プレー。' },
  { date: '2025-01-25', type: 'match', title: 'vs DigitalForce',
    time: '19:00 - 21:00', location: '駒沢オリンピック公園 第二球技場', address: '東京都世田谷区駒沢公園1-1',
    description: '練習試合。スターター6名で挑む。' },
  { date: '2025-01-28', type: 'practice', title: '練習＋戦術確認',
    time: '18:30 - 20:30', location: '渋谷区民グラウンド', address: '東京都渋谷区宇田川町1-1',
    description: '2/2 大会前の戦術最終確認。' },
  { date: '2025-02-02', type: 'event', title: '第3回 社会人サッカーオープン',
    time: '09:00 - 18:00', location: '駒沢オリンピック公園', address: '東京都文京区後楽1-3-61',
    description: '全16チーム参加。優勝目指して全力で。' },
  { date: '2025-02-05', type: 'meeting', title: '振り返りMTG',
    time: '12:00 - 13:00', location: '本社会議室B', address: '東京都新宿区西新宿2-8-1',
    description: '大会結果の振り返り＋次シーズン方針。' },
  { date: '2025-02-12', type: 'practice', title: 'チーム練習',
    time: '19:00 - 21:00', location: '渋谷区民グラウンド', address: '東京都渋谷区宇田川町1-1',
    description: '新シーズン向けスタミナトレーニング。' },
  { date: '2025-02-16', type: 'match', title: 'vs SportsWorks United',
    time: '14:00 - 16:00', location: '横浜国際サッカーパーク', address: '神奈川県横浜市港北区新横浜3-4',
    description: '練習試合（アウェイ）。' },
];

const typeLabel = { practice: '練習', match: '試合', meeting: 'ミーティング', event: '大会・イベント' };
const typeIcon  = { practice: '🏃', match: '⚽', meeting: '📋', event: '🏆' };

function renderCalendar() {
  const months = ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月'];
  document.getElementById('calMonth').textContent = `${calYear}年 ${months[calMonth]}`;
  const body = document.getElementById('calBody');
  body.innerHTML = '';
  const first = new Date(calYear, calMonth, 1).getDay();
  const days = new Date(calYear, calMonth + 1, 0).getDate();
  const today = new Date();
  let cells = '';
  for (let i = 0; i < first; i++) {
    const d = new Date(calYear, calMonth, -first + i + 1).getDate();
    cells += `<div class="cal-cell other-month"><div class="cal-date">${d}</div></div>`;
  }
  for (let d = 1; d <= days; d++) {
    const isToday = today.getFullYear() === calYear && today.getMonth() === calMonth && today.getDate() === d;
    const dateStr = `${calYear}-${String(calMonth+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    const evHtml = calEvents
      .map((e, idx) => ({ e, idx }))
      .filter(({ e }) => e.date === dateStr)
      .map(({ e, idx }) => `<div class="cal-event ${e.type}" data-event-idx="${idx}" title="${e.title}">${e.title}</div>`)
      .join('');
    cells += `<div class="cal-cell${isToday?' today':''}"><div class="cal-date">${d}</div>${evHtml}</div>`;
  }
  body.innerHTML = cells;

  // イベントチップのクリックハンドラを登録
  body.querySelectorAll('.cal-event').forEach(el => {
    el.addEventListener('click', () => {
      const idx = parseInt(el.dataset.eventIdx, 10);
      openEventDetail(idx);
    });
  });
}

function openEventDetail(idx) {
  const e = calEvents[idx];
  if (!e) return;
  const dateObj = new Date(e.date);
  const wkdays = ['日','月','火','水','木','金','土'];
  const dateLabel = `${dateObj.getFullYear()}年${dateObj.getMonth()+1}月${dateObj.getDate()}日 (${wkdays[dateObj.getDay()]})`;
  const mapQuery = encodeURIComponent(e.address);

  document.getElementById('eventDetailBody').innerHTML = `
    <div class="event-detail">
      <div class="event-type-badge badge-${e.type}">${typeIcon[e.type]} ${typeLabel[e.type]}</div>
      <h3 class="event-detail-title">${e.title}</h3>

      <div class="event-detail-grid">
        <div class="event-detail-row">
          <div class="event-detail-label">📅 日時</div>
          <div class="event-detail-value">${dateLabel}<br>${e.time}</div>
        </div>
        <div class="event-detail-row">
          <div class="event-detail-label">📍 場所</div>
          <div class="event-detail-value"><strong>${e.location}</strong><br><span class="event-detail-address">${e.address}</span></div>
        </div>
        <div class="event-detail-row">
          <div class="event-detail-label">📝 詳細</div>
          <div class="event-detail-value">${e.description}</div>
        </div>
      </div>

      <div class="event-map-wrapper">
        <div class="event-map-label">📌 場所マップ（クリックでGoogle Mapsを開く）</div>
        <a href="https://www.google.com/maps/search/?api=1&query=${mapQuery}" target="_blank" rel="noopener" class="event-map-link">
          <iframe
            class="event-map-iframe"
            src="https://maps.google.com/maps?q=${mapQuery}&t=&z=15&ie=UTF8&iwloc=&output=embed"
            loading="lazy"
            referrerpolicy="no-referrer-when-downgrade"
            tabindex="-1"></iframe>
        </a>
      </div>
    </div>
  `;
  openModal('modal-event-detail');
}

function prevMonth() {
  calMonth--;
  if (calMonth < 0) { calMonth = 11; calYear--; }
  renderCalendar();
}

function nextMonth() {
  calMonth++;
  if (calMonth > 11) { calMonth = 0; calYear++; }
  renderCalendar();
}

function toggleFilter(type, el) {
  el.classList.toggle('inactive');
}

document.addEventListener('DOMContentLoaded', renderCalendar);
