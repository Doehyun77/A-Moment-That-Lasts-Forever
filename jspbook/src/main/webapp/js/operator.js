// =====================================================
//  operator.js — 운영자 콘솔 내비게이션 / TODO
// =====================================================

let operatorTodoSyncPending = false;
let operatorTodoQueuedSync = false;
let operatorTodoQueuedRerender = false;
let operatorTodoLoadStarted = false;
let operatorLogLoadStarted = false;
const MAX_OPERATOR_TODOS = 7;

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
    await loadTodos();
  } else if (panelId === 'panel-manage') {
    if (typeof renderManageScreen === 'function') await renderManageScreen();
  } else if (panelId === 'panel-admin') {
    if (typeof loadAdminEvents === 'function') await loadAdminEvents(true, 'panel-admin');
  } else if (panelId === 'panel-create') {
    if (typeof updateChecklist === 'function') updateChecklist();
    if (typeof refreshCreateWorkspace === 'function') refreshCreateWorkspace();
    if (typeof clearQR === 'function') clearQR();
  } else if (panelId === 'panel-logs') {
    await loadOperatorLogs(true);
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
  operatorTodoLoadStarted = false;
  operatorLogLoadStarted = false;
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
  const map = { home: 0, create: 1, manage: 2, upload: 3, logs: 4 };
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

  if (tab === 'logs') {
    await switchPanel('panel-logs');
    return;
  }

  await switchPanel('panel-dashboard');
}
function updateSidebar() { activateSidebar(0); }

function getOperatorLogListElement() {
  return document.getElementById('operator-log-list');
}

function formatOperatorLogTime(value) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}.${month}.${day} ${hours}:${minutes}`;
}

function getOperatorLogStatusText(status) {
  if (status === 'success') return '성공';
  if (status === 'fail') return '실패';
  if (status === 'warning') return '주의';
  return '안내';
}

function renderOperatorLogs(items = []) {
  const list = getOperatorLogListElement();
  if (!list) return;

  list.innerHTML = '';
  if (!Array.isArray(items) || items.length === 0) {
    list.innerHTML = '<div class="operator-log-empty">아직 쌓인 운영 로그가 없어요.</div>';
    return;
  }

  items.forEach((item) => {
    const row = document.createElement('div');
    row.className = 'operator-log-item';

    const meta = document.createElement('div');
    meta.className = 'operator-log-meta';
    meta.innerHTML = `
      <span>${formatOperatorLogTime(item.createdAt)}</span>
      <span class="operator-log-status ${item.status || 'info'}">${getOperatorLogStatusText(item.status)}</span>
      <span>${item.siteLabel || item.eventCode || '운영자 콘솔'}</span>
    `;

    const message = document.createElement('div');
    message.className = 'operator-log-message';
    message.textContent = item.message || '운영 로그';

    row.appendChild(meta);
    row.appendChild(message);

    if (item.detail) {
      const detail = document.createElement('div');
      detail.className = 'operator-log-detail';
      detail.textContent = item.detail;
      row.appendChild(detail);
    }

    list.appendChild(row);
  });
}

async function loadOperatorLogs(force = false) {
  const list = getOperatorLogListElement();
  if (!list) return;
  if (operatorLogLoadStarted && !force) return;
  operatorLogLoadStarted = true;

  list.innerHTML = '<div class="operator-log-empty">운영 로그를 불러오는 중...</div>';

  try {
    const result = await api_getOperatorLogs();
    renderOperatorLogs(Array.isArray(result.items) ? result.items : []);
  } catch (error) {
    console.error('운영 로그 로드 실패:', error);
    list.innerHTML = '<div class="operator-log-empty">운영 로그를 불러오지 못했어요.</div>';
  }
}

// ── TODO List (API persist) ──
function getTodoListElement() {
  return document.getElementById('todo-list');
}

function updateTodoMeta() {
  const input = document.getElementById('todo-input');
  const countEl = document.getElementById('todo-count');
  const addBtn = document.querySelector('.todo-add-btn');
  const count = collectTodoItems().filter(item => item.id !== 'load-error').length;
  const limitReached = count >= MAX_OPERATOR_TODOS;

  if (countEl) countEl.textContent = `${count}/${MAX_OPERATOR_TODOS}`;
  if (input) {
    input.placeholder = limitReached
      ? `운영 메모는 최대 ${MAX_OPERATOR_TODOS}개까지 추가할 수 있어요`
      : '메모 추가 (예: QR 만료 3건 확인)';
  }
  if (input) input.disabled = limitReached;
  if (addBtn) addBtn.disabled = limitReached;
}

function collectTodoItems() {
  const list = getTodoListElement();
  if (!list) return [];
  return Array.from(list.querySelectorAll('.todo-item')).map((el, index) => ({
    id: el.dataset.id || '',
    text: el.querySelector('.todo-text')?.textContent?.trim() || '',
    done: el.classList.contains('done'),
    sortOrder: index
  })).filter(item => item.text);
}

function renderTodoItems(items = []) {
  const list = getTodoListElement();
  if (!list) return;

  list.innerHTML = '';
  if (!Array.isArray(items) || items.length === 0) {
    updateTodoMeta();
    return;
  }

  items.forEach((item, index) => {
    appendTodoItem(list, item.text, !!item.done, item.id || `todo-${index}`);
  });
  updateTodoMeta();
}

function appendTodoItem(list, text, done = false, id = '', options = {}) {
  const { interactive = true, placeholder = false } = options;

  const item = document.createElement('div');
  item.className = 'todo-item' + (done ? ' done' : '') + (placeholder ? ' todo-item-placeholder' : '');
  if (id) item.dataset.id = id;
  if (!interactive) item.dataset.readonly = 'true';

  const checkbox = document.createElement('div');
  checkbox.className = 'todo-cb' + (done ? ' checked' : '') + (!interactive ? ' todo-cb-disabled' : '');
  if (interactive) {
    checkbox.onclick = () => toggleTodo(checkbox);
  } else {
    checkbox.setAttribute('aria-hidden', 'true');
  }

  const textEl = document.createElement('span');
  textEl.className = 'todo-text';
  textEl.textContent = text;

  item.appendChild(checkbox);
  item.appendChild(textEl);
  list.appendChild(item);
}

async function loadTodos(force = false) {
  const list = getTodoListElement();
  if (!list) return;
  if (operatorTodoLoadStarted && !force) return;
  operatorTodoLoadStarted = true;

  list.innerHTML = '<div class="todo-item"><span class="todo-text">메모를 불러오는 중...</span></div>';
  updateTodoMeta();

  try {
    const result = await api_getOperatorTodos();
    const items = Array.isArray(result.items) ? result.items : [];
    renderTodoItems(items);
  } catch (error) {
    console.error('운영 메모 로드 실패:', error);
    renderTodoItems([{ text: '운영 메모를 불러오지 못했어요', done: false, id: 'load-error' }]);
  }
}

async function saveTodos(options = {}) {
  const { rerender = true } = options;
  const list = getTodoListElement();
  if (!list) return;

  if (operatorTodoSyncPending) {
    operatorTodoQueuedSync = true;
    operatorTodoQueuedRerender = operatorTodoQueuedRerender || rerender;
    return;
  }

  const rawItems = collectTodoItems();
  const filteredItems = rawItems.filter(item => item.id !== 'placeholder' && item.id !== 'load-error');

  operatorTodoSyncPending = true;

  try {
    const result = await api_saveOperatorTodos(filteredItems.map(({ text, done }) => ({ text, done })));
    if (rerender && result && Array.isArray(result.items)) {
      renderTodoItems(result.items);
    }
  } catch (error) {
    console.error('운영 메모 저장 실패:', error);
    showToast('운영 메모 저장에 실패했어요');
  } finally {
    operatorTodoSyncPending = false;
    if (operatorTodoQueuedSync) {
      const queuedRerender = operatorTodoQueuedRerender;
      operatorTodoQueuedSync = false;
      operatorTodoQueuedRerender = false;
      saveTodos({ rerender: queuedRerender });
    }
  }
}

function toggleTodo(el) {
  const item = el.closest('.todo-item');
  if (!item) return;
  const isDone = item.classList.contains('done');

  if (!isDone) {
    el.classList.add('checked');
    item.classList.add('done');
    item.dataset.fading = 'true';
    item.style.transition = 'opacity 0.5s, transform 0.5s';

    saveTodos({ rerender: false });

    requestAnimationFrame(() => {
      item.style.opacity = '0';
      item.style.transform = 'translateX(20px)';
    });

    setTimeout(() => {
      if (item.isConnected && item.dataset.fading === 'true') {
        item.remove();
        saveTodos();
      }
    }, 550);
  } else {
    delete item.dataset.fading;
    el.classList.remove('checked');
    item.classList.remove('done');
    item.style.opacity = '';
    item.style.transform = '';
    item.style.transition = '';
    saveTodos({ rerender: false });
  }
}

function addTodo() {
  const input = document.getElementById('todo-input');
  const text = input?.value.trim();
  if (!input || !text) return;
  const list = getTodoListElement();
  if (!list) return;

  const currentCount = collectTodoItems().filter(item => item.id !== 'load-error').length;
  if (currentCount >= MAX_OPERATOR_TODOS) {
    showToast(`운영 메모는 최대 ${MAX_OPERATOR_TODOS}개까지 추가할 수 있어요`);
    return;
  }

  const firstItem = list.querySelector('.todo-item');
  if (firstItem && (firstItem.dataset.id === 'placeholder' || firstItem.dataset.id === 'load-error')) {
    list.innerHTML = '';
  }

  appendTodoItem(list, text, false, `draft-${Date.now()}`);
  input.value = '';
  updateTodoMeta();
  saveTodos();
}

document.addEventListener('DOMContentLoaded', () => {
  const observer = new MutationObserver(() => {
    if (document.getElementById('panel-dashboard')?.classList.contains('active')) {
      loadTodos();
    }
  });
  observer.observe(document.getElementById('panel-dashboard') || document.body, {
    attributes: true, attributeFilter: ['class']
  });

  setTimeout(() => {
    if (document.getElementById('panel-dashboard')?.classList.contains('active')) {
      loadTodos();
    }
    updateTodoMeta();
  }, 500);
});
