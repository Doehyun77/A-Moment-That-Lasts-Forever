// =====================================================
//  operator.js — 운영자 콘솔 내비게이션 / TODO
// =====================================================

function showOperatorScreenOnly() {
  document.querySelectorAll('.screen').forEach((screen) => screen.classList.remove('active'));
  const operatorScreen = document.getElementById('screen-operator');
  if (operatorScreen) operatorScreen.classList.add('active');
  currentScreenName = 'operator';
}

// ── Navigation ──
async function switchPanel(panelId) {
  const panels = document.querySelectorAll('#screen-operator .content-panel');
  panels.forEach((panel) => panel.classList.remove('active'));

  const panel = document.getElementById(panelId);
  if (panel) panel.classList.add('active');

  if (panelId === 'panel-dashboard') {
    if (typeof renderOperatorDashboard === 'function') await renderOperatorDashboard();
  } else if (panelId === 'panel-manage') {
    if (typeof renderManageScreen === 'function') await renderManageScreen();
  } else if (panelId === 'panel-admin') {
    if (typeof loadAdminEvents === 'function') await loadAdminEvents(true);
    if (typeof renderAdminGrid === 'function') await renderAdminGrid('panel-admin');
  } else if (panelId === 'panel-create') {
    if (typeof updateChecklist === 'function') updateChecklist();
    if (typeof refreshCreateWorkspace === 'function') refreshCreateWorkspace();
    if (typeof clearQR === 'function') clearQR();
  }
}

async function goLogin(skipLogout = false) {
  const operatorVisible = document.getElementById('screen-operator')?.classList.contains('active');
  if (!skipLogout && operatorVisible && typeof operatorLogout === 'function') {
    await operatorLogout(true);
    return;
  }

  document.querySelectorAll('.screen').forEach((screen) => screen.classList.remove('active'));
  document.querySelectorAll('.screen-body').forEach((body) => {
    body.style.display = 'none';
    body.classList.remove('is-active', 'slide-out-left', 'slide-out-right', 'slide-from-right', 'slide-from-left');
  });

  const loginScreen = document.getElementById('screen-login');
  const mainNav = document.getElementById('main-nav');
  const slideWrapper = document.getElementById('slide-wrapper');
  const loginUser = document.getElementById('login-username');

  if (mainNav) mainNav.style.display = 'none';
  if (slideWrapper) slideWrapper.style.display = 'none';
  if (loginScreen) loginScreen.classList.add('active');
  currentScreenName = 'login';
  screenHistory = [];
  if (loginUser) loginUser.focus();
}

async function goHome() {
  showOperatorScreenOnly();
  await switchPanel('panel-dashboard');
  updateSidebar();
}

async function switchToManage() {
  showOperatorScreenOnly();
  activateSidebar(2);
  await switchPanel('panel-manage');
}

async function switchToAdmin() {
  showOperatorScreenOnly();
  activateSidebar(3);
  await switchPanel('panel-admin');
}

function activateSidebar(idx) {
  document.querySelectorAll('.sidebar-item').forEach((button, i) => button.classList.toggle('active', i === idx));
}

async function switchOperatorTab(tab) {
  const map = { home: 0, create: 1, manage: 2, upload: 3 };
  const idx = map[tab] || 0;

  showOperatorScreenOnly();
  activateSidebar(idx);

  if (tab === 'create') {
    await switchPanel('panel-create');
    return;
  }

  if (tab === 'manage') {
    await switchPanel('panel-manage');
    return;
  }

  if (tab === 'upload') {
    await switchPanel('panel-admin');
    return;
  }

  await switchPanel('panel-dashboard');
}
function updateSidebar() { activateSidebar(0); }

// ── TODO List ──
function toggleTodo(el) {
  el.classList.toggle('checked');
  el.closest('.todo-item')?.classList.toggle('done');
}
function addTodo() {
  const input = document.getElementById('todo-input');
  const text = input?.value.trim();
  if (!input || !text) return;
  const list = document.getElementById('todo-list');
  if (!list) return;
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
  if (!t) return;
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2000);
}
