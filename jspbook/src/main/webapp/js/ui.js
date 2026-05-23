// =====================================================
//  ui.js — 화면 전환 / 토스트 / 네비게이션
// =====================================================

function showScreen(name, skipHistory = false) {
  const prev = currentScreenName;
  if (prev === name) return;

  const isSlide = (prev === 'upload' && name === 'gallery') || (prev === 'gallery' && name === 'upload');
  const goingRight = screenOrder.indexOf(name) > screenOrder.indexOf(prev);

  if (!skipHistory && prev !== 'landing') screenHistory.push(prev);
  currentScreenName = name;

  if (name === 'landing' || name === 'admin' || name === 'qr' || name === 'operator' || name === 'login') {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById('slide-wrapper').style.display = 'none';
    document.getElementById('main-nav').style.display = 'none';
    document.querySelectorAll('.screen-body').forEach(b => b.style.display = 'none');
    document.getElementById('screen-' + name).classList.add('active');
    if (name === 'admin') renderAdminGrid();
    if (name === 'operator') renderOperatorDashboard();
    return;
  }

  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById('main-nav').style.display = 'flex';
  document.getElementById('slide-wrapper').style.display = 'block';

  document.getElementById('nav-upload-btn').className = name === 'upload' ? 'active' : '';
  document.getElementById('nav-gallery-btn').className = name === 'gallery' ? 'active' : '';

  const nextEl = document.getElementById('screen-' + name);
  const prevEl = (prev === 'upload' || prev === 'gallery') ? document.getElementById('screen-' + prev) : null;

  if (isSlide && prevEl) {
    prevEl.style.display = 'block';
    nextEl.style.display = 'block';
    prevEl.classList.remove('is-active');
    prevEl.classList.add(goingRight ? 'slide-out-left' : 'slide-out-right');
    nextEl.classList.add(goingRight ? 'slide-from-right' : 'slide-from-left');
    setTimeout(() => {
      prevEl.style.display = 'none';
      prevEl.classList.remove('slide-out-left', 'slide-out-right');
      nextEl.classList.remove('slide-from-right', 'slide-from-left');
      nextEl.classList.add('is-active');
    }, 300);
  } else {
    if (prevEl) {
      prevEl.style.display = 'none';
      prevEl.classList.remove('is-active');
    }
    nextEl.style.display = 'block';
    nextEl.classList.add('is-active');
  }

  if (name === 'gallery') renderTimeline();
}

function goBack(from) {
  const prev = screenHistory[screenHistory.length - 1];
  if (prev) {
    screenHistory.pop();
    showScreen(prev, true);
  } else {
    showToast('더 이상 뒤로 갈 수 없어요');
  }
}

// ── 사이트 관리 (DB 연동) ─────────────

function formatDate(dateStr) {
  if (!dateStr) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return '';
  return d.toISOString().split('T')[0];
}

function getSiteStatusByDate(dateStr) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = new Date(dateStr);
  d.setHours(0, 0, 0, 0);
  if (d.getTime() === today.getTime()) return 'today';
  if (d > today) return 'future';
  return 'past';
}

function getDday(dateStr) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = new Date(dateStr);
  d.setHours(0, 0, 0, 0);
  const diff = Math.round((d - today) / 86400000);
  if (diff === 0) return 'D-DAY';
  if (diff > 0) return `D-${diff}`;
  return `D+${Math.abs(diff)}`;
}

let manageSearchKeyword = '';
let manageSortType = 'weddingDateDesc';
let manageStatusFilter = 'all';
let managePastCollapsed = true;

function setManageSearchKeyword(value) {
  manageSearchKeyword = (value || '').trim().toLowerCase();
  renderManageScreen();
}

function setManageSort(value) {
  manageSortType = value || 'weddingDateDesc';
  renderManageScreen();
}

function setManageStatusFilter(filter) {
  manageStatusFilter = filter || 'all';
  const ids = ['all', 'today', 'future', 'past'];
  ids.forEach((key) => {
    const btn = document.getElementById(`manage-filter-${key}`);
    if (!btn) return;
    btn.classList.toggle('active', key === manageStatusFilter);
  });
  renderManageScreen();
}

function togglePastSection(forceOpen) {
  if (typeof forceOpen === 'boolean') {
    managePastCollapsed = !forceOpen;
  } else {
    managePastCollapsed = !managePastCollapsed;
  }
  syncPastSection();
}

function syncPastSection() {
  const wrap = document.getElementById('past-list-wrap');
  const toggle = document.getElementById('manage-past-toggle');
  if (wrap) wrap.style.display = managePastCollapsed ? 'none' : 'block';
  if (toggle) toggle.textContent = managePastCollapsed ? '펼치기' : '접기';
}

function compareManageItems(a, b) {
  const dateA = a.weddingDate || a.date || '';
  const dateB = b.weddingDate || b.date || '';
  const createdA = a.createdAt || '';
  const createdB = b.createdAt || '';

  switch (manageSortType) {
    case 'weddingDateAsc':
      return dateA.localeCompare(dateB);
    case 'createdAtDesc':
      return createdB.localeCompare(createdA);
    case 'photoCountDesc':
      return (b.photoCount || 0) - (a.photoCount || 0) || dateB.localeCompare(dateA);
    case 'guestCountDesc':
      return (b.guestCount || 0) - (a.guestCount || 0) || dateB.localeCompare(dateA);
    case 'weddingDateDesc':
    default:
      return dateB.localeCompare(dateA);
  }
}

function matchesManageSearch(item) {
  if (!manageSearchKeyword) return true;
  const haystack = [
    item.groom,
    item.bride,
    item.eventCode,
    item.date,
    item.weddingDate,
    getDday(item.date)
  ].filter(Boolean).join(' ').toLowerCase();
  return haystack.includes(manageSearchKeyword);
}

function updateManageSummary(allItems, filteredItems, today, future, past) {
  const total = document.getElementById('manage-total');
  const todayCount = document.getElementById('today-count');
  const futureCount = document.getElementById('future-count');
  const pastCount = document.getElementById('past-count');

  if (total) {
    total.textContent = filteredItems.length === allItems.length
      ? `총 ${allItems.length}건`
      : `검색 ${filteredItems.length}건 · 전체 ${allItems.length}건`;
  }
  if (todayCount) todayCount.textContent = `${today.length}건`;
  if (futureCount) futureCount.textContent = `${future.length}건`;
  if (pastCount) pastCount.textContent = `${past.length}건`;
}

function applyManageSectionVisibility(today, future, past) {
  const sections = {
    today: document.getElementById('manage-today-section'),
    future: document.getElementById('manage-future-section'),
    past: document.getElementById('manage-past-section')
  };
  const visible = {
    today: manageStatusFilter === 'all' || manageStatusFilter === 'today',
    future: manageStatusFilter === 'all' || manageStatusFilter === 'future',
    past: manageStatusFilter === 'all' || manageStatusFilter === 'past'
  };

  Object.entries(sections).forEach(([key, el]) => {
    if (!el) return;
    el.style.display = visible[key] ? '' : 'none';
  });

  if (manageStatusFilter === 'past' && past.length) {
    togglePastSection(true);
  } else {
    syncPastSection();
  }
}

async function renderManageScreen() {
  const allItems = [];
  try {
    const events = await api_listEvents();
    events.forEach(e => {
      const dateStr = formatDate(e.weddingDate || e.createdAt);
      const status = getSiteStatusByDate(dateStr);
      allItems.push({
        eventCode: e.eventCode,
        groom: e.groomName,
        bride: e.brideName,
        date: dateStr,
        createdAt: e.createdAt || '',
        weddingDate: e.weddingDate || '',
        qrStartDate: e.qrStartDate || '',
        qrEndDate: e.qrEndDate || '',
        guestCount: e.guestCount || 0,
        photoCount: e.photoCount || 0,
        status
      });
    });
  } catch (e) {
    console.error('Failed to load events:', e);
  }

  const searchInput = document.getElementById('manage-search');
  const sortSelect = document.getElementById('manage-sort');
  if (searchInput && searchInput.value !== manageSearchKeyword) searchInput.value = manageSearchKeyword;
  if (sortSelect && sortSelect.value !== manageSortType) sortSelect.value = manageSortType;

  const filteredItems = allItems
    .filter(item => matchesManageSearch(item))
    .filter(item => manageStatusFilter === 'all' ? true : item.status === manageStatusFilter)
    .sort(compareManageItems);

  const today = filteredItems.filter(item => item.status === 'today');
  const future = filteredItems.filter(item => item.status === 'future');
  const past = filteredItems.filter(item => item.status === 'past');

  updateManageSummary(allItems, filteredItems, today, future, past);
  applyManageSectionVisibility(today, future, past);
  renderTodaySiteList('today-list', today, 'today');
  renderCompactSiteList('future-list', future, 'future');
  renderCompactSiteList('past-list', past, 'past');
}

function renderTodaySiteList(containerId, sites, status) {
  const container = document.getElementById(containerId);
  if (!container) return;
  if (!sites.length) {
    container.innerHTML = '<div class="manage-empty">해당 결혼식이 없어요</div>';
    return;
  }
  container.innerHTML = '';
  sites.forEach((s) => {
    const statusColor = '#4CAF50';
    const bgColor = '#F7FBF4';
    const statusIcon = '🟢';
    const statusText = '입장 가능';

    const card = document.createElement('div');
    card.style.cssText = `background:${bgColor}; border:1px solid rgba(76,175,80,.18); border-radius:22px; padding:22px; cursor:pointer; transition:all 0.2s; box-shadow:0 12px 24px rgba(76,175,80,.06);`;
    card.onmouseover = () => {
      card.style.transform = 'translateY(-2px)';
      card.style.boxShadow = '0 16px 30px rgba(44,31,26,0.1)';
    };
    card.onmouseout = () => {
      card.style.transform = '';
      card.style.boxShadow = '0 12px 24px rgba(76,175,80,.06)';
    };
    card.onclick = () => openSiteManagePreview(s, status);
    card.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:12px; margin-bottom:16px;">
        <div>
          <div style="font-family:'Cormorant Garamond',serif; font-size:28px; color:var(--text); line-height:1.05; margin-bottom:4px;">${s.groom} ♥ ${s.bride}</div>
          <div style="font-size:12px; color:var(--text-muted);">${s.date} · ${s.eventCode}</div>
        </div>
        <div style="font-size:12px; font-weight:700; color:${statusColor}; background:white; padding:7px 12px; border-radius:999px; border:1px solid rgba(76,175,80,.2);">${getDday(s.date)}</div>
      </div>
      <div style="display:grid; grid-template-columns:repeat(3, 1fr); gap:10px; margin-bottom:16px;">
        <div style="padding:14px 12px; border-radius:16px; background:white; border:1px solid rgba(139,74,56,.08); text-align:center;"><div style="font-size:18px; font-weight:800; color:var(--deep-rose);">${s.guestCount || 0}</div><div style="font-size:10px; color:var(--text-muted); margin-top:4px;">참여 하객</div></div>
        <div style="padding:14px 12px; border-radius:16px; background:white; border:1px solid rgba(139,74,56,.08); text-align:center;"><div style="font-size:18px; font-weight:800; color:var(--deep-rose);">${s.photoCount || 0}</div><div style="font-size:10px; color:var(--text-muted); margin-top:4px;">업로드 사진</div></div>
        <div style="padding:14px 12px; border-radius:16px; background:white; border:1px solid rgba(139,74,56,.08); text-align:center;"><div style="font-size:18px; font-weight:800; color:var(--deep-rose);">${statusIcon}</div><div style="font-size:10px; color:var(--text-muted); margin-top:4px;">${statusText}</div></div>
      </div>
      <div style="display:flex; gap:8px; flex-wrap:wrap;">
        <button data-role="qr" style="flex:1; min-width:0; height:42px; border-radius:12px; border:1px solid var(--border); background:white; color:var(--text-soft); font-size:12px; font-weight:700; cursor:pointer;">QR 보기</button>
        <button data-role="copy" style="flex:1; min-width:0; height:42px; border-radius:12px; border:1px solid var(--border); background:white; color:var(--text-soft); font-size:12px; font-weight:700; cursor:pointer;">링크 복사</button>
        <button data-role="open" style="flex:1; min-width:0; height:42px; border-radius:12px; border:none; background:var(--deep-rose); color:white; font-size:12px; font-weight:700; cursor:pointer;">하객 화면</button>
      </div>`;

    card.querySelector('[data-role="qr"]').onclick = (event) => {
      stopActionPropagation(event);
      openSiteManagePreview(s, status);
    };
    card.querySelector('[data-role="copy"]').onclick = (event) => copySitePreviewLinkFromButton(event, s.eventCode);
    card.querySelector('[data-role="open"]').onclick = (event) => openSitePreviewLinkFromButton(event, s.eventCode);
    container.appendChild(card);
  });
}

function renderCompactSiteList(containerId, sites, status) {
  const container = document.getElementById(containerId);
  if (!container) return;
  if (!sites.length) {
    container.innerHTML = '<div class="manage-empty">해당 결혼식이 없어요</div>';
    return;
  }
  container.innerHTML = '';

  sites.forEach((s) => {
    const row = document.createElement('div');
    row.className = 'manage-row';
    row.onclick = () => openSiteManagePreview(s, status);
    row.innerHTML = `
      <div class="manage-row-main">
        <div class="manage-row-title">${s.groom} ♥ ${s.bride}</div>
        <div class="manage-row-meta">
          <span>${s.date}</span>
          <span>${getDday(s.date)}</span>
          <span>${s.eventCode}</span>
        </div>
      </div>
      <div class="manage-row-stats">
        <div class="manage-stat-chip"><strong>${s.guestCount || 0}</strong><span>하객</span></div>
        <div class="manage-stat-chip"><strong>${s.photoCount || 0}</strong><span>사진</span></div>
      </div>
      <div class="manage-row-actions">
        <button class="manage-row-btn" data-role="qr">QR</button>
        <button class="manage-row-btn" data-role="copy">링크</button>
        <button class="manage-row-btn primary" data-role="open">하객 화면</button>
        ${status === 'past' ? '<button class="manage-row-btn danger" data-role="hide">숨기기</button>' : ''}
      </div>`;

    row.querySelector('[data-role="qr"]').onclick = (event) => {
      stopActionPropagation(event);
      openSiteManagePreview(s, status);
    };
    row.querySelector('[data-role="copy"]').onclick = (event) => copySitePreviewLinkFromButton(event, s.eventCode);
    row.querySelector('[data-role="open"]').onclick = (event) => openSitePreviewLinkFromButton(event, s.eventCode);
    const hideBtn = row.querySelector('[data-role="hide"]');
    if (hideBtn) hideBtn.onclick = (event) => handleDeletePastEvent(event, s.eventCode);
    container.appendChild(row);
  });
}

async function handleDeletePastEvent(domEvent, eventCode) {
  if (domEvent) {
    domEvent.stopPropagation();
    domEvent.preventDefault();
  }

  const ok = window.confirm('이 지난 결혼식을 목록에서 숨길까요?\nDB에서는 소프트 삭제 처리되어 복구용 데이터는 남습니다.');
  if (!ok) return;

  try {
    const result = await api_deleteEvent(eventCode);
    if (!result.success) {
      showToast('숨기기에 실패했어요');
      return;
    }
    showToast('지난 결혼식을 숨겼어요');
    await renderManageScreen();
    await renderOperatorDashboard();
  } catch (e) {
    console.error('Failed to soft delete event:', e);
    showToast('숨기기에 실패했어요');
  }
}

function getSitePreviewStatusText(status) {
  if (status === 'today') return '오늘 바로 입장 가능한 행사예요.';
  if (status === 'future') return '예정된 결혼식이에요. QR을 미리 확인할 수 있어요.';
  return '지난 결혼식이에요. 기록 확인용 QR이에요.';
}

function getSitePreviewFileName() {
  const title = (document.getElementById('site-manage-preview-title')?.textContent || 'wedding-event')
    .replace(/\s*♥\s*/g, '_')
    .replace(/[^\w가-힣_-]+/g, '_')
    .replace(/^_+|_+$/g, '') || 'wedding-event';
  return title + '_qr.png';
}

function stopActionPropagation(domEvent) {
  if (!domEvent) return;
  domEvent.stopPropagation();
  domEvent.preventDefault();
}

function closeSiteManagePreview() {
  const modal = document.getElementById('site-manage-preview-modal');
  const canvas = document.getElementById('site-manage-preview-qr');
  if (canvas) canvas.innerHTML = '';
  if (modal) modal.style.display = 'none';
}

async function copySitePreviewLink() {
  const input = document.getElementById('site-manage-preview-link');
  if (!input || !input.value) {
    showToast('복사할 링크가 없어요');
    return;
  }

  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(input.value);
    } else {
      input.focus();
      input.select();
      document.execCommand('copy');
    }
    showToast('하객용 링크를 복사했어요');
  } catch (e) {
    console.error('Failed to copy preview link:', e);
    showToast('링크 복사에 실패했어요');
  }
}

async function copySitePreviewLinkFromButton(domEvent, eventCode) {
  stopActionPropagation(domEvent);
  try {
    const url = buildEventEntryUrl(eventCode);
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(url);
    } else {
      const temp = document.createElement('input');
      temp.value = url;
      document.body.appendChild(temp);
      temp.focus();
      temp.select();
      document.execCommand('copy');
      temp.remove();
    }
    showToast('하객용 링크를 복사했어요');
  } catch (e) {
    console.error('Failed to copy card link:', e);
    showToast('링크 복사에 실패했어요');
  }
}

function openSitePreviewLink() {
  const input = document.getElementById('site-manage-preview-link');
  if (!input || !input.value) {
    showToast('열 링크가 없어요');
    return;
  }
  window.open(input.value, '_blank');
}

function openSitePreviewLinkFromButton(domEvent, eventCode) {
  stopActionPropagation(domEvent);
  window.open(buildEventEntryUrl(eventCode), '_blank');
}

function downloadSitePreviewQr() {
  const canvas = document.querySelector('#site-manage-preview-qr canvas');
  if (!canvas) {
    showToast('먼저 QR을 불러와 주세요');
    return;
  }
  const a = document.createElement('a');
  a.download = getSitePreviewFileName();
  a.href = canvas.toDataURL('image/png');
  a.click();
  showToast('QR 이미지를 저장했어요');
}

function openSiteManagePreviewFromButton(domEvent, eventCode, status, groom, bride, date, guestCount, photoCount) {
  stopActionPropagation(domEvent);
  openSiteManagePreview({ eventCode, groom, bride, date, guestCount, photoCount }, status);
}

function openSiteManagePreview(site, status) {
  const modal = document.getElementById('site-manage-preview-modal');
  const title = document.getElementById('site-manage-preview-title');
  const date = document.getElementById('site-manage-preview-date');
  const statusEl = document.getElementById('site-manage-preview-status');
  const linkInput = document.getElementById('site-manage-preview-link');
  const qrWrap = document.getElementById('site-manage-preview-qr');

  if (!modal || !title || !date || !statusEl || !linkInput || !qrWrap) return;

  const entryUrl = buildEventEntryUrl(site.eventCode);

  title.textContent = site.groom + ' ♥ ' + site.bride;
  date.textContent = site.date || '-';
  statusEl.textContent = getSitePreviewStatusText(status);
  linkInput.value = entryUrl;
  qrWrap.innerHTML = '';
  new QRCode(qrWrap, {
    text: entryUrl,
    width: 180,
    height: 180,
    colorDark: '#2C1F1A',
    colorLight: '#FFFFFF',
    correctLevel: QRCode.CorrectLevel.H
  });

  modal.style.display = 'flex';
}

// ── 청첩장 / 웨딩사진 ──────────────────
const DUMMY_INVITATION = 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=400&q=80';
const DUMMY_WEDDING_PHOTOS = [
  'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=400&q=80',
  'https://images.unsplash.com/photo-1606216794074-735e91aa2c92?w=400&q=80',
  'https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=400&q=80',
  'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?w=400&q=80'
];

function showInvitationScreen() {
  const modal   = document.getElementById('invitation-modal');
  const imgView = document.getElementById('invitation-img-view');
  const urlView = document.getElementById('invitation-url-view');
  const imgEl   = document.getElementById('invitation-display-img');
  const ifrEl   = document.getElementById('invitation-display-iframe');

  const useUrl = typeof invitationType !== 'undefined'
    && invitationType === 'url'
    && typeof invitationUrl !== 'undefined'
    && !!invitationUrl;

  if (useUrl) {
    imgView.style.display = 'none';
    urlView.style.display = 'flex';
    ifrEl.src = invitationUrl;
  } else {
    imgEl.src = invitationData || DUMMY_INVITATION;
    imgView.style.display = 'flex';
    urlView.style.display = 'none';
  }
  modal.style.display = 'block';
}

function closeInvitationModal() {
  document.getElementById('invitation-modal').style.display = 'none';
  const ifrEl = document.getElementById('invitation-display-iframe');
  if (ifrEl) ifrEl.src = '';
}

function showWeddingPhotoScreen() {
  const photos = weddingPhotos.length > 0 ? weddingPhotos : DUMMY_WEDDING_PHOTOS;
  const grid = document.getElementById('wedding-display-grid');
  grid.innerHTML = '';
  photos.forEach(src => {
    const img = document.createElement('img');
    img.src = src;
    img.style.cssText = 'width:100%; aspect-ratio:1; object-fit:cover; border-radius:8px; border:1px solid var(--border);';
    grid.appendChild(img);
  });
  document.getElementById('wedding-photo-modal').style.display = 'flex';
}

function closeWeddingPhotoModal() {
  document.getElementById('wedding-photo-modal').style.display = 'none';
}

function openMenu() {
  document.getElementById('menu-panel').classList.add('open');
  document.getElementById('menu-overlay').classList.add('open');
}

function closeMenu() {
  document.getElementById('menu-panel').classList.remove('open');
  document.getElementById('menu-overlay').classList.remove('open');
}

function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2200);
}

function openPhotoViewer(src) {
  document.getElementById('photo-viewer-img').src = src;
  document.getElementById('photo-viewer-modal').style.display = 'flex';
}

function closePhotoViewer() {
  document.getElementById('photo-viewer-modal').style.display = 'none';
  document.getElementById('photo-viewer-img').src = '';
}

function opGoCreate() {
  document.getElementById('screen-operator').classList.remove('active');
  document.getElementById('screen-qr').classList.add('active');
  currentScreenName = 'qr';
}

async function opGoManage() {
  document.getElementById('screen-operator').classList.remove('active');
  document.getElementById('screen-manage').classList.add('active');
  currentScreenName = 'manage';
  await renderManageScreen();
}

async function opGoUploads() {
  // Operator 콘솔에 이미 로그인되어 있으므로 admin 코드 불필요
  currentScreenName = 'landing';
  showScreen('admin');
  return;
}

// ── Operator Console Login / Logout ──────────

async function handleOperatorLogin() {
  const username = document.getElementById('login-username').value.trim();
  const password = document.getElementById('login-password').value;
  const errorEl = document.getElementById('login-error');
  const btn = document.getElementById('login-btn');

  if (!username || !password) {
    errorEl.textContent = '아이디와 비밀번호를 입력해 주세요';
    return;
  }

  errorEl.textContent = '';
  btn.disabled = true;
  btn.innerHTML = '<span class="login-spinner"></span> 확인 중';

  try {
    const result = await api_operatorLogin(username, password);
    if (result.success) {
      document.getElementById('login-username').value = '';
      document.getElementById('login-password').value = '';
      showScreen('operator');
    } else {
      errorEl.textContent = result.error || '로그인에 실패했어요';
    }
  } catch (e) {
    errorEl.textContent = '서버 연결에 실패했어요';
    console.error('Operator login error:', e);
  }

  btn.disabled = false;
  btn.innerHTML = '로그인';
}

async function operatorLogout() {
  const ok = window.confirm('운영자 콘솔에서 로그아웃할까요?');
  if (!ok) return;

  try {
    await api_operatorLogout();
  } catch (e) {
    console.error('Operator logout error:', e);
  }

  // Admin 세션도 함께 정리
  try {
    await api_adminLogout();
  } catch (e) {
    // 무시
  }

  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById('main-nav').style.display = 'none';
  document.getElementById('slide-wrapper').style.display = 'none';
  document.querySelectorAll('.screen-body').forEach(b => b.style.display = 'none');
  document.getElementById('screen-login').classList.add('active');
  currentScreenName = 'login';
  showToast('로그아웃 되었습니다');
}

function opStatusClass(status) {
  if (status === 'today') return 'op-tag-live';
  if (status === 'future') return 'op-tag-ready';
  return 'op-tag-end';
}

function opStatusLabel(status) {
  if (status === 'today') return '당일';
  if (status === 'future') return '예정';
  return '지난';
}

async function renderOperatorDashboard() {
  const totalSitesEl = document.getElementById('op-stat-total-sites');
  const futureSitesEl = document.getElementById('op-stat-future-sites');
  const totalPhotosEl = document.getElementById('op-stat-total-photos');
  const totalGuestsEl = document.getElementById('op-stat-total-guests');
  const recentBodyEl = document.getElementById('op-recent-events-body');
  const heroSummaryEl = document.getElementById('op-hero-summary');
  const systemTitleEl = document.getElementById('op-system-title');
  const systemApiEl = document.getElementById('op-system-api');
  const systemDbEl = document.getElementById('op-system-db');
  const systemDashboardEl = document.getElementById('op-system-dashboard');

  if (!totalSitesEl || !recentBodyEl) return;

  totalSitesEl.textContent = '-';
  futureSitesEl.textContent = '-';
  totalPhotosEl.textContent = '-';
  totalGuestsEl.textContent = '-';
  recentBodyEl.innerHTML = '<tr><td colspan="4" style="padding:18px 0; color:rgba(62,41,34,.5);">불러오는 중...</td></tr>';

  try {
    const events = await api_listEvents();
    const normalized = events.map(e => {
      const date = formatDate(e.weddingDate || e.createdAt);
      return {
        ...e,
        date,
        status: getSiteStatusByDate(date),
        guestCount: e.guestCount || 0,
        photoCount: e.photoCount || 0
      };
    });

    const futureCount = normalized.filter(e => e.status === 'future').length;
    const totalPhotos = normalized.reduce((sum, e) => sum + (e.photoCount || 0), 0);
    const totalGuests = normalized.reduce((sum, e) => sum + (e.guestCount || 0), 0);
    const recentEvents = normalized
      .slice()
      .sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')))
      .slice(0, 3);

    totalSitesEl.textContent = String(normalized.length);
    futureSitesEl.textContent = String(futureCount);
    totalPhotosEl.textContent = String(totalPhotos);
    totalGuestsEl.textContent = String(totalGuests);

    if (heroSummaryEl) {
      heroSummaryEl.textContent = '현재 생성된 웨딩 사이트 ' + normalized.length + '건, 누적 업로드 사진 ' + totalPhotos + '장, 참여 하객 ' + totalGuests + '명을 기준으로 운영 현황을 한눈에 확인할 수 있습니다.';
    }

    if (systemTitleEl) systemTitleEl.textContent = '정상 운영';
    if (systemApiEl) systemApiEl.textContent = 'ONLINE';
    if (systemDbEl) systemDbEl.textContent = 'CONNECTED';
    if (systemDashboardEl) systemDashboardEl.textContent = normalized.length > 0 ? 'LIVE DATA' : 'READY';

    if (recentEvents.length === 0) {
      recentBodyEl.innerHTML = '<tr><td colspan="4" style="padding:18px 0; color:rgba(62,41,34,.5);">아직 생성된 사이트가 없어요</td></tr>';
      return;
    }

    recentBodyEl.innerHTML = recentEvents.map(event => {
      const status = event.status;
      const date = event.date || '-';
      return '<tr>' +
        '<td><div class="op-event-name">' + event.groomName + ' ♥ ' + event.brideName + '</div></td>' +
        '<td>' + date + '</td>' +
        '<td>' + (event.photoCount || 0) + '장</td>' +
        '<td><span class="op-tag ' + opStatusClass(status) + '">' + opStatusLabel(status) + '</span></td>' +
      '</tr>';
    }).join('');
  } catch (e) {
    console.error('Failed to render operator dashboard:', e);
    if (systemTitleEl) systemTitleEl.textContent = '확인 필요';
    if (systemApiEl) systemApiEl.textContent = 'ERROR';
    if (systemDbEl) systemDbEl.textContent = 'ERROR';
    if (systemDashboardEl) systemDashboardEl.textContent = 'ERROR';
    recentBodyEl.innerHTML = '<tr><td colspan="4" style="padding:18px 0; color:#b05a5a;">이벤트 데이터를 불러오지 못했어요</td></tr>';
  }
}

const DEFAULT_TIMETABLE_ITEMS = [
  { time: '13:30', title: '하객 입장 시작', desc: '사진 업로드와 방명 메시지를 천천히 남겨주세요.' },
  { time: '14:00', title: '예식 시작', desc: '예식 진행 중에는 촬영 동선을 배려해 주세요.' },
  { time: '14:40', title: '단체 사진', desc: '안내에 따라 양가 가족 및 지인 촬영이 진행돼요.' },
  { time: '15:00', title: '식사 및 자유 촬영', desc: '갤러리에 오늘의 순간을 계속 올릴 수 있어요.' }
];

const DEFAULT_FAQ_ITEMS = [
  { q: '사진은 몇 장까지 올릴 수 있나요?', a: '한 번에 최대 5장까지 업로드할 수 있어요.' },
  { q: '이름이나 관계를 잘못 입력했어요.', a: '메뉴의 하객 정보 변경에서 다시 입장 정보를 바꿀 수 있어요.' },
  { q: '내가 올린 글은 어떻게 지우나요?', a: '같은 기기에서 입장한 본인 글은 갤러리에서 바로 삭제할 수 있어요.' },
  { q: '사진이 바로 안 보이면 어떻게 하나요?', a: '갤러리에서 새로고침 버튼을 눌러 최신 업로드를 다시 불러와 주세요.' }
];

function getCurrentCoupleLabel() {
  const groom = document.getElementById('groom-name')?.textContent?.trim() || '신랑';
  const bride = document.getElementById('bride-name')?.textContent?.trim() || '신부';
  return `${groom} ♥ ${bride}`;
}

function openTimelineModal() {
  const body = document.getElementById('timeline-menu-body');
  const title = document.getElementById('timeline-menu-title');
  if (!body || !title) return;

  title.textContent = `${getCurrentCoupleLabel()} 예식 타임테이블`;
  body.innerHTML = DEFAULT_TIMETABLE_ITEMS.map(item => `
    <div style="display:flex; gap:14px; padding:14px 0; border-bottom:1px solid var(--border);">
      <div style="min-width:56px; font-size:15px; font-weight:700; color:var(--deep-rose);">${item.time}</div>
      <div>
        <div style="font-size:14px; font-weight:600; color:var(--text); margin-bottom:4px;">${item.title}</div>
        <div style="font-size:12px; color:var(--text-muted); line-height:1.6;">${item.desc}</div>
      </div>
    </div>
  `).join('');

  closeMenu();
  document.getElementById('timeline-menu-modal').style.display = 'flex';
}

function closeTimelineModal() {
  document.getElementById('timeline-menu-modal').style.display = 'none';
}

function openFaqModal() {
  const body = document.getElementById('faq-menu-body');
  const title = document.getElementById('faq-menu-title');
  if (!body || !title) return;

  title.textContent = `${getCurrentCoupleLabel()} 안내 FAQ`;
  body.innerHTML = DEFAULT_FAQ_ITEMS.map(item => `
    <div style="padding:14px 0; border-bottom:1px solid var(--border);">
      <div style="font-size:13px; font-weight:700; color:var(--deep-rose); margin-bottom:6px;">Q. ${item.q}</div>
      <div style="font-size:12px; color:var(--text-muted); line-height:1.7;">${item.a}</div>
    </div>
  `).join('');

  closeMenu();
  document.getElementById('faq-menu-modal').style.display = 'flex';
}

function closeFaqModal() {
  document.getElementById('faq-menu-modal').style.display = 'none';
}

function openGuestIdentityModal() {
  const summary = document.getElementById('guest-identity-summary');
  const note = document.getElementById('guest-identity-note');
  if (!summary || !note) return;

  const hasIdentity = !!(currentNick || currentNickname || currentCategory || currentSide);
  if (hasIdentity) {
    const nick = currentNick || currentNickname || '하객';
    const parts = [currentSide, currentCategory, nick].filter(Boolean);
    summary.textContent = parts.join(' · ');
    note.innerHTML = '변경하면 <strong>이후 업로드부터</strong> 새 정보가 적용돼요.<br>이미 올린 게시물의 작성자는 바뀌지 않아요.';
  } else {
    summary.textContent = '아직 저장된 하객 정보가 없어요';
    note.textContent = '입장 화면으로 돌아가 새 정보를 입력할 수 있어요.';
  }

  document.getElementById('guest-identity-modal').style.display = 'flex';
}

function closeGuestIdentityModal() {
  document.getElementById('guest-identity-modal').style.display = 'none';
}

// ── 초기화 ──────────────────────────────

async function initApp() {
  // URL에 mode=entry 파라미터가 있으면 qr.js가 처리하므로 여기서는 건너뜀
  const params = new URLSearchParams(window.location.search);
  if (params.get('mode') === 'entry') return;

  const operatorScreen = document.getElementById('screen-operator');
  if (operatorScreen && operatorScreen.classList.contains('active')) {
    renderOperatorDashboard();
  }

  // 운영자 세션 확인
  try {
    const status = await api_operatorStatus();
    if (status && status.authenticated) {
      showScreen('operator');
      return;
    }
  } catch (e) {
    console.error('Operator session check failed:', e);
  }

  // 로그인 화면 — username에 포커스
  document.getElementById('login-username').focus();
}

document.addEventListener('DOMContentLoaded', initApp);
