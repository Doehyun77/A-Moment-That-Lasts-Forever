// =====================================================
//  operator.js — 운영자 콘솔 내비게이션 / TODO
// =====================================================

// ── Navigation ──
function switchPanel(panelId) {
  document.querySelectorAll('.content-panel').forEach(p => p.classList.remove('active'));
  const panel = document.getElementById(panelId);
  if (panel) panel.classList.add('active');
}
function goLogin() {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById('screen-login').classList.add('active');
  document.getElementById('login-username').focus();
}
function goHome() {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById('screen-operator').classList.add('active');
  switchPanel('panel-dashboard');
  updateSidebar();
  if (typeof renderOperatorDashboard === 'function') renderOperatorDashboard();
}
function switchToManage() {
  goHome();
  switchPanel('panel-manage');
  activateSidebar(2);
  if (typeof renderManageScreen === 'function') renderManageScreen();
}
function switchToAdmin() {
  goHome();
  switchPanel('panel-admin');
  activateSidebar(3);
  if (typeof loadAdminEvents === 'function') loadAdminEvents();
}
function activateSidebar(idx) {
  document.querySelectorAll('.sidebar-item').forEach((b, i) => b.classList.toggle('active', i === idx));
}
function switchOperatorTab(tab) {
  const map = { home: 0, create: 1, manage: 2, upload: 3 };
  const idx = map[tab] || 0;
  if (tab === 'create') {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById('screen-operator').classList.add('active');
    switchPanel('panel-create');
    activateSidebar(idx);
    currentScreenName = 'operator';
    return;
  }
  activateSidebar(idx);
  if (tab === 'manage') {
    switchPanel('panel-manage');
    if (typeof renderManageScreen === 'function') renderManageScreen();
  }
  else if (tab === 'upload') {
    switchPanel('panel-admin');
    if (typeof loadAdminEvents === 'function') loadAdminEvents();
  }
  else {
    goHome();
    switchPanel('panel-dashboard');
  }
}
function updateSidebar() { activateSidebar(0); }

// ── TODO List ──
function toggleTodo(el) {
  el.classList.toggle('checked');
  el.closest('.todo-item').classList.toggle('done');
}
function addTodo() {
  const input = document.getElementById('todo-input');
  const text = input.value.trim();
  if (!text) return;
  const list = document.getElementById('todo-list');
  const item = document.createElement('div');
  item.className = 'todo-item';
  item.innerHTML = '<div class="todo-cb" onclick="toggleTodo(this)"></div><span class="todo-text">' + text.replace(/</g,'&lt;') + '</span>';
  const addRow = list.nextElementSibling;
  list.insertBefore(item, addRow);
  input.value = '';
}

// ── Toast ──
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2000);
}
