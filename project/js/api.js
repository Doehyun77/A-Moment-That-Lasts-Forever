// =====================================================
//  api.js — API 레이어
//  백엔드 연동 시 이 파일만 수정하세요
//  BASE_URL 을 실제 서버 주소로 교체하면 됩니다
// =====================================================

const BASE_URL = '';   // 예: 'https://api.your-domain.com'

// ── 게시물 업로드 ──────────────────────────────────
async function api_uploadPost(postData, photoFiles) {

  /* [서버 연동 시 아래 코드 활성화]
  const form = new FormData();
  form.append('name',     postData.name);
  form.append('category', postData.category);
  form.append('side',     postData.side);
  form.append('message',  postData.msg);
  form.append('pin',      postData.pin);
  photoFiles.forEach(f => form.append('photos', f));
  const res = await fetch(`${BASE_URL}/api/posts`, { method: 'POST', body: form });
  return await res.json();
  */

  // [임시: 메모리 저장]
  const now  = new Date();
  const time = now.getHours() + ':' + String(now.getMinutes()).padStart(2, '0');
  const post = { ...postData, time, likes: 0, liked: false, photos: [...pendingPhotos], id: Date.now() };
  samplePosts.unshift(post);
  return { success: true };
}

// ── 게시물 목록 조회 ───────────────────────────────
async function api_fetchPosts() {

  /* [서버 연동 시 아래 코드 활성화]
  const res = await fetch(`${BASE_URL}/api/posts`);
  return await res.json();
  */

  // [임시: 메모리 반환]
  return samplePosts;
}

// ── 게시물 삭제 ────────────────────────────────────
async function api_deletePost(postId, pin) {

  /* [서버 연동 시 아래 코드 활성화]
  const res = await fetch(`${BASE_URL}/api/posts/${postId}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pin })
  });
  return await res.json();
  */

  // [임시: 메모리 삭제]
  const idx = samplePosts.findIndex(p => p.id === postId);
  if (idx === -1)                         return { success: false, error: '게시물 없음' };
  if (samplePosts[idx].pin !== pin)       return { success: false, error: '번호가 올바르지 않아요' };
  samplePosts.splice(idx, 1);
  return { success: true };
}

// ── 전체 사진 다운로드 ─────────────────────────────
async function api_downloadAll() {

  /* [서버 연동 시 아래 코드 활성화]
  const res  = await fetch(`${BASE_URL}/api/photos/download-all`);
  const blob = await res.blob();
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url; a.download = '순간모음.zip'; a.click();
  return { success: true };
  */

  // [임시: base64 개별 다운로드]
  const allPhotos = samplePosts.flatMap(p => p.photos || []);
  if (allPhotos.length === 0) return { success: false };
  allPhotos.forEach((src, i) => {
    const a = document.createElement('a');
    a.href = src; a.download = `순간_${i + 1}.jpg`; a.click();
  });
  return { success: true };
}

// ── 개별 사진 다운로드 ─────────────────────────────
async function api_downloadPhoto(src, index) {

  /* [서버 연동 시 아래 코드 활성화]
  const res  = await fetch(`${BASE_URL}/api/photos/${photoId}/download`);
  const blob = await res.blob();
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url; a.download = `순간_${index + 1}.jpg`; a.click();
  return { success: true };
  */

  // [임시: base64 직접 다운로드]
  const a = document.createElement('a');
  a.href = src; a.download = `순간_${index + 1}.jpg`; a.click();
  return { success: true };
}
