// =====================================================
//  gallery.js — 갤러리 렌더링 / 정렬 / 필터 / 좋아요
// =====================================================

function setFilter(filter) {
  currentFilter = filter;
  const map = { all: 'filter-all', '신랑': 'filter-groom', '신부': 'filter-bride' };
  Object.entries(map).forEach(([key, id]) => {
    const btn = document.getElementById(id);
    if (!btn) return;
    btn.classList.toggle('active', key === filter);
  });
  renderTimeline();
}

function setSort(type) {
  currentSort = type;
  const recentBtn  = document.getElementById('sort-recent');
  const popularBtn = document.getElementById('sort-popular');
  if (recentBtn)  recentBtn.classList.toggle('active', type === 'recent');
  if (popularBtn) popularBtn.classList.toggle('active', type === 'popular');
  renderTimeline();
}

async function renderTimeline() {
  await loadPosts();

  const container = document.getElementById('timeline');
  container.innerHTML = '';

  const filtered = currentFilter === 'all'
    ? posts
    : posts.filter(p => p.side === currentFilter);

  if (filtered.length === 0) {
    container.innerHTML = `
      <div style="text-align:center; padding:60px 20px; color:var(--text-muted);">
        <div style="font-size:36px; margin-bottom:12px; opacity:0.4;">📷</div>
        <div style="font-size:14px; line-height:1.7;">
          ${currentFilter === 'all'
            ? '아직 공유된 순간이 없어요<br>첫 번째 사진을 올려보세요!'
            : currentFilter + '측 게시물이 없어요'}
        </div>
      </div>`;
    document.getElementById('gallery-count').textContent = '총 0개의 순간';
    return;
  }

  const sorted = [...filtered].sort((a, b) =>
    currentSort === 'popular' ? (b.likes || 0) - (a.likes || 0) : 0
  );

  document.getElementById('gallery-count').textContent = `총 ${sorted.length}개의 순간`;

  sorted.forEach((p, i) => {
    const canAutoDelete = !!p.canDelete;
    const ownBadge = canAutoDelete
      ? `<span style="display:inline-flex;align-items:center;margin-left:6px;padding:2px 7px;border-radius:999px;background:rgba(197,132,108,0.12);color:var(--deep-rose);font-size:10px;font-weight:600;letter-spacing:0.2px;vertical-align:middle;">내 글</span>`
      : '';
    const item = document.createElement('div');
    item.className = 'timeline-item';
    item.style.animationDelay = (i * 0.05) + 's';

    item.innerHTML = `
      ${p.photos && p.photos.length > 0
        ? p.photos.map(src => `<img src="${src}" style="width:100%; display:block; object-fit:contain; background:#f3ede3; max-height:480px;">`).join('')
        : ''}
      <div class="timeline-content">
        <div class="timeline-meta">
          <div class="avatar" style="background:${p.color}">
            ${p.category === '직장동료' ? '🏢'
              : ['초등친구','중등친구','고등친구','대학동기'].includes(p.category) ? '🏫'
              : p.category === '가족' ? '🤍'
              : p.category === '군대동기' ? '🪖'
              : p.category ? '⭐'
              : p.name[0]}
          </div>
          <div class="timeline-name">
            ${p.side === '신랑' ? `<span style="font-size:11px;font-weight:500;margin-right:4px;background:#BDDFF7;color:#2E6B9E;padding:1px 6px;border-radius:4px;">[신랑측]</span>` : ''}
            ${p.side === '신부' ? `<span style="font-size:11px;font-weight:500;margin-right:4px;background:#F7C5D8;color:#9E2E55;padding:1px 6px;border-radius:4px;">[신부측]</span>` : ''}
            ${p.category ? `<span style="font-size:11px;color:var(--rose);font-weight:400;margin-right:4px;">[${p.category}]</span>` : ''}
            ${p.nick || p.name}
            ${ownBadge}
          </div>
          <div class="timeline-time">${p.time}</div>
        </div>
        <div class="timeline-msg">${p.msg}</div>
        <div class="timeline-actions">
          <button class="action-btn" id="like-btn-${p.id}" onclick="toggleLike(${p.id})" style="display:flex;align-items:center;gap:4px;">
            <span id="like-heart-${p.id}" style="font-size:15px;color:${p.liked ? '#C9A96E' : ''};">${p.liked ? '♥' : '♡'}</span>
            <span id="like-label-${p.id}" style="color:${p.liked ? '#C9A96E' : 'var(--text-muted)'};">좋아요</span>
            <span id="like-count-${p.id}" style="display:${p.likes > 0 ? 'inline' : 'none'};color:#C9A96E;font-size:11px;font-weight:500;">${p.likes}</span>
          </button>
          ${canAutoDelete
            ? `<button class="action-btn" onclick="confirmDelete(${p.id})" style="color:var(--rose);margin-left:auto;">🗑 내 글 삭제</button>`
            : `<button class="action-btn" onclick="showToast('신고 기능은 준비 중이에요')">⚑ 신고</button>`}
        </div>
      </div>`;
    container.appendChild(item);
  });
}

async function toggleLike(postId) {
  const p = posts.find(post => post.id === postId);
  if (!p) return;

  const btn = document.getElementById('like-btn-' + postId);
  if (btn) btn.disabled = true;

  try {
    const res = await api_toggleLike(postId);
    if (!res.success) {
      showToast(res.error || '좋아요 처리에 실패했어요');
      return;
    }

    p.liked = !!res.liked;
    p.likes = Number(res.likes || 0);

    const heart = document.getElementById('like-heart-' + postId);
    const label = document.getElementById('like-label-' + postId);
    const countEl = document.getElementById('like-count-' + postId);
    if (!heart || !label || !countEl) return;

    heart.textContent = p.liked ? '♥' : '♡';
    heart.style.color = p.liked ? '#C9A96E' : '';
    label.style.color = p.liked ? '#C9A96E' : 'var(--text-muted)';
    countEl.textContent = String(p.likes);
    countEl.style.display = p.likes > 0 ? 'inline' : 'none';

    if (currentSort === 'popular') {
      renderTimeline();
    }
  } catch (e) {
    console.error('좋아요 처리 실패:', e);
    showToast('좋아요 처리에 실패했어요');
  } finally {
    if (btn) btn.disabled = false;
  }
}
