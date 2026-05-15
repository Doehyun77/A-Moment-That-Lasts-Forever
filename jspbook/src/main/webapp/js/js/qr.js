// ── 청첩장 ──────────────────────────────
let invitationData = null;

function previewInvitation(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = ev => {
    invitationData = ev.target.result;
    document.getElementById('invitation-img').src = ev.target.result;
    document.getElementById('invitation-preview').style.display = 'block';
    document.getElementById('invitation-drop').style.display = 'none';
    updateChecklist();
    clearQR();
  };
  reader.readAsDataURL(file);
}

function clearInvitation() {
  invitationData = null;
  document.getElementById('invitation-input').value = '';
  document.getElementById('invitation-preview').style.display = 'none';
  document.getElementById('invitation-drop').style.display = 'block';
  updateChecklist();
  clearQR();
}

// ── 웨딩 사진 ──────────────────────────
let weddingPhotos = [];

function addWeddingPhotos(e) {
  const files = Array.from(e.target.files);
  const remaining = 8 - weddingPhotos.length;
  files.slice(0, remaining).forEach(f => {
    const reader = new FileReader();
    reader.onload = ev => {
      weddingPhotos.push(ev.target.result);
      renderWeddingPhotoGrid();
      updateChecklist();
      clearQR();
    };
    reader.readAsDataURL(f);
  });
  e.target.value = '';
}

function removeWeddingPhoto(idx) {
  weddingPhotos.splice(idx, 1);
  renderWeddingPhotoGrid();
  updateChecklist();
  clearQR();
}

function renderWeddingPhotoGrid() {
  const grid = document.getElementById('wedding-photo-grid');
  grid.innerHTML = '';
  weddingPhotos.forEach((src, idx) => {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'position:relative; aspect-ratio:1;';
    wrap.innerHTML = `
      <img src="${src}" style="width:100%; height:100%; object-fit:cover; border-radius:8px; border:1px solid var(--border);">
      <button onclick="removeWeddingPhoto(${idx})" style="position:absolute; top:-5px; right:-5px; width:18px; height:18px; border-radius:50%; background:var(--deep-rose); color:white; border:none; cursor:pointer; font-size:10px; display:flex; align-items:center; justify-content:center;">✕</button>
    `;
    grid.appendChild(wrap);
  });
  document.getElementById('wedding-photo-count').textContent = `${weddingPhotos.length} / 3~8장`;
  document.getElementById('wedding-photo-count').style.color = weddingPhotos.length >= 3 ? 'var(--rose)' : 'var(--text-muted)';
}

// ── 체크리스트 업데이트 ─────────────────
function updateChecklist() {
  const groom = document.getElementById('qr-groom')?.value.trim();
  const bride = document.getElementById('qr-bride')?.value.trim();
  const date  = document.getElementById('wedding-date')?.value;
  const checks = {
    'check-names':      groom && bride,
    'check-date':       !!date,
    'check-invitation': !!invitationData,
    'check-photos':     weddingPhotos.length >= 3,
  };
  Object.entries(checks).forEach(([id, ok]) => {
    const el = document.getElementById(id);
    if (el) { el.style.color = ok ? 'var(--rose)' : 'var(--text-muted)'; el.textContent = (ok ? '✓ ' : '◦ ') + el.textContent.replace(/^[✓◦] /, ''); }
  });
}

function updateValidityRange() {
  const dateVal = document.getElementById('wedding-date').value;
  if (!dateVal) return;

  const wedding = new Date(dateVal);
  const minDate = new Date(wedding); minDate.setDate(wedding.getDate() - 5);
  const maxDate = new Date(wedding); maxDate.setDate(wedding.getDate() + 5);

  const fmt = d => d.toISOString().split('T')[0];

  const startEl = document.getElementById('qr-start');
  const endEl   = document.getElementById('qr-end');

  startEl.min = fmt(minDate);
  startEl.max = fmt(wedding);
  endEl.min   = fmt(wedding);
  endEl.max   = fmt(maxDate);

  // 기본값: 결혼식 당일 ~ 다음날
  if (!startEl.value) startEl.value = fmt(wedding);
  if (!endEl.value)   endEl.value   = fmt(new Date(wedding.setDate(wedding.getDate() + 1)));

  document.getElementById('validity-msg').textContent =
    `선택 가능 범위: ${fmt(minDate)} ~ ${fmt(maxDate)}`;
  document.getElementById('validity-msg').style.color = 'var(--text-muted)';
}

function validateValidityRange() {
  const dateVal = document.getElementById('wedding-date').value;
  const start   = document.getElementById('qr-start').value;
  const end     = document.getElementById('qr-end').value;
  const msg     = document.getElementById('validity-msg');
  if (!dateVal || !start || !end) return;

  const wedding  = new Date(dateVal);
  const minDate  = new Date(dateVal); minDate.setDate(wedding.getDate() - 5);
  const maxDate  = new Date(dateVal); maxDate.setDate(wedding.getDate() + 5);
  const startD   = new Date(start);
  const endD     = new Date(end);

  if (startD > endD) {
    msg.textContent = '⚠ 시작일이 종료일보다 늦을 수 없어요';
    msg.style.color = 'var(--rose)';
    return;
  }
  if (startD < minDate || endD > maxDate) {
    msg.textContent = '⚠ 결혼식 날짜 기준 ±5일 이내로 설정해 주세요';
    msg.style.color = 'var(--rose)';
    return;
  }
  const days = Math.round((endD - startD) / 86400000) + 1;
  msg.textContent = `✓ QR 유효 기간 ${days}일 (${start} ~ ${end})`;
  msg.style.color = 'var(--rose)';
}

function openConfirmModal() {
  const groom = document.getElementById('qr-groom').value.trim();
  const bride = document.getElementById('qr-bride').value.trim();
  const date  = document.getElementById('wedding-date').value;
  const start = document.getElementById('qr-start').value;
  const end   = document.getElementById('qr-end').value;

  if (!groom || !bride) { showToast('신랑/신부 이름을 입력해 주세요'); return; }
  if (groom.length > 5) { showToast('신랑 이름은 5글자를 초과할 수 없어요'); return; }
  if (bride.length > 5) { showToast('신부 이름은 5글자를 초과할 수 없어요'); return; }
  if (!date) { showToast('결혼식 날짜를 선택해 주세요'); return; }
  const today = new Date(); today.setHours(0,0,0,0);
  const selected = new Date(date); selected.setHours(0,0,0,0);
  if (selected < today) { showToast('결혼식 날짜는 오늘 이후로 선택해 주세요'); return; }

  // 모달에 정보 채우기
  document.getElementById('conf-names').textContent = groom + ' ♥ ' + bride;
  document.getElementById('conf-date').textContent = date;
  document.getElementById('conf-validity').textContent = (start && end) ? `${start} ~ ${end}` : `${date} ~ (미설정)`;

  // 체크박스 초기화
  ['conf-check-1','conf-check-2','conf-check-3'].forEach(id => {
    document.getElementById(id).checked = false;
  });
  ['check-label-1','check-label-2','check-label-3'].forEach(id => {
    document.getElementById(id).style.borderColor = 'var(--border)';
  });
  updateConfirmBtn();

  document.getElementById('confirm-qr-modal').style.display = 'flex';
}

function closeConfirmModal() {
  document.getElementById('confirm-qr-modal').style.display = 'none';
}

function updateConfirmBtn() {
  const all = ['conf-check-1','conf-check-2','conf-check-3'].every(id => document.getElementById(id).checked);
  const btn = document.getElementById('confirm-qr-btn');
  btn.disabled = !all;
  btn.style.background = all ? 'var(--deep-rose)' : '#C8B4B0';
  btn.style.cursor = all ? 'pointer' : 'not-allowed';

  // 체크된 항목 테두리 색 변경
  [['conf-check-1','check-label-1'],['conf-check-2','check-label-2'],['conf-check-3','check-label-3']].forEach(([chkId, lblId]) => {
    const checked = document.getElementById(chkId).checked;
    document.getElementById(lblId).style.borderColor = checked ? 'var(--rose)' : 'var(--border)';
  });
}

function validateDate(input) {
  const today = new Date(); today.setHours(0,0,0,0);
  const selected = new Date(input.value); selected.setHours(0,0,0,0);
  if (input.value && selected < today) {
    input.style.borderColor = 'var(--rose)';
    showToast('오늘 이후 날짜만 선택할 수 있어요');
  } else {
    input.style.borderColor = '';
  }
  updateChecklist();
}

// ── generateQRCode 오버라이드 ──────────
const _origGenerateQR = generateQRCode;
generateQRCode = function() {
  const groom = document.getElementById('qr-groom').value.trim();
  const bride = document.getElementById('qr-bride').value.trim();
  const date  = document.getElementById('wedding-date').value;

  // 이름 반영
  document.getElementById('groom-name').textContent = groom;
  document.getElementById('bride-name').textContent = bride;
  document.querySelectorAll('.nav-couple').forEach(el => el.textContent = groom + ' ♥ ' + bride);

  // 만료일 표시
  const startVal = document.getElementById('qr-start').value || date;
  const endVal   = document.getElementById('qr-end').value   || (() => {
    const d = new Date(date); d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  })();
  document.getElementById('qr-expiry').textContent = `유효기간: ${startVal} ~ ${endVal}`;

  // QR 생성
  const canvas = document.getElementById('qr-canvas');
  canvas.innerHTML = '';
  if (qrInstance) qrInstance.clear();
  qrInstance = new QRCode(canvas, {
    text: window.location.origin + window.location.pathname + '?mode=entry&groom=' + encodeURIComponent(groom) + '&bride=' + encodeURIComponent(bride),
    width: 160, height: 160,
    colorDark: '#2C1F1A', colorLight: '#FFFFFF',
    correctLevel: QRCode.CorrectLevel.H
  });
  document.getElementById('qr-names').textContent = groom + ' ♥ ' + bride;
  document.getElementById('qr-output').style.display = 'block';
  document.getElementById('qr-checklist').style.display = 'none';
  showToast('사이트가 생성되었어요 💌');
};

document.addEventListener('DOMContentLoaded', () => {
  const dateInput = document.getElementById('wedding-date');
  if (dateInput) {
    const today = new Date().toISOString().split('T')[0];
    dateInput.min = today;
  }
  updateChecklist();
});

document.addEventListener('input', () => updateChecklist());

// =====================================================
//  qr.js — QR 코드 생성 / 입장 처리
// =====================================================

function generateQRCode() {
    const groom = document.getElementById('qr-groom').value.trim();
    const bride = document.getElementById('qr-bride').value.trim();

    if (!groom || !bride) {
        showToast('신랑신부 이름을 입력해 주세요');
        return;
    }

    document.getElementById('groom-name').textContent = groom;
    document.getElementById('bride-name').textContent = bride;
    document.querySelectorAll('.nav-couple').forEach(el => el.textContent = groom + ' ♥ ' + bride);

    const baseUrl = window.location.origin + window.location.pathname;

    const qrUrl =
        baseUrl +
        '?mode=entry' +
        '&groom=' + encodeURIComponent(groom) +
        '&bride=' + encodeURIComponent(bride);

    const canvas = document.getElementById('qr-canvas');
    canvas.innerHTML = '';

    if (qrInstance) {
        qrInstance.clear();
    }

    qrInstance = new QRCode(canvas, {
        text: qrUrl,
        width: 180,
        height: 180,
        colorDark: '#2C1F1A',
        colorLight: '#FFFFFF',
        correctLevel: QRCode.CorrectLevel.H
    });

    document.getElementById('qr-names').textContent = groom + ' ♥ ' + bride;
    document.getElementById('qr-output').style.display = 'block';

    showToast('QR이 생성되었어요 💌');
}

function clearQR() {
    document.getElementById('qr-output').style.display = 'none';
}

function downloadQR() {
    const canvas = document.querySelector('#qr-canvas canvas');
    if (!canvas) { showToast('먼저 QR을 생성해 주세요'); return; }
    const a = document.createElement('a');
    a.download = 'wedding_qr.png';
    a.href = canvas.toDataURL('image/png');
    a.click();
    showToast('QR 이미지가 저장됐어요');
}

function goToEntry() {
    const groom = document.getElementById('qr-groom').value.trim();
    const bride = document.getElementById('qr-bride').value.trim();
    if (groom) document.getElementById('groom-name').textContent = groom;
    if (bride) document.getElementById('bride-name').textContent = bride;
    if (groom && bride) document.querySelectorAll('.nav-couple').forEach(el => el.textContent = groom + ' ♥ ' + bride);
    document.getElementById('screen-qr').classList.remove('active');
    document.getElementById('screen-landing').classList.add('active');
    currentScreenName = 'landing';
}

// ── 입장 처리 ─────────────────────────────────────

function selectSide(side) {
    currentSide = currentSide === side ? '' : side;
    const groomBtn = document.getElementById('toggle-groom');
    const brideBtn = document.getElementById('toggle-bride');
    const reset = btn => {
        btn.style.background = 'transparent';
        btn.style.color = 'var(--text-muted)';
        btn.style.borderColor = 'var(--border)';
    };
    const activate = btn => {
        btn.style.background = 'var(--deep-rose)';
        btn.style.color = 'white';
        btn.style.borderColor = 'var(--deep-rose)';
    };
    reset(groomBtn); reset(brideBtn);
    if (currentSide === '신랑') activate(groomBtn);
    else if (currentSide === '신부') activate(brideBtn);
}

function handleCategoryChange() {
    const sel = document.getElementById('category-select').value;
    const wrap = document.getElementById('custom-category-wrap');
    wrap.classList.toggle('visible', sel === '직접입력');
}

function enterEvent() {
    const nick = document.getElementById('nickname-input').value.trim();
    if (!nick) { showToast('이름을 입력해 주세요'); return; }
    const sel = document.getElementById('category-select').value;
    if (!sel) { showToast('관계를 선택해 주세요 !'); return; }
    if (!currentSide) { showToast('신랑측 / 신부측을 선택해 주세요 !'); return; }
    let category = sel;
    if (sel === '직접입력') {
        category = document.getElementById('custom-category-input').value.trim();
        if (!category) { showToast('관계를 직접 입력해 주세요'); return; }
    }
    currentNickname = currentSide + ' ' + category + ' ' + nick;
    currentCategory = category;
    currentNick = nick;
    document.getElementById('upload-greeting').textContent = nick + '님, 반갑습니다 🌸';
    currentScreenName = 'landing';
    showScreen('upload');
    showToast('입장되었습니다!');
}
window.addEventListener('DOMContentLoaded', function() {
    const params = new URLSearchParams(window.location.search);

    if (params.get('mode') === 'entry') {
        const groom = params.get('groom') || '신랑';
        const bride = params.get('bride') || '신부';

        document.getElementById('groom-name').textContent = groom;
        document.getElementById('bride-name').textContent = bride;
        document.querySelectorAll('.nav-couple').forEach(el => el.textContent = groom + ' ♥ ' + bride);

        document.getElementById('screen-qr').classList.remove('active');
        document.getElementById('screen-landing').classList.add('active');

        currentScreenName = 'landing';
    }
});