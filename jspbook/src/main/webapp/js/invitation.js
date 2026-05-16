// =====================================================
//  invitation.js — 청첩장 페이지 / 이미지·링크 처리
// =====================================================

const DUMMY_INVITATION = 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=400&q=80';

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

function showInvitationScreen() {
  const imgEl      = document.getElementById('invitation-display-img');
  const iframeWrap = document.getElementById('invitation-display-iframe-wrap');
  const iframeEl   = document.getElementById('invitation-display-iframe');

  if (invitationType === 'url' && invitationUrl) {
    imgEl.style.display      = 'none';
    iframeWrap.style.display = 'block';
    iframeEl.onload = function() { resizeIframe(iframeEl); };
    iframeEl.src             = invitationUrl;
  } else {
    const src = invitationData || DUMMY_INVITATION;
    imgEl.src                = src;
    imgEl.style.display      = 'block';
    iframeWrap.style.display = 'none';
  }
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById('slide-wrapper').style.display = 'none';
  document.getElementById('main-nav').style.display = 'none';
  document.querySelectorAll('.screen-body').forEach(b => b.style.display = 'none');
  document.getElementById('screen-invitation').classList.add('active');
  currentScreenName = 'invitation';
  screenHistory.push('upload');
}
