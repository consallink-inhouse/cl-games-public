/* ===================================================================
   chat.js - チャット画面
   =================================================================== */

const chatRoomData = [
  { name: 'DigitalForce FC', avatar: 'DF', color: '#00cc6a', preview: '次の試合楽しみにしています！', time: '30分前', unread: 3, active: true },
  { name: '第3回大会 グループ', avatar: '🏆', color: '#cc6600', preview: 'タイムスケジュール確認お願いします', time: '2時間前', unread: 8, active: false },
  { name: 'スポーツワークス', avatar: 'SW', color: '#0099cc', preview: '練習試合いかがでしょうか？', time: '昨日', unread: 0, active: false },
  { name: 'チーム内チャット', avatar: 'TC', color: '#8800cc', preview: '今日の練習出席確認してください', time: '昨日', unread: 2, active: false },
  { name: 'BizSports FC', avatar: 'BS', color: '#447700', preview: 'よろしくお願いします！', time: '3日前', unread: 0, active: false },
];

const chatMessagesData = [
  { name: 'DF 中村', avatar: 'CN', color: '#00cc6a', text: 'こんにちは！1月25日の練習試合、楽しみにしております。場所の詳細を教えていただけますか？', time: '14:20', mine: false },
  { name: '山田 太郎', avatar: 'YT', color: '#00cc6a', text: '新宿スポーツセンター 第2コートです。19時集合でお願いします！', time: '14:35', mine: true },
  { name: 'DF 中村', avatar: 'CN', color: '#00cc6a', text: 'ありがとうございます！メンバー8名で参加予定です。よろしくお願いします。', time: '14:40', mine: false },
  { name: '山田 太郎', avatar: 'YT', color: '#00cc6a', text: 'こちらも楽しみにしています！当日はよろしくお願いします 🙌', time: '14:45', mine: true },
  { name: 'DF 鈴木', avatar: 'DS', color: '#00a8cc', text: '試合後に軽く食事でもいかがでしょうか？近くに良い居酒屋があります', time: '15:10', mine: false },
];

function renderChatRooms() {
  const el = document.getElementById('chatRooms');
  if (!el) return;
  el.innerHTML = chatRoomData.map((r, i) => `
    <div class="chat-room ${r.active ? 'active' : ''}" onclick="selectRoom(${i})">
      <div class="chat-room-avatar" style="background:${r.color}22;color:${r.color}">${r.avatar}</div>
      <div class="chat-room-info">
        <div class="chat-room-name">${r.name}${r.unread > 0 ? `<span style="background:var(--neon-green);color:var(--bg-dark);font-size:10px;font-weight:700;padding:1px 6px;border-radius:10px;margin-left:6px">${r.unread}</span>` : ''}</div>
        <div class="chat-room-preview">${r.preview}</div>
      </div>
      <div class="chat-room-time">${r.time}</div>
    </div>
  `).join('');
}

function renderChatMessages() {
  const el = document.getElementById('chatMessages');
  if (!el) return;
  el.innerHTML = chatMessagesData.map(m => `
    <div class="message ${m.mine ? 'mine' : ''}">
      ${!m.mine ? `<div class="msg-avatar" style="background:${m.color}22;color:${m.color}">${m.avatar}</div>` : ''}
      <div class="msg-body">
        <div class="msg-name">${m.name}</div>
        <div class="msg-bubble">${m.text}</div>
        <div class="msg-time">${m.time}</div>
      </div>
      ${m.mine ? `<div class="msg-avatar" style="background:var(--neon-green)22;color:var(--neon-green)">${m.avatar}</div>` : ''}
    </div>
  `).join('');
  el.scrollTop = el.scrollHeight;
}

function selectRoom(idx) {
  chatRoomData.forEach((r, i) => r.active = i === idx);
  renderChatRooms();
}

function sendMessage() {
  const input = document.getElementById('chatInput');
  const text = input.value.trim();
  if (!text) return;
  chatMessagesData.push({
    name: '山田 太郎',
    avatar: 'YT',
    color: '#00cc6a',
    text,
    time: new Date().toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' }),
    mine: true
  });
  renderChatMessages();
  input.value = '';
}

function handleChatKey(e) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
}

document.addEventListener('DOMContentLoaded', () => {
  renderChatRooms();
  renderChatMessages();
});
