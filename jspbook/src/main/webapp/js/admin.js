// =====================================================
//  admin.js — 관리자 페이지 / 삭제 모달
// =====================================================

// ── 로그인 모달 ───────────────────────────────────

function openAdminModal() {
  document.getElementById('admin-code-input').value = '';
  document.getElementById('admin-code-error').textContent = '';
  document.getElementById('admin-login-modal').style.display = 'flex';
  setTimeout(() => document.getElementById('admin-code-input').focus(), 100);
}

function closeAdminModal() {
  document.getElementById('admin-login-modal').style.display = 'none';
}

async function submitAdminCode() {
  const input = document.getElementById('admin-code-input').value.trim();
  if (!input) {
    document.getElementById('admin-code-error').textContent = '관리자 코드를 입력해 주세요';
    return;
  }

  const result = await api_adminLogin(input);
  if (result.success) {
    closeAdminModal();
    // QR 입장 모드: URL의 code를 admin 페이지에 바로 매핑
    if (currentEventCode) {
      adminEventCode = currentEventCode;
    }
    currentScreenName = 'landing';
    showScreen('admin');
    return;
  }

  document.getElementById('admin-code-error').textContent = result.error || '코드가 올바르지 않아요';
  document.getElementById('admin-code-input').value = '';
  document.getElementById('admin-code-input').focus();
}

async function adminLogout() {
  // URL 파라미터를 제거하기 전에 entry 정보 저장
  const params = new URLSearchParams(window.location.search);
  const wasEntryMode = params.get('mode') === 'entry';
  const entryCode = params.get('code') || adminEventCode || currentEventCode || '';

  await api_adminLogout();
  screenHistory = [];
  currentEventCode = '';
  currentEventInfo = null;
  adminEventCode = '';
  posts = [];

  if (window.history && window.history.replaceState) {
    window.history.replaceState({}, document.title, window.location.pathname);
  }

  // QR 입장 모드였으면 → 해당 QR 입장 화면으로 복귀 (페이지 리로드)
  if (wasEntryMode && entryCode) {
    window.location.href = window.location.pathname + '?mode=entry&code=' + entryCode;
    return;
  }

  // 일반 로그아웃 — 운영자 세션 있으면 콘솔, 없으면 로그인 화면
  const groomEl = document.getElementById('groom-name');
  const brideEl = document.getElementById('bride-name');
  if (groomEl) groomEl.textContent = '신랑';
  if (brideEl) brideEl.textContent = '신부';
  document.querySelectorAll('.nav-couple').forEach(el => el.textContent = '신랑 ♥ 신부');
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById('main-nav').style.display = 'none';
  document.getElementById('slide-wrapper').style.display = 'none';
  document.querySelectorAll('.screen-body').forEach(b => {
    b.style.display = 'none';
    b.classList.remove('is-active', 'slide-out-left', 'slide-out-right', 'slide-from-right', 'slide-from-left');
  });

  try {
    const status = await api_operatorStatus();
    if (status && status.authenticated) {
      currentScreenName = 'operator';
      document.getElementById('screen-operator').classList.add('active');
      renderOperatorDashboard();
    } else {
      currentScreenName = 'login';
      document.getElementById('screen-login').classList.add('active');
    }
  } catch (e) {
    currentScreenName = 'login';
    document.getElementById('screen-login').classList.add('active');
  }

  showToast('로그아웃 되었습니다');
}

async function adminGoHome() {
  screenHistory = [];
  currentScreenName = 'operator';
  currentEventCode = '';
  currentEventInfo = null;
  adminEventCode = '';
  posts = [];
  if (window.history && window.history.replaceState) {
    window.history.replaceState({}, document.title, window.location.pathname);
  }
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById('main-nav').style.display = 'none';
  document.getElementById('slide-wrapper').style.display = 'none';
  document.querySelectorAll('.screen-body').forEach(b => {
    b.style.display = 'none';
    b.classList.remove('is-active', 'slide-out-left', 'slide-out-right', 'slide-from-right', 'slide-from-left');
  });
  document.getElementById('screen-operator').classList.add('active');
  await renderOperatorDashboard();
  showToast('운영자 홈으로 이동했어요');
}

// ── 그리드 렌더링 ─────────────────────────────────

function setAdminFilter(filter) {
  adminFilter = filter;
  const map = { all: 'admin-filter-all', '신랑': 'admin-filter-groom', '신부': 'admin-filter-bride' };
  Object.entries(map).forEach(([key, id]) => {
    const btn = document.getElementById(id);
    const isActive = key === filter;
    btn.style.background = isActive ? 'var(--white)' : 'transparent';
    btn.style.color = isActive ? 'var(--deep-rose)' : 'var(--text-muted)';
    btn.style.boxShadow = isActive ? '0 1px 3px var(--shadow)' : 'none';
  });
  renderAdminGrid();
}

function getAdminSelectedEvent() {
  return adminEvents.find(event => event.eventCode === adminEventCode) || null;
}

function getAdminFilteredPosts() {
  if (adminFilter === 'all') return posts;
  return posts.filter(p => normalizeAdminSideLabel(p.side) === adminFilter);
}

function normalizeAdminSideLabel(side) {
  if (!side) return '';
  return String(side).replace(/측$/,'');
}

function renderAdminEventSummary() {
  const summary = document.getElementById('admin-event-summary');
  const selected = getAdminSelectedEvent();
  if (!summary) return;
  if (!selected) {
    summary.textContent = '';
    return;
  }
  summary.textContent = `${selected.groomName} ♥ ${selected.brideName} · ${selected.weddingDate || '-'} · 하객 ${selected.guestCount || 0}명 · 사진 ${selected.photoCount || 0}장`;
}

function renderAdminEventOptions() {
  const select = document.getElementById('admin-event-select');
  if (!select) return;
  const previous = adminEventCode;
  select.innerHTML = '<option value="">행사를 선택해 주세요</option>';
  adminEvents.forEach(event => {
    const option = document.createElement('option');
    option.value = event.eventCode;
    option.textContent = `${event.groomName} ♥ ${event.brideName} · ${event.weddingDate || '-'}`;
    select.appendChild(option);
  });

  if (!adminEvents.length) {
    adminEventCode = '';
    select.value = '';
    renderAdminEventSummary();
    return;
  }

  // 이전에 선택한 행사가 유효하면 복원, 아니면 빈 상태 유지 (자동선택 안함)
  if (previous && adminEvents.some(event => event.eventCode === previous)) {
    adminEventCode = previous;
    select.value = adminEventCode;
  } else {
    adminEventCode = '';
    select.value = '';
  }
  renderAdminEventSummary();
}

async function loadAdminEvents() {
  try {
    const events = await api_listEvents();
    adminEvents = [...events].sort((a, b) => (b.weddingDate || '').localeCompare(a.weddingDate || ''));
  } catch (e) {
    console.error('행사 목록 로드 실패:', e);
    adminEvents = [];
  }
  renderAdminEventOptions();
}

async function setAdminEventCode(eventCode) {
  adminEventCode = eventCode || '';
  currentEventCode = adminEventCode;
  const select = document.getElementById('admin-event-select');
  if (select && select.value !== adminEventCode) select.value = adminEventCode;
  renderAdminEventSummary();
  // 선택한 행사의 신랑/신부 이름을 nav에 반영
  const selected = getAdminSelectedEvent();
  document.querySelectorAll('.nav-couple').forEach(el => {
    el.textContent = selected ? `${selected.groomName} ♥ ${selected.brideName}` : '신랑 ♥ 신부';
  });
  await renderAdminGrid();
}

function renderAdminMessageList(filteredPosts) {
  const list = document.getElementById('admin-message-list');
  const count = document.getElementById('admin-message-count');
  if (!list || !count) return;

  const selected = getAdminSelectedEvent();
  if (!selected) {
    count.textContent = '0건';
    list.innerHTML = '<div style="text-align:center; padding:24px 16px; color:var(--text-muted); font-size:13px;"></div>';
    return;
  }

  count.textContent = `${filteredPosts.length}건`;
  if (!filteredPosts.length) {
    list.innerHTML = '<div style="text-align:center; padding:24px 16px; color:var(--text-muted); font-size:13px;">선택한 행사에는 아직 게시물이 없어요.</div>';
    return;
  }

  list.innerHTML = '';
  filteredPosts.forEach(post => {
    const card = document.createElement('div');
    const normalizedSide = normalizeAdminSideLabel(post.side);
    const sideColor = normalizedSide === '신랑' ? '#4E6A8F' : normalizedSide === '신부' ? '#A85C77' : 'var(--deep-rose)';
    const photos = post.photos || [];
    card.style.cssText = 'border:1px solid var(--border); border-radius:14px; padding:14px; background:#FFFCFA;';
    card.innerHTML = `
      <div style="display:flex; align-items:flex-start; justify-content:space-between; gap:12px; margin-bottom:8px;">
        <div>
          <div style="font-size:13px; font-weight:700; color:var(--text);">${post.displayName || post.name || '-'}</div>
          <div style="font-size:11px; color:${sideColor}; margin-top:3px;">${normalizedSide || '-'}측 · ${post.category || '-'} · ${post.time || ''}</div>
        </div>
        <div style="font-size:11px; color:var(--text-muted); white-space:nowrap;">사진 ${photos.length}장 · 좋아요 ${post.likes || 0}</div>
      </div>
      <div style="font-size:13px; color:var(--text-soft); line-height:1.7; margin-bottom:${photos.length ? '10px' : '0'};">${post.msg && post.msg.trim() ? post.msg : '(사진만 공유)'}</div>
      ${photos.length ? `<div style="display:flex; gap:8px; flex-wrap:wrap;">${photos.map((src, index) => `<img src="${src}" onclick="openPhotoViewer('${src}')" style="width:72px; height:72px; object-fit:cover; border-radius:10px; border:1px solid var(--border); cursor:pointer;">`).join('')}</div>` : ''}
    `;
    list.appendChild(card);
  });
}

async function renderAdminGrid() {
  if (!adminEvents.length) {
    await loadAdminEvents();
  }

  if (!adminEventCode && adminEvents.length) {
    renderAdminEventOptions();
  }
  currentEventCode = adminEventCode;

  // nav-couple을 선택한 행사의 신랑/신부 이름으로 업데이트
  if (adminEventCode) {
    const selected = getAdminSelectedEvent();
    document.querySelectorAll('.nav-couple').forEach(el => {
      el.textContent = selected ? `${selected.groomName} ♥ ${selected.brideName}` : '신랑 ♥ 신부';
    });
  }

  await loadPosts();

  const grid = document.getElementById('admin-grid');
  if (!grid) return;

  const filteredPosts = getAdminFilteredPosts();
  const allPhotos = filteredPosts.flatMap((p) =>
    (p.photos || []).map((src) => ({
      src,
      postId: p.id,
      name: p.nick || p.name,
      time: p.time,
      side: p.side,
      canAdminDelete: !!p.canAdminDelete
    }))
  );

  const totalPhotos = posts.flatMap(p => p.photos || []).length;
  const totalGuests = posts.length;
  const totalMessages = posts.filter(p => p.msg && p.msg !== '(사진만 공유)').length;
  document.querySelector('.stat-card:nth-child(1) .stat-value').textContent = totalPhotos;
  document.querySelector('.stat-card:nth-child(2) .stat-value').textContent = totalGuests;
  document.querySelector('.stat-card:nth-child(3) .stat-value').textContent = totalMessages;

  grid.innerHTML = '';
  if (!adminEventCode) {
    grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:40px 20px;color:var(--text-muted);">
      <div style="font-size:28px;margin-bottom:8px;opacity:0.4;">🗂️</div>
      <div style="font-size:13px;">확인할 결혼식을 먼저 선택해 주세요</div></div>`;
    renderAdminMessageList([]);
    return;
  }

  if (allPhotos.length === 0) {
    const msg = adminFilter === 'all' ? '선택한 행사에 업로드된 사진이 아직 없어요' : `${adminFilter}측 사진이 아직 없어요`;
    grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:40px 20px;color:var(--text-muted);">
      <div style="font-size:28px;margin-bottom:8px;opacity:0.4;">📂</div>
      <div style="font-size:13px;">${msg}</div></div>`;
    renderAdminMessageList(filteredPosts);
    return;
  }

  allPhotos.forEach((item, i) => {
    const normalizedSide = normalizeAdminSideLabel(item.side);
    const borderColor = normalizedSide === '신랑' ? '#BDDFF7' : normalizedSide === '신부' ? '#F7C5D8' : 'var(--border)';
    const sideText = normalizedSide ? `[${normalizedSide}측] ` : '';
    const deleteButton = item.canAdminDelete
      ? `<button class="admin-icon-btn" id="delete-btn-${i}" onclick="confirmDelete(${item.postId}, true)" title="관리자 강제삭제">🗑</button>`
      : '';

    const wrap = document.createElement('div');
    wrap.className = 'admin-thumb-wrap';
    wrap.innerHTML = `
      <img src="${item.src}" style="width:100%;aspect-ratio:1;object-fit:cover;border-radius:8px;border:3px solid ${borderColor};cursor:pointer;display:block;">
      <div class="admin-thumb-badge" style="font-size:10px;background:rgba(44,31,26,0.55);color:white;position:absolute;bottom:4px;left:4px;right:4px;border-radius:4px;padding:2px 4px;text-align:center;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${sideText}${item.name} · ${item.time}</div>
      <div class="admin-thumb-actions">
        <button class="admin-icon-btn" onclick="openPhotoViewer('${item.src}')">🔍</button>
        <button class="admin-icon-btn" id="dl-btn-${i}" onclick="adminDownloadPhoto('${item.src}', ${i})">⬇</button>
        ${deleteButton}
      </div>`;
    grid.appendChild(wrap);
  });

  renderAdminMessageList(filteredPosts);
}

function adminDownloadPhoto(src, i) {
  const btn = document.getElementById('dl-btn-' + i);
  btn.textContent = '⏳';
  btn.disabled = true;
  showToast('다운로드 중 !');
  api_downloadPhoto(src, i).then(() => {
    btn.textContent = '✓';
    btn.style.color = 'var(--rose)';
    showToast('다운로드 완료 !');
    setTimeout(() => {
      btn.textContent = '⬇';
      btn.style.color = '';
      btn.disabled = false;
    }, 3000);
  });
}

async function downloadAll() {
  const res = await api_downloadAll();
  showToast(res.success ? '다운로드를 시작합니다' : '업로드된 사진이 아직 없어요');
}

// ── 삭제 ─────────────────────────────────────

function confirmDelete(postId, adminForce = false) {
  deleteTargetPostId = postId;
  const post = posts.find(p => p.id === postId);
  if (!post) {
    showToast('게시물을 찾을 수 없어요');
    deleteTargetPostId = null;
    return;
  }

  if (adminForce) {
    if (!post.canAdminDelete) {
      showToast('관리자 권한이 확인되지 않았어요');
      deleteTargetPostId = null;
      return;
    }

    if (window.confirm('이 게시물을 관리자 권한으로 강제삭제할까요?\n삭제 후에는 갤러리와 관리자 화면에서 즉시 사라집니다.')) {
      deletePost(true);
    } else {
      deleteTargetPostId = null;
    }
    return;
  }

  if (!post.canDelete) {
    showToast('내가 올린 게시물만 삭제할 수 있어요');
    deleteTargetPostId = null;
    return;
  }

  if (window.confirm('내가 올린 게시물을 삭제할까요?')) {
    deletePost(false);
  } else {
    deleteTargetPostId = null;
  }
}

async function deletePost(adminForce = false) {
  if (deleteTargetPostId === null) return;
  const post = posts.find(p => p.id === deleteTargetPostId);
  if (!post) {
    showToast('게시물을 찾을 수 없어요');
    deleteTargetPostId = null;
    return;
  }

  const res = await api_deletePost(post.id);
  if (!res.success) {
    showToast(res.error || '삭제에 실패했어요');
    deleteTargetPostId = null;
    return;
  }

  deleteTargetPostId = null;
  await loadPosts();
  renderTimeline();
  renderAdminGrid();
  showToast(adminForce ? '관리자 권한으로 게시물을 삭제했어요' : '게시물이 삭제되었어요');
}
