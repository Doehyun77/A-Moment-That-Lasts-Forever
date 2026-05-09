// =====================================================
//  ui.js — 화면 전환 / 토스트 / 네비게이션
// =====================================================

function showScreen(name, skipHistory = false) {
  const prev = currentScreenName;
  if (prev === name) return;

  const isSlide  = (prev === 'upload' && name === 'gallery') || (prev === 'gallery' && name === 'upload');
  const goingRight = screenOrder.indexOf(name) > screenOrder.indexOf(prev);

  if (!skipHistory && prev !== 'landing') screenHistory.push(prev);
  currentScreenName = name;

  if (name === 'landing' || name === 'admin' || name === 'qr') {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById('slide-wrapper').style.display = 'none';
    document.getElementById('main-nav').style.display = 'none';
    document.querySelectorAll('.screen-body').forEach(b => b.style.display = 'none');
    document.getElementById('screen-' + name).classList.add('active');
    if (name === 'admin') renderAdminGrid();
    return;
  }

  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById('main-nav').style.display = 'flex';
  document.getElementById('slide-wrapper').style.display = 'block';

  document.getElementById('nav-upload-btn').className  = name === 'upload'  ? 'active' : '';
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
    if (prevEl) { prevEl.style.display = 'none'; prevEl.classList.remove('is-active'); }
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
