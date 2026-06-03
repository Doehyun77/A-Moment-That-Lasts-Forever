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
    if (typeof loadAdminEvents === 'function') await loadAdminEvents(true, 'panel-admin');
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

// ── TODO List (localStorage persist) ──
const TODO_STORAGE_KEY = 'operator-todos';

function loadTodos() {
  const list = document.getElementById('todo-list');
  if (!list) return;
  // 저장된 메모 복원
  const saved = localStorage.getItem(TODO_STORAGE_KEY);
  if (saved) {
    try {
      const items = JSON.parse(saved);
      list.innerHTML = '';
      items.forEach(item => appendTodoItem(list, item.text, item.done));
      return;
    } catch (_) {}
  }
  // 기본 예시 메모
  list.innerHTML = '';
  appendTodoItem(list, '운영 메모를 자유롭게 남겨 주세요', false);
}

function saveTodos() {
  const list = document.getElementById('todo-list');
  if (!list) return;
  const items = [];
  list.querySelectorAll('.todo-item').forEach(el => {
    const text = el.querySelector('.todo-text')?.textContent || '';
    const done = el.classList.contains('done');
    items.push({ text, done });
  });
  localStorage.setItem(TODO_STORAGE_KEY, JSON.stringify(items));
}

function appendTodoItem(list, text, done = false) {
  const item = document.createElement('div');
  item.className = 'todo-item' + (done ? ' done' : '');
  const checked = done ? ' checked' : '';
  item.innerHTML = '<div class="todo-cb' + checked + '" onclick="toggleTodo(this)"></div><span class="todo-text">' + text.replace(/</g,'&lt;') + '</span>';
  list.appendChild(item);
}

function toggleTodo(el) {
  const item = el.closest('.todo-item');
  if (!item) return;
  const isDone = item.classList.contains('done');

  if (!isDone) {
    // 체크 ON
    el.classList.add('checked');
    item.classList.add('done');
    saveTodos();

    // 2.2초 후 fade-out 후 제거
    item.dataset.fading = 'true';
    item.style.transition = 'opacity 0.5s, transform 0.5s';
    item.style.opacity = '0';
    item.style.transform = 'translateX(20px)';
    setTimeout(() => {
      if (item.isConnected && item.dataset.fading === 'true') {
        item.remove();
        saveTodos();
      }
    }, 2200);
  } else {
    // 체크 해제 (되돌리기)
    delete item.dataset.fading;
    el.classList.remove('checked');
    item.classList.remove('done');
    item.style.opacity = '';
    item.style.transform = '';
    saveTodos();
  }
}

function addTodo() {
  const input = document.getElementById('todo-input');
  const text = input?.value.trim();
  if (!input || !text) return;
  const list = document.getElementById('todo-list');
  if (!list) return;
  appendTodoItem(list, text, false);
  input.value = '';
  saveTodos();
}

// 페이지 로드 시 복원
document.addEventListener('DOMContentLoaded', () => {
  // operator dashboard 열릴 때 복원
  const observer = new MutationObserver(() => {
    if (document.getElementById('panel-dashboard')?.classList.contains('active')) {
      loadTodos();
      observer.disconnect();
    }
  });
  observer.observe(document.getElementById('panel-dashboard') || document.body, {
    attributes: true, attributeFilter: ['class']
  });
  // fallback: 바로 복원
  setTimeout(loadTodos, 500);
});
