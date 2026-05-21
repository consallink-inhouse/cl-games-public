/* ===================================================================
   common.js - 全画面共通の機能
     - サイドバー（モバイル対応）
     - モーダル開閉
     - タブ切り替え
   =================================================================== */

// ===== SIDEBAR MOBILE =====
function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('open');
  document.getElementById('sidebarOverlay').classList.toggle('open');
}

function closeSidebar() {
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('sidebarOverlay').classList.remove('open');
}

// ===== MODALS =====
function openModal(id) {
  const el = document.getElementById(id);
  if (el) el.classList.add('open');
}

function closeModal(id) {
  const el = document.getElementById(id);
  if (el) el.classList.remove('open');
}

// ===== TABS =====
function switchTab(el, targetId) {
  const tabs = el.parentElement.querySelectorAll('.tab');
  tabs.forEach(t => t.classList.remove('active'));
  el.classList.add('active');
  // 同一スコープ内のタブパネル（id="tab-..."）を全部隠して、対象だけ表示
  const scope = el.closest('.page') || document;
  scope.querySelectorAll('[id^="tab-"]').forEach(t => t.style.display = 'none');
  const target = document.getElementById(targetId);
  if (target) target.style.display = '';
}
