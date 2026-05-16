// =====================================================
//  admin.js — 관리자 페이지 / 삭제 모달
// =====================================================

const ADMIN_CODE = 'a0000a';   // TODO: 서버 환경변수로 이동

// ── 로그인 모달 ───────────────────────────────────

function openAdminModal() {
  document.getElementById('admin-code-input').value   = '';
  document.getElementById('admin-code-error').textContent = '';
  document.getElementById('admin-login-modal').style.display = 'flex';
  setTimeout(() => document.getElementById('admin-code-input').focus(), 100);
}

function closeAdminModal() {
  document.getElementById('admin-login-modal').style.display = 'none';
}

function submitAdminCode() {
  const input = document.getElementById('admin-code-input').value;
  if (input === ADMIN_CODE) {
    closeAdminModal();
    currentScreenName = 'landing';
    renderAdminGrid();
    showScreen('admin');
  } else {
    document.getElementById('admin-code-error').textContent = '코드가 올바르지 않아요';
    document.getElementById('admin-code-input').value = '';
    document.getElementById('admin-code-input').focus();
  }
}

function adminLogout() {
  screenHistory = [];
  currentScreenName = 'landing';
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById('main-nav').style.display = 'none';
  document.getElementById('slide-wrapper').style.display = 'none';
  document.querySelectorAll('.screen-body').forEach(b => b.style.display = 'none');
  document.getElementById('screen-landing').classList.add('active');
  showToast('로그아웃 되었습니다');
}

// ── 그리드 렌더링 ─────────────────────────────────

function setAdminFilter(filter) {
  adminFilter = filter;
  const map = { all: 'admin-filter-all', '신랑': 'admin-filter-groom', '신부': 'admin-filter-bride' };
  Object.entries(map).forEach(([key, id]) => {
    const btn      = document.getElementById(id);
    const isActive = key === filter;
    btn.style.background = isActive ? 'var(--white)' : 'transparent';
    btn.style.color      = isActive ? 'var(--deep-rose)' : 'var(--text-muted)';
    btn.style.boxShadow  = isActive ? '0 1px 3px var(--shadow)' : 'none';
  });
  renderAdminGrid();
}

function renderAdminGrid() {
  const grid = document.getElementById('admin-grid');
  if (!grid) return;

  const filteredPosts = adminFilter === 'all'
    ? samplePosts
    : samplePosts.filter(p => p.side === adminFilter);

  const allPhotos = filteredPosts.flatMap((p) =>
    (p.photos || []).map((src) => ({ src, name: p.nick || p.name, time: p.time, side: p.side }))
  );

  // 통계는 항상 전체 기준
  const totalPhotos = samplePosts.flatMap(p => p.photos || []).length;
  document.querySelector('.stat-card:nth-child(1) .stat-value').textContent = totalPhotos;
  document.querySelector('.stat-card:nth-child(2) .stat-value').textContent = new Set(samplePosts.map(p => p.name)).size;
  document.querySelector('.stat-card:nth-child(3) .stat-value').textContent =
    samplePosts.filter(p => p.msg && p.msg !== '(사진만 공유)').length;

  grid.innerHTML = '';
  if (allPhotos.length === 0) {
    const msg = adminFilter === 'all' ? '아직 업로드된 게시물이 없어요' : adminFilter + '측 게시물이 없어요';
    grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:40px 20px;color:var(--text-muted);">
      <div style="font-size:28px;margin-bottom:8px;opacity:0.4;">📂</div>
      <div style="font-size:13px;">${msg}</div></div>`;
    return;
  }

  allPhotos.forEach((item, i) => {
    const borderColor = item.side === '신랑' ? '#BDDFF7' : item.side === '신부' ? '#F7C5D8' : 'var(--border)';
    const sideText    = item.side ? `[${item.side}측] ` : '';
    const wrap        = document.createElement('div');
    wrap.className    = 'admin-thumb-wrap';
    wrap.innerHTML    = `
      <img src="${item.src}" style="width:100%;aspect-ratio:1;object-fit:cover;border-radius:8px;border:3px solid ${borderColor};cursor:pointer;display:block;">
      <div class="admin-thumb-badge" style="font-size:10px;background:rgba(44,31,26,0.55);color:white;position:absolute;bottom:4px;left:4px;right:4px;border-radius:4px;padding:2px 4px;text-align:center;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${sideText}${item.name} · ${item.time}</div>
      <div class="admin-thumb-actions">
        <button class="admin-icon-btn" onclick="openPhotoViewer('${item.src}')">🔍</button>
        <button class="admin-icon-btn" id="dl-btn-${i}" onclick="adminDownloadPhoto('${item.src}', ${i})">⬇</button>
      </div>`;
    grid.appendChild(wrap);
  });
}

function adminDownloadPhoto(src, i) {
  const btn      = document.getElementById('dl-btn-' + i);
  btn.textContent = '⏳';
  btn.disabled    = true;
  showToast('다운로드 중 !');
  api_downloadPhoto(src, i).then(() => {
    btn.textContent    = '✓';
    btn.style.color    = 'var(--rose)';
    showToast('다운로드 완료 !');
    setTimeout(() => {
      btn.textContent  = '⬇';
      btn.style.color  = '';
      btn.disabled     = false;
    }, 3000);
  });
}

async function downloadAll() {
  const res = await api_downloadAll();
  showToast(res.success ? '다운로드를 시작합니다' : '업로드된 사진이 아직 없어요');
}

// ── 삭제 모달 ─────────────────────────────────────

function updateConfirmDots() {
  const val = document.getElementById('delete-pin-confirm').value;
  for (let i = 0; i < 4; i++) {
    document.getElementById('cdot-' + i).classList.toggle('filled', i < val.length);
  }
}

function confirmDelete(index) {
  deleteTargetIndex = index;
  document.getElementById('delete-pin-confirm').value  = '';
  document.getElementById('delete-pin-error').textContent = '';
  updateConfirmDots();
  document.getElementById('delete-modal').style.display = 'flex';
  setTimeout(() => document.getElementById('delete-pin-confirm').focus(), 100);
}

function closeDeleteModal() {
  document.getElementById('delete-modal').style.display = 'none';
  deleteTargetIndex = null;
}

async function deletePost() {
  if (deleteTargetIndex === null) return;
  const entered = document.getElementById('delete-pin-confirm').value.trim();
  const post    = samplePosts[deleteTargetIndex];
  const res     = await api_deletePost(post.id, entered);
  if (!res.success) {
    document.getElementById('delete-pin-error').textContent = res.error || '번호가 올바르지 않아요';
    document.getElementById('delete-pin-confirm').value = '';
    updateConfirmDots();
    document.getElementById('delete-pin-confirm').focus();
    return;
  }
  postCount = samplePosts.length;
  closeDeleteModal();
  renderTimeline();
  renderAdminGrid();
  showToast('게시물이 삭제되었어요');
}