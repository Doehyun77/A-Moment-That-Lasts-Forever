// ── 청첩장 ──────────────────────────────
function refreshCreateWorkspace() {
  const groom = document.getElementById('qr-groom')?.value.trim() || '';
  const bride = document.getElementById('qr-bride')?.value.trim() || '';
  const date = document.getElementById('wedding-date')?.value || '';
  const start = document.getElementById('qr-start')?.value || '';
  const end = document.getElementById('qr-end')?.value || '';

  const hasInvitation = !!invitationData || (typeof invitationType !== 'undefined' && invitationType === 'url' && typeof invitationUrl !== 'undefined' && !!invitationUrl);
  const statuses = [!!(groom && bride), !!date, hasInvitation, weddingPhotos.length >= 3];
  const completed = statuses.filter(Boolean).length;
  const percent = (completed / statuses.length) * 100;

  const coupleSummary = document.getElementById('create-couple-summary');
  const dateSummary = document.getElementById('create-date-summary');
  const validitySummary = document.getElementById('create-validity-summary');
  const invitationSummary = document.getElementById('create-invitation-summary');
  const photoSummary = document.getElementById('create-photo-summary');
  const progressText = document.getElementById('create-progress-text');
  const progressCount = document.getElementById('create-progress-count');
  const progressFill = document.getElementById('create-progress-fill');

  if (coupleSummary) coupleSummary.textContent = groom && bride ? `${groom} ♥ ${bride}` : '이름 입력 대기';
  if (dateSummary) dateSummary.textContent = date || '날짜 미선택';
  if (validitySummary) validitySummary.textContent = start && end ? `${start} ~ ${end}` : (date ? '시작일/종료일 확인 필요' : '결혼식 날짜 선택 후 자동 제안');
  if (invitationSummary) {
    if (invitationData) invitationSummary.textContent = '이미지 업로드 완료';
    else if (typeof invitationType !== 'undefined' && invitationType === 'url' && typeof invitationUrl !== 'undefined' && invitationUrl) invitationSummary.textContent = '링크 등록 완료';
    else invitationSummary.textContent = '미업로드';
  }
  if (photoSummary) photoSummary.textContent = `${weddingPhotos.length}장 업로드`;
  if (progressCount) progressCount.textContent = `${completed} / 4`;
  if (progressFill) progressFill.style.width = `${percent}%`;
  if (progressText) {
    if (completed === 4) progressText.textContent = '생성 준비가 완료되었습니다';
    else if (completed === 0) progressText.textContent = '아직 기본 정보 입력 전입니다';
    else progressText.textContent = `총 4단계 중 ${completed}단계가 준비되었습니다`;
  }
}

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
    refreshCreateWorkspace();
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
  refreshCreateWorkspace();
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
  refreshCreateWorkspace();
}

// ── 체크리스트 업데이트 ─────────────────
function updateChecklist() {
  const groom = document.getElementById('qr-groom')?.value.trim();
  const bride = document.getElementById('qr-bride')?.value.trim();
  const date  = document.getElementById('wedding-date')?.value;
  const checks = {
    'check-names':      groom && bride,
    'check-date':       !!date,
    'check-invitation': !!invitationData || (typeof invitationType !== 'undefined' && invitationType === 'url' && typeof invitationUrl !== 'undefined' && !!invitationUrl),
    'check-photos':     weddingPhotos.length >= 3,
  };
  Object.entries(checks).forEach(([id, ok]) => {
    const el = document.getElementById(id);
    if (el) { el.style.color = ok ? 'var(--rose)' : 'var(--text-muted)'; el.textContent = (ok ? '✓ ' : '◦ ') + el.textContent.replace(/^[✓◦] /, ''); }
  });
  refreshCreateWorkspace();
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
  refreshCreateWorkspace();
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
  refreshCreateWorkspace();
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
generateQRCode = async function() {
  const groom = document.getElementById('qr-groom').value.trim();
  const bride = document.getElementById('qr-bride').value.trim();
  const date  = document.getElementById('wedding-date').value;
  const startVal = document.getElementById('qr-start').value || date;
  const endVal   = document.getElementById('qr-end').value || (() => {
    const d = new Date(date); d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  })();

  // 이름 반영
  document.getElementById('groom-name').textContent = groom;
  document.getElementById('bride-name').textContent = bride;
  document.querySelectorAll('.nav-couple').forEach(el => el.textContent = groom + ' ♥ ' + bride);

  // 만료일 표시
  document.getElementById('qr-expiry').textContent = `유효기간: ${startVal} ~ ${endVal}`;

  // DB에 이벤트 생성
  try {
    const event = await api_createEvent(groom, bride, date, startVal, endVal);
    currentEventCode = event.eventCode;

    // 사진 업로드 (이미지 청첩장 또는 웨딩 사진)
    const invitationFile = (typeof invitationType === 'undefined' || invitationType === 'image')
      ? document.getElementById('invitation-input').files[0]
      : null;
    const photoFiles = document.getElementById('wedding-photo-input').files;
    if (invitationFile || (photoFiles && photoFiles.length > 0)) {
      await api_uploadEventPhotos(currentEventCode, invitationFile, photoFiles ? Array.from(photoFiles) : []);
    }

    // QR 생성 (고유 이벤트 코드 기반, 청첩장 URL·FAQ 파라미터 포함)
    let qrUrl = buildEventEntryUrl(currentEventCode);
    if (typeof invitationType !== 'undefined' && invitationType === 'url'
        && typeof invitationUrl !== 'undefined' && invitationUrl) {
      qrUrl += '&invUrl=' + encodeURIComponent(invitationUrl);
    }
    const encodedFaq = (typeof encodeFaqForUrl === 'function') ? encodeFaqForUrl() : '';
    if (encodedFaq) qrUrl += '&faq=' + encodedFaq;
    const canvas = document.getElementById('qr-canvas');
    canvas.innerHTML = '';
    if (qrInstance) qrInstance.clear();
    qrInstance = new QRCode(canvas, {
      text: qrUrl,
      width: 180, height: 180,
      colorDark: '#2C1F1A', colorLight: '#FFFFFF',
      correctLevel: QRCode.CorrectLevel.H
    });
    document.getElementById('qr-names').textContent = groom + ' ♥ ' + bride;
    document.getElementById('qr-output').style.display = 'block';
    document.getElementById('qr-checklist').style.display = 'none';
    showToast('사이트가 생성되었어요 💌');
  } catch (e) {
    showToast('서버 오류가 발생했어요. 다시 시도해 주세요.');
    console.error('Event creation failed:', e);
  }
};

document.addEventListener('DOMContentLoaded', () => {
  const dateInput = document.getElementById('wedding-date');
  if (dateInput) {
    const today = new Date().toISOString().split('T')[0];
    dateInput.min = today;
  }
  updateChecklist();
  refreshCreateWorkspace();
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
    refreshCreateWorkspace();
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
    wrap.style.display = sel === '직접입력' ? 'block' : 'none';
}

function applyGuestSession(guest) {
    currentNickname = guest.nick || guest.displayName || '';
    currentCategory = guest.category;
    currentNick = guest.nick || guest.displayName || '';
    currentSide = guest.side;
    document.getElementById('upload-greeting').textContent = (guest.nick || guest.displayName || '하객') + '님, 반갑습니다 🌸';
}

function syncEntryForm(guest) {
    document.getElementById('nickname-input').value = guest.nick || '';
    document.getElementById('category-select').value = guest.category || '';
    const customWrap = document.getElementById('custom-category-wrap');
    const customInput = document.getElementById('custom-category-input');
    const knownCategories = ['직장동료', '가족', '초등친구', '중등친구', '고등친구', '대학동기', '군대동기'];
    if (guest.category && !knownCategories.includes(guest.category)) {
        document.getElementById('category-select').value = '직접입력';
        customWrap.style.display = 'block';
        customInput.value = guest.category;
    } else {
        customWrap.style.display = document.getElementById('category-select').value === '직접입력' ? 'block' : 'none';
        customInput.value = '';
    }
    currentSide = '';
    selectSide(guest.side || '');
}

async function restoreGuestSession(eventCode) {
    const session = await api_getGuestSession(eventCode);
    if (!session.authenticated || !session.guest) return false;
    applyGuestSession(session.guest);
    syncEntryForm(session.guest);
    currentScreenName = 'landing';
    showScreen('upload');
    return true;
}

function changeGuestIdentity() {
    openGuestIdentityModal();
}

async function resetGuestIdentitySession() {
    await api_clearGuestSession(currentEventCode);
    currentNickname = '';
    currentCategory = '';
    currentNick = '';
    currentSide = '';
    currentEventInfo = null;
    screenHistory = [];
    document.getElementById('nickname-input').value = '';
    document.getElementById('category-select').value = '';
    document.getElementById('custom-category-input').value = '';
    document.getElementById('custom-category-wrap').style.display = 'none';
    selectSide('');
    resetLandingAvailabilityState();
    closeGuestIdentityModal();
    closeMenu();
    currentScreenName = 'landing';
    showScreen('landing');
    showToast('입장 정보를 바꿀 수 있게 초기화했어요');
}

async function enterEvent() {
    const nick = document.getElementById('nickname-input').value.trim();
    if (!nick) { showToast('이름을 입력해 주세요'); return; }
    if (nick.length > 5) { showToast('이름은 최대 5글자까지 입력할 수 있어요'); return; }

    let category = document.getElementById('category-select').value;
    if (!category) {
        showToast('관계를 선택해 주세요');
        return;
    }
    if (category === '직접입력') {
        const custom = document.getElementById('custom-category-input').value.trim();
        if (!custom) {
            showToast('관계를 입력해 주세요');
            return;
        }
        category = custom;
    }
    if (!currentSide) {
        showToast('신랑측 / 신부측을 선택해 주세요');
        return;
    }

    const result = await api_enterGuestSession({
        eventCode: currentEventCode,
        nick,
        category,
        side: currentSide
    });

    if (!result.success || !result.guest) {
        showToast(result.error || '입장 처리에 실패했어요');
        return;
    }

    applyGuestSession(result.guest);
    syncEntryForm(result.guest);
    currentScreenName = 'landing';
    showScreen('upload');
    showToast('입장되었습니다!');
}

function formatKoreanDate(dateText) {
    if (!dateText) return '';
    const date = new Date(dateText + 'T00:00:00');
    if (Number.isNaN(date.getTime())) return dateText;
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}.${month}.${day}`;
}

function resetLandingAvailabilityState() {
    const title = document.getElementById('landing-title');
    const subtitle = document.getElementById('landing-subtitle');
    const notice = document.getElementById('landing-prestart-notice');
    const message = document.getElementById('landing-prestart-message');
    const icon = document.getElementById('landing-hero-icon');
    const form = document.getElementById('landing-entry-form');

    if (title) title.innerHTML = '영원의<br><em>순간</em>';
    if (subtitle) subtitle.innerHTML = 'QR 코드를 스캔하여 입장하셨습니다<br>소중한 순간을 함께 기록해 주세요';
    if (notice) notice.style.display = 'none';
    if (message) message.textContent = '예식이 시작되면 이곳에서 사진과 메시지를 남길 수 있어요.';
    if (icon) icon.textContent = '💌';
    if (form) form.style.display = 'block';
}

function applyLandingAvailabilityState(event) {
    resetLandingAvailabilityState();
    currentEventInfo = event;

    if (event.entryOpen) {
        return;
    }

    const title = document.getElementById('landing-title');
    const subtitle = document.getElementById('landing-subtitle');
    const notice = document.getElementById('landing-prestart-notice');
    const message = document.getElementById('landing-prestart-message');
    const icon = document.getElementById('landing-hero-icon');
    const form = document.getElementById('landing-entry-form');

    if (title) title.innerHTML = event.status === 'ended' ? '운영이<br><em>종료되었어요</em>' : '아직<br><em>시작 전</em>';
    if (subtitle) subtitle.innerHTML = '실물 청첩장의 QR로 들어오셨습니다<br>예식 시작 후 이용하실 수 있어요';
    if (icon) icon.textContent = event.status === 'ended' ? '🕊️' : '⏳';
    if (notice) notice.style.display = 'block';

    const availableFrom = formatKoreanDate(event.availableFrom || event.qrStartDate || event.weddingDate || '');
    if (message) {
        if (event.status === 'before_start') {
            message.innerHTML = availableFrom
                ? `${event.statusMessage}<br><strong>${availableFrom}</strong>부터 사진과 메시지를 남길 수 있어요.`
                : event.statusMessage;
        } else {
            message.textContent = event.statusMessage || '이 웨딩 페이지는 아직 이용할 수 없어요.';
        }
    }

    if (form) form.style.display = 'none';
}
window.addEventListener('DOMContentLoaded', function() {
    const params = new URLSearchParams(window.location.search);

    if (params.get('mode') === 'entry') {
        ['screen-operator','screen-manage','screen-qr','screen-admin','screen-login'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.classList.remove('active');
        });

        const code = params.get('code');

        if (code) {
            currentEventCode = code;
            api_fetchEvent(code).then(async event => {
                const groom = event.groomName || '신랑';
                const bride = event.brideName || '신부';

                document.getElementById('groom-name').textContent = groom;
                document.getElementById('bride-name').textContent = bride;
                document.querySelectorAll('.nav-couple').forEach(el => el.textContent = groom + ' ♥ ' + bride);

                applyLandingAvailabilityState(event);
                document.getElementById('screen-landing').classList.add('active');
                currentScreenName = 'landing';

                const rawInvUrl = params.get('invUrl');
                if (rawInvUrl && typeof invitationType !== 'undefined') {
                    invitationType = 'url';
                    invitationUrl = rawInvUrl;
                }

                const rawFaq = params.get('faq');
                if (rawFaq && typeof decodeFaqFromUrl === 'function') {
                    const decoded = decodeFaqFromUrl(rawFaq);
                    if (decoded.length > 0) faqItems = decoded;
                }

                if (event.entryOpen) {
                    await restoreGuestSession(code);
                }
            }).catch(() => {
                showToast('잘못된 접근이에요');
            });
        } else {
            const groom = params.get('groom') || '신랑';
            const bride = params.get('bride') || '신부';

            document.getElementById('groom-name').textContent = groom;
            document.getElementById('bride-name').textContent = bride;
            document.querySelectorAll('.nav-couple').forEach(el => el.textContent = groom + ' ♥ ' + bride);

            resetLandingAvailabilityState();
            document.getElementById('screen-landing').classList.add('active');
            currentScreenName = 'landing';

            const rawInvUrl = params.get('invUrl');
            if (rawInvUrl && typeof invitationType !== 'undefined') {
                invitationType = 'url';
                invitationUrl = rawInvUrl;
            }

            const rawFaq = params.get('faq');
            if (rawFaq && typeof decodeFaqFromUrl === 'function') {
                const decoded = decodeFaqFromUrl(rawFaq);
                if (decoded.length > 0) faqItems = decoded;
            }
        }
    }

    if (document.getElementById('screen-qr')) {
        updateChecklist();
        refreshCreateWorkspace();
    }
});