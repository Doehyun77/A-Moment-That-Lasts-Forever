// =====================================================
//  operator.js — 운영자 콘솔 / 사이트 관리 화면
//  백엔드 연동 시 weddingSites 더미 데이터 → API로 교체
// =====================================================

// ── 사이트 관리 더미 데이터 ─────────────
const weddingSites = [
  { groom:'김민준', bride:'이지은', date:'2026-05-15', guests:87,  photos:142 },
  { groom:'박서준', bride:'최유나', date:'2026-05-15', guests:64,  photos:98  },
  { groom:'정하준', bride:'윤소희', date:'2026-06-07', guests:0,   photos:0   },
  { groom:'이준혁', bride:'강다은', date:'2026-07-19', guests:0,   photos:0   },
  { groom:'최도현', bride:'임지수', date:'2026-08-02', guests:0,   photos:0   },
  { groom:'한승우', bride:'오채원', date:'2025-11-23', guests:112, photos:203 },
  { groom:'신재원', bride:'배수진', date:'2025-12-14', guests:93,  photos:167 },
  { groom:'조현우', bride:'노은별', date:'2026-03-08', guests:76,  photos:121 },
];

function getSiteStatus(dateStr) {
  const today = new Date(); today.setHours(0,0,0,0);
  const d     = new Date(dateStr); d.setHours(0,0,0,0);
  if (d.getTime() === today.getTime()) return 'today';
  if (d > today) return 'future';
  return 'past';
}

function getDday(dateStr) {
  const today = new Date(); today.setHours(0,0,0,0);
  const d     = new Date(dateStr); d.setHours(0,0,0,0);
  const diff  = Math.round((d - today) / 86400000);
  if (diff === 0) return 'D-DAY';
  if (diff > 0)   return `D-${diff}`;
  return `D+${Math.abs(diff)}`;
}

function renderManageScreen() {
  const today = [], future = [], past = [];
  weddingSites.forEach(s => {
    const status = getSiteStatus(s.date);
    if (status === 'today')       today.push(s);
    else if (status === 'future') future.push(s);
    else                          past.push(s);
  });
  document.getElementById('manage-total').textContent   = `총 ${weddingSites.length}건`;
  document.getElementById('today-count').textContent    = `(${today.length}건)`;
  document.getElementById('future-count').textContent   = `(${future.length}건)`;
  document.getElementById('past-count').textContent     = `(${past.length}건)`;
  renderSiteList('today-list',  today,  'today');
  renderSiteList('future-list', future, 'future');
  renderSiteList('past-list',   past,   'past');
}

function renderSiteList(containerId, sites, status) {
  const container = document.getElementById(containerId);
  if (sites.length === 0) {
    container.innerHTML = `<div style="color:var(--text-muted); font-size:12px; padding:16px 0;">해당 결혼식이 없어요</div>`;
    return;
  }
  container.innerHTML = '';
  sites.forEach(s => {
    const statusColor = status === 'today' ? '#4CAF50' : status === 'future' ? 'var(--gold)' : 'var(--text-muted)';
    const bgColor     = status === 'today' ? '#F1F8E9' : status === 'future' ? '#FFFBF0' : 'var(--white)';
    const card        = document.createElement('div');
    card.style.cssText = `background:${bgColor}; border:1px solid var(--border); border-radius:12px; padding:20px; cursor:pointer; transition:all 0.2s;`;
    card.onmouseover   = () => { card.style.transform='translateY(-2px)'; card.style.boxShadow='0 4px 16px rgba(44,31,26,0.1)'; };
    card.onmouseout    = () => { card.style.transform=''; card.style.boxShadow=''; };
    card.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:12px;">
        <div>
          <div style="font-family:'Cormorant Garamond',serif; font-size:17px; color:var(--text); margin-bottom:2px;">${s.groom} ♥ ${s.bride}</div>
          <div style="font-size:11px; color:var(--text-muted);">${s.date}</div>
        </div>
        <div style="font-size:11px; font-weight:600; color:${statusColor}; background:white; padding:3px 8px; border-radius:10px; border:1px solid ${statusColor};">${getDday(s.date)}</div>
      </div>
      ${status !== 'future' ? `
      <div style="display:flex; gap:12px; border-top:1px solid var(--border); padding-top:12px;">
        <div style="text-align:center; flex:1;"><div style="font-size:16px; font-weight:600; color:var(--deep-rose);">${s.guests}</div><div style="font-size:10px; color:var(--text-muted);">참여 하객</div></div>
        <div style="text-align:center; flex:1;"><div style="font-size:16px; font-weight:600; color:var(--deep-rose);">${s.photos}</div><div style="font-size:10px; color:var(--text-muted);">업로드 사진</div></div>
        <div style="text-align:center; flex:1;"><div style="font-size:16px; font-weight:600; color:var(--deep-rose);">${status === 'today' ? '🟢' : '🔒'}</div><div style="font-size:10px; color:var(--text-muted);">${status === 'today' ? 'QR 활성' : 'QR 만료'}</div></div>
      </div>` : `
      <div style="border-top:1px solid var(--border); padding-top:12px; font-size:11px; color:var(--text-muted);">QR 아직 미활성화</div>`}
    `;
    container.appendChild(card);
  });
}

function opGoCreate() {
  document.getElementById('screen-operator').classList.remove('active');
  document.getElementById('screen-qr').classList.add('active');
  currentScreenName = 'qr';
}

function opGoManage() {
  document.getElementById('screen-operator').classList.remove('active');
  document.getElementById('screen-manage').classList.add('active');
  currentScreenName = 'manage';
  renderManageScreen();
}

// ═══════════════ OPERATOR CONSOLE NAVIGATION (from preview) ═══════════════
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
}
function switchToAdmin() {
  goHome();
  switchPanel('panel-admin');
  activateSidebar(3);
}
function activateSidebar(idx) {
  document.querySelectorAll('.sidebar-item').forEach((b, i) => b.classList.toggle('active', i === idx));
}
function switchOperatorTab(tab) {
  const map = { home: 0, create: 1, manage: 2, upload: 3 };
  const idx = map[tab] || 0;
  activateSidebar(idx);
  if (tab === 'create') { opGoCreate(); return; }
  if (tab === 'manage') switchPanel('panel-manage');
  else if (tab === 'upload') switchPanel('panel-admin');
  else switchPanel('panel-dashboard');
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

// ── SVGA original 차트 ──
(function() {
  const counts = [0, 0, 1, 4, 8, 3, 2, 1, 1, 0, 1, 1];
  const maxVal = Math.max(...counts, 1);
  const LABELS = ['1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월'];
  const W = 960, H = 145;
  const PAD_L = 30, PAD_R = 14, PAD_T = 22, PAD_B = 22;
  const chartW = W - PAD_L - PAD_R;
  const chartH = H - PAD_T - PAD_B;
  const step = chartW / 11;

  const pts = counts.map((v, i) => ({
    x: PAD_L + i * step,
    y: PAD_T + chartH - (v / maxVal) * chartH,
    v
  }));

  const linePoints = pts.map(p => p.x.toFixed(1) + ',' + p.y.toFixed(1)).join(' ');
  const areaPoints = [PAD_L.toFixed(1) + ',' + (PAD_T + chartH).toFixed(1)]
    .concat(pts.map(p => p.x.toFixed(1) + ',' + p.y.toFixed(1)))
    .concat([(PAD_L + chartW).toFixed(1) + ',' + (PAD_T + chartH).toFixed(1)])
    .join(' ');

  const yLines = [0, 0.5, 1].map(ratio => {
    const y = (PAD_T + chartH - ratio * chartH).toFixed(1);
    const label = Math.round(ratio * maxVal);
    return '<line x1="' + PAD_L + '" y1="' + y + '" x2="' + (W - PAD_R) + '" y2="' + y +
      '" stroke="rgba(139,74,56,0.07)" stroke-width="1" stroke-dasharray="3,3"/>' +
      '<text x="' + (PAD_L - 5) + '" y="' + (parseFloat(y) + 4) +
      '" text-anchor="end" font-size="10" fill="rgba(62,41,34,0.35)">' + label + '</text>';
  }).join('');

  const dots = pts.map(p => {
    const hasData = p.v > 0;
    const lbl = hasData
      ? '<text x="' + p.x.toFixed(1) + '" y="' + (p.y - 7).toFixed(1) +
        '" text-anchor="middle" font-size="10" font-weight="700" fill="#8B4A38">' + p.v + '</text>'
      : '';
    return '<circle cx="' + p.x.toFixed(1) + '" cy="' + p.y.toFixed(1) +
      '" r="' + (hasData ? 4 : 2.5) + '" fill="' + (hasData ? '#8B4A38' : 'rgba(197,130,106,0.3)') +
      '" stroke="white" stroke-width="1.5"/>' + lbl;
  }).join('');

  const xLabels = pts.map((p, i) =>
    '<text x="' + p.x.toFixed(1) + '" y="' + (H - 5) +
    '" text-anchor="middle" font-size="10" fill="rgba(62,41,34,0.48)">' + LABELS[i] + '</text>'
  ).join('');

  document.getElementById('chart-body').innerHTML =
    '<svg viewBox="0 0 ' + W + ' ' + H + '" style="width:100%;height:auto;display:block;" xmlns="http://www.w3.org/2000/svg">' +
      '<defs>' +
        '<linearGradient id="lineAreaGrad" x1="0" y1="0" x2="0" y2="1">' +
          '<stop offset="0%" stop-color="#C5826A" stop-opacity="0.15"/>' +
          '<stop offset="100%" stop-color="#C5826A" stop-opacity="0"/>' +
        '</linearGradient>' +
      '</defs>' +
      yLines +
      '<polygon points="' + areaPoints + '" fill="url(#lineAreaGrad)"/>' +
      '<polyline points="' + linePoints + '" fill="none" stroke="#8B4A38" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>' +
      dots + xLabels +
    '</svg>';
})();

// ── Manage Filters ──
let currentManageFilter = 'all';
function setManageFilter(btn, filter) {
  currentManageFilter = filter;
  btn.parentElement.querySelectorAll('.manage-filter-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  ['today','future','past'].forEach(k => {
    const el = document.getElementById('section-' + k);
    if (el) el.style.display = (filter === 'all' || filter === k) ? '' : 'none';
  });
}
function togglePast() {
  const list = document.getElementById('past-list');
  const btn = document.getElementById('past-toggle-btn');
  const hidden = list.style.display === 'none';
  list.style.display = hidden ? '' : 'none';
  btn.textContent = hidden ? '접기' : '펼치기';
}

// ── Admin Event ──
function onEventChange(val) {
  const summary = document.getElementById('event-summary');
  const grid = document.getElementById('photo-grid');
  if (!val) {
    summary.textContent = '행사를 선택해 주세요';
    grid.innerHTML = '<div class="empty-state" style="grid-column:1/-1;"><div class="empty-icon">🗂️</div><div class="empty-title">확인할 결혼식을 먼저 선택해 주세요</div><div class="empty-desc">드롭다운에서 행사를 선택하면 사진 현황을 확인할 수 있습니다</div></div>';
    return;
  }
  if (val === 'evt-1' || val === 'evt-2' || val === 'evt-3' || val === 'evt-5') {
    summary.textContent = '선택한 행사에 업로드된 사진이 아직 없어요';
    grid.innerHTML = '<div class="empty-state" style="grid-column:1/-1;"><div class="empty-icon">📂</div><div class="empty-title">아직 업로드된 사진이 없어요</div><div class="empty-desc">하객이 입장하여 사진을 업로드하면 여기에 표시됩니다</div></div>';
  } else if (val === 'evt-4') {
    summary.textContent = '권영재 ♥ 류하란 · 2026-06-02 · 하객 3명 · 사진 2장';
    restoreGrid();
  } else {
    summary.textContent = '김민준 ♥ 이지은 · 2025-11-23 · 하객 87명 · 사진 142장';
    grid.innerHTML = '<div class="empty-state" style="grid-column:1/-1;"><div class="empty-icon">📸</div><div class="empty-title">지난 행사 데이터를 불러오는 중...</div><div class="empty-desc">아카이브된 데이터는 별도 확인이 필요할 수 있습니다</div></div>';
  }
}
function restoreGrid() {
  const grid = document.getElementById('photo-grid');
  grid.innerHTML =
    '<div class="admin-thumb"><img src="data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'200\' height=\'200\' viewBox=\'0 0 200 200\'%3E%3Crect width=\'200\' height=\'200\' fill=\'%23F3EDE3\'/%3E%3Ccircle cx=\'100\' cy=\'80\' r=\'30\' fill=\'%23E8C9BA\'/%3E%3Crect x=\'60\' y=\'120\' width=\'80\' height=\'60\' rx=\'6\' fill=\'%23C5826A\' opacity=\'0.4\'/%3E%3C/svg%3E" alt=""><span class="thumb-badge">[신랑측] 홍길동 · 14:23</span></div>' +
    '<div class="admin-thumb"><img src="data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'200\' height=\'200\' viewBox=\'0 0 200 200\'%3E%3Crect width=\'200\' height=\'200\' fill=\'%23F3EDE3\'/%3E%3Ccircle cx=\'70\' cy=\'80\' r=\'28\' fill=\'%23E8C9BA\'/%3E%3Ccircle cx=\'130\' cy=\'80\' r=\'28\' fill=\'%23E8C9BA\'/%3E%3Crect x=\'50\' y=\'120\' width=\'100\' height=\'60\' rx=\'6\' fill=\'%23C9A96E\' opacity=\'0.4\'/%3E%3C/svg%3E" alt=""><span class="thumb-badge">[신부측] 김철수 · 14:30</span></div>' +
    '<div class="admin-thumb"><img src="data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'200\' height=\'200\' viewBox=\'0 0 200 200\'%3E%3Crect width=\'200\' height=\'200\' fill=\'%23F3EDE3\'/%3E%3Ccircle cx=\'100\' cy=\'80\' r=\'32\' fill=\'%23E8C9BA\'/%3E%3Crect x=\'55\' y=\'120\' width=\'90\' height=\'55\' rx=\'6\' fill=\'%238B4A38\' opacity=\'0.3\'/%3E%3C/svg%3E" alt=""><span class="thumb-badge">[신랑측] 최도현 · 15:01</span></div>' +
    '<div class="admin-thumb"><div style="text-align:center;"><div style="font-size:28px;margin-bottom:4px;opacity:0.5;">📸</div><div>사진 더보기</div></div></div>';
}

// ── Toast ──
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2000);
}