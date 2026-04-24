// =====================================================
//  gallery.js — 갤러리 렌더링 / 정렬 / 필터 / 좋아요
// =====================================================

function setFilter(filter) {
  currentFilter = filter;
  const map = { all: 'filter-all', '신랑': 'filter-groom', '신부': 'filter-bride' };
  Object.entries(map).forEach(([key, id]) => {
    const btn     = document.getElementById(id);
    const isActive = key === filter;
    btn.style.background  = isActive ? 'var(--white)' : 'transparent';
    btn.style.color       = isActive ? 'var(--deep-rose)' : 'var(--text-muted)';
    btn.style.boxShadow   = isActive ? '0 1px 3px var(--shadow)' : 'none';
  });
  renderTimeline();
}

function setSort(type) {
  currentSort = type;
  const recentBtn  = document.getElementById('sort-recent');
  const popularBtn = document.getElementById('sort-popular');
  const on  = 'var(--white)';
  const off = 'transparent';
  recentBtn.style.background  = type === 'recent'  ? on : off;
  recentBtn.style.color       = type === 'recent'  ? 'var(--deep-rose)' : 'var(--text-muted)';
  recentBtn.style.boxShadow   = type === 'recent'  ? '0 1px 3px var(--shadow)' : 'none';
  popularBtn.style.background = type === 'popular' ? on : off;
  popularBtn.style.color      = type === 'popular' ? 'var(--deep-rose)' : 'var(--text-muted)';
  popularBtn.style.boxShadow  = type === 'popular' ? '0 1px 3px var(--shadow)' : 'none';
  renderTimeline();
}

function renderTimeline() {
  const container = document.getElementById('timeline');
  container.innerHTML = '';

  const filtered = currentFilter === 'all'
    ? samplePosts
    : samplePosts.filter(p => p.side === currentFilter);

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
    const realIndex = samplePosts.indexOf(p);
    const isOwn     = currentNickname && p.name === currentNickname;
    const item      = document.createElement('div');
    item.className  = 'timeline-item';
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
            ${isOwn ? `<span style="font-size:10px;color:var(--rose);font-weight:400;opacity:0.5;">나</span>` : ''}
          </div>
          <div class="timeline-time">${p.time}</div>
        </div>
        <div class="timeline-msg">${p.msg}</div>
        <div class="timeline-actions">
          <button class="action-btn" id="like-btn-${realIndex}" onclick="toggleLike(${realIndex})" style="display:flex;align-items:center;gap:4px;">
            <span id="like-heart-${realIndex}" style="font-size:15px;">${p.liked ? '♥' : '♡'}</span>
            <span style="color:${p.liked ? '#C9A96E' : 'var(--text-muted)'};">좋아요</span>
            <span id="like-count-${realIndex}" style="display:${p.likes > 0 ? 'inline' : 'none'};color:#C9A96E;font-size:11px;font-weight:500;">${p.likes}</span>
          </button>
          ${isOwn
            ? `<button class="action-btn" onclick="confirmDelete(${realIndex})" style="color:var(--rose);margin-left:auto;">🗑 삭제</button>`
            : `<button class="action-btn" onclick="showToast('신고되었습니다')">⚑ 신고</button>`}
        </div>
      </div>`;
    container.appendChild(item);
  });
}

function toggleLike(index) {
  const p    = samplePosts[index];
  p.liked    = !p.liked;
  p.likes    = p.liked ? p.likes + 1 : p.likes - 1;
  const heart   = document.getElementById('like-heart-'  + index);
  const countEl = document.getElementById('like-count-'  + index);
  const btn     = document.getElementById('like-btn-'    + index);
  heart.textContent  = p.liked ? '♥' : '♡';
  heart.style.color  = p.liked ? '#C9A96E' : '';
  btn.querySelector('span:nth-child(2)').style.color = p.liked ? '#C9A96E' : 'var(--text-muted)';
  countEl.textContent    = p.likes;
  countEl.style.display  = p.likes > 0 ? 'inline' : 'none';
}
