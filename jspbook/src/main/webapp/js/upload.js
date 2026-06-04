// =====================================================
//  upload.js — 사진 업로드 / 미리보기
// =====================================================

function triggerFileInput() {
  document.getElementById('file-input').click();
}

function previewFiles(e) {
  const files = Array.from(e.target.files).slice(0, 5);
  pendingFiles  = files;
  pendingPhotos = [];
  let loaded    = 0;
  const results = [];
  files.forEach((f, idx) => {
    const reader   = new FileReader();
    reader.onload  = ev => {
      results[idx] = ev.target.result;
      loaded++;
      if (loaded === files.length) {
        pendingPhotos = results;
        renderPreviewStrip();
      }
    };
    reader.readAsDataURL(f);
  });
}

function renderPreviewStrip() {
  const strip = document.getElementById('preview-strip');
  strip.innerHTML = '';
  if (pendingPhotos.length === 0) {
    strip.innerHTML = '<div class="photo-thumb-placeholder">아직<br>사진 없음</div>';
    document.getElementById('file-input').value = '';
    return;
  }
  pendingPhotos.forEach((src, idx) => {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'position:relative; display:inline-block;';
    const img  = document.createElement('img');
    img.className = 'photo-thumb';
    img.src = src;
    const del  = document.createElement('button');
    del.textContent = '✕';
    del.style.cssText = 'position:absolute;top:-6px;right:-6px;width:18px;height:18px;border-radius:50%;background:var(--deep-rose);color:white;border:none;cursor:pointer;font-size:10px;display:flex;align-items:center;justify-content:center;line-height:1;';
    del.onclick = () => {
      removePhoto(idx);
    };
    wrap.appendChild(img);
    wrap.appendChild(del);
    strip.appendChild(wrap);
  });
}

function removePhoto(idx) {
  pendingPhotos.splice(idx, 1);
  pendingFiles.splice(idx, 1);
  renderPreviewStrip();
}

function updateCharCount() {
  document.getElementById('char-count').textContent =
    document.getElementById('message-input').value.length;
}

// ── 게시물 공유 ───────────────────────────────────

function submitUpload() {
  const msg      = document.getElementById('message-input').value.trim();
  if (!msg && pendingPhotos.length === 0) {
    showToast('사진 또는 메시지를 입력해주세요');
    return;
  }
  const postData = {
    name:     currentNickname || '익명 하객',
    category: currentCategory,
    nick:     currentNick || currentNickname || '익명 하객',
    side:     currentSide,
    msg:      msg || '(사진만 공유)',
    color:    '#C5826A',
  };
  api_uploadPost(postData, pendingFiles).then(async res => {
    if (!res.success) { showToast(res.error || '업로드에 실패했어요'); return; }
    await loadPosts();
    pendingPhotos = [];
    pendingFiles  = [];
    document.getElementById('message-input').value   = '';
    document.getElementById('char-count').textContent = '0';
    renderPreviewStrip();
    await renderAdminGrid(getVisibleAdminContext(), { skipReload: true });
    showToast('공유되었습니다 💌');
    setTimeout(() => showScreen('gallery'), 1200);
  });
}