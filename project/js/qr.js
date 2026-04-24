// =====================================================
//  qr.js — QR 코드 생성 / 입장 처리
// =====================================================

// 전역 변수 선언
let qrInstance = null;

function generateQRCode() {
  const groom = document.getElementById('qr-groom').value.trim();
  const bride = document.getElementById('qr-bride').value.trim();
  if (!groom || !bride) { showToast('신랑신부 이름을 입력해 주세요'); return; }

  // 앱 전체에 이름 반영
  document.getElementById('groom-name').textContent     = groom;
  document.getElementById('bride-name').textContent     = bride;
  document.querySelector('.nav-couple').textContent     = groom + ' ♥ ' + bride;

  const canvas = document.getElementById('qr-canvas');
  canvas.innerHTML = ''; // 컨테이너 비우기

// 기존 로직 제거 (innerHTML=''로 비웠기 때문에 새로 생성만 하면 됩니다)
  qrInstance = new QRCode(canvas, {
    text:         window.location.href, // 현재 주소를 QR에 담음
    width:        180,
    height:       180,
    colorDark:    '#2C1F1A',
    colorLight:   '#FFFFFF',
    correctLevel: QRCode.CorrectLevel.H,
  });

  document.getElementById('qr-names').textContent    = groom + ' ♥ ' + bride;
  document.getElementById('qr-output').style.display = 'block';
  showToast('QR이 생성되었어요 💌');
}

function clearQR() {
  document.getElementById('qr-output').style.display = 'none';
}

function downloadQR() {
  const canvas = document.querySelector('#qr-canvas canvas');
  if (!canvas) { showToast('먼저 QR을 생성해 주세요'); return; }
  const a    = document.createElement('a');
  a.download = 'wedding_qr.png';
  a.href     = canvas.toDataURL('image/png');
  a.click();
  showToast('QR 이미지가 저장됐어요');
}

function goToEntry() {
  const groom = document.getElementById('qr-groom').value.trim();
  const bride = document.getElementById('qr-bride').value.trim();
  if (groom) document.getElementById('groom-name').textContent = groom;
  if (bride) document.getElementById('bride-name').textContent = bride;
  if (groom && bride) document.querySelector('.nav-couple').textContent = groom + ' ♥ ' + bride;
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
    btn.style.background   = 'transparent';
    btn.style.color        = 'var(--text-muted)';
    btn.style.borderColor  = 'var(--border)';
  };
  const activate = btn => {
    btn.style.background   = 'var(--deep-rose)';
    btn.style.color        = 'white';
    btn.style.borderColor  = 'var(--deep-rose)';
  };
  reset(groomBtn); reset(brideBtn);
  if (currentSide === '신랑') activate(groomBtn);
  else if (currentSide === '신부') activate(brideBtn);
}

function handleCategoryChange() {
  const sel  = document.getElementById('category-select').value;
  const wrap = document.getElementById('custom-category-wrap');
  wrap.classList.toggle('visible', sel === '직접입력');
}

function enterEvent() {
  const nick = document.getElementById('nickname-input').value.trim();
  if (!nick) { showToast('이름을 입력해 주세요'); return; }
  const sel  = document.getElementById('category-select').value;
  if (!sel)  { showToast('관계를 선택해 주세요 !'); return; }
  if (!currentSide) { showToast('신랑측 / 신부측을 선택해 주세요 !'); return; }
  let category = sel;
  if (sel === '직접입력') {
    category = document.getElementById('custom-category-input').value.trim();
    if (!category) { showToast('관계를 직접 입력해 주세요'); return; }
  }
  currentNickname = currentSide + ' ' + category + ' ' + nick;
  currentCategory = category;
  currentNick     = nick;
  document.getElementById('upload-greeting').textContent = nick + '님, 반갑습니다 🌸';
  currentScreenName = 'landing';
  showScreen('upload');
  showToast('입장되었습니다!');
}
