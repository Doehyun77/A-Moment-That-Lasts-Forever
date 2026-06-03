// =====================================================
//  invitation.js — 청첩장 페이지 / 이미지·링크 처리
// =====================================================

// invitationData / invitationUrl 상태는 ui.js, qr.js와 함께 공유됩니다.

let invitationType = 'image'; // 'image' or 'url'
let invitationUrl  = '';

function setInvitationType(type) {
  invitationType = type;
  const imgBtn = document.getElementById('inv-type-img');
  const urlBtn = document.getElementById('inv-type-url');
  const imgSec = document.getElementById('inv-image-section');
  const urlSec = document.getElementById('inv-url-section');
  if (type === 'image') {
    imgBtn.style.background = 'var(--white)'; imgBtn.style.color = 'var(--deep-rose)'; imgBtn.style.boxShadow = '0 1px 3px var(--shadow)'; imgBtn.style.fontWeight = '500';
    urlBtn.style.background = 'transparent'; urlBtn.style.color = 'var(--text-muted)'; urlBtn.style.boxShadow = 'none'; urlBtn.style.fontWeight = '400';
    imgSec.style.display = 'block'; urlSec.style.display = 'none';
  } else {
    urlBtn.style.background = 'var(--white)'; urlBtn.style.color = 'var(--deep-rose)'; urlBtn.style.boxShadow = '0 1px 3px var(--shadow)'; urlBtn.style.fontWeight = '500';
    imgBtn.style.background = 'transparent'; imgBtn.style.color = 'var(--text-muted)'; imgBtn.style.boxShadow = 'none'; imgBtn.style.fontWeight = '400';
    urlSec.style.display = 'block'; imgSec.style.display = 'none';
  }
  updateChecklist();
}

function previewInvitationUrl(val) {
  invitationUrl = val.trim();
  const preview = document.getElementById('inv-url-preview');
  if (!invitationUrl) { preview.style.display = 'none'; return; }
  document.getElementById('inv-url-label').textContent = invitationUrl;
  document.getElementById('inv-url-iframe').src = invitationUrl;
  preview.style.display = 'block';
  updateChecklist();
}

function clearInvitationUrl() {
  invitationUrl = '';
  document.getElementById('invitation-url-input').value = '';
  document.getElementById('inv-url-preview').style.display = 'none';
  document.getElementById('inv-url-iframe').src = '';
  updateChecklist();
}

function resizeIframe(iframe) {
  iframe.style.height = 'calc(100vh - 60px)';
  iframe.style.overflowY = 'scroll';
}
