// =====================================================
//  operator.js — 운영자 콘솔 / 사이트 관리 화면
//  백엔드 연동 시 weddingSites 더미 데이터 → API로 교체
// =====================================================

// ── 사이트 관리 더미 데이터 ─────────────
const weddingSites = [
  { groom:'김민준', bride:'이지은', date:'2026-05-15', guests:87,  photos:142 },
  { groom:'박서준', bride:'최유나', date:'2026-05-15', guests:64,  photos:98  },
  { groom:'정하준', bride:'윤소희', date:'2026-06-07', guests:0,   photos:0   },
  { groom:'이준혁', bride:'강다은', date:'2026-07-19', guests:0,   photos:0   },
  { groom:'최도현', bride:'임지수', date:'2026-08-02', guests:0,   photos:0   },
  { groom:'한승우', bride:'오채원', date:'2025-11-23', guests:112, photos:203 },
  { groom:'신재원', bride:'배수진', date:'2025-12-14', guests:93,  photos:167 },
  { groom:'조현우', bride:'노은별', date:'2026-03-08', guests:76,  photos:121 },
];

function getSiteStatus(dateStr) {
  const today = new Date(); today.setHours(0,0,0,0);
  const d     = new Date(dateStr); d.setHours(0,0,0,0);
  if (d.getTime() === today.getTime()) return 'today';
  if (d > today) return 'future';
  return 'past';
}

function getDday(dateStr) {
  const today = new Date(); today.setHours(0,0,0,0);
  const d     = new Date(dateStr); d.setHours(0,0,0,0);
  const diff  = Math.round((d - today) / 86400000);
  if (diff === 0) return 'D-DAY';
  if (diff > 0)   return `D-${diff}`;
  return `D+${Math.abs(diff)}`;
}

function renderManageScreen() {
  const today = [], future = [], past = [];
  weddingSites.forEach(s => {
    const status = getSiteStatus(s.date);
    if (status === 'today')       today.push(s);
    else if (status === 'future') future.push(s);
    else                          past.push(s);
  });
  document.getElementById('manage-total').textContent   = `총 ${weddingSites.length}건`;
  document.getElementById('today-count').textContent    = `(${today.length}건)`;
  document.getElementById('future-count').textContent   = `(${future.length}건)`;
  document.getElementById('past-count').textContent     = `(${past.length}건)`;
  renderSiteList('today-list',  today,  'today');
  renderSiteList('future-list', future, 'future');
  renderSiteList('past-list',   past,   'past');
}

function renderSiteList(containerId, sites, status) {
  const container = document.getElementById(containerId);
  if (sites.length === 0) {
    container.innerHTML = `<div style="color:var(--text-muted); font-size:12px; padding:16px 0;">해당 결혼식이 없어요</div>`;
    return;
  }
  container.innerHTML = '';
  sites.forEach(s => {
    const statusColor = status === 'today' ? '#4CAF50' : status === 'future' ? 'var(--gold)' : 'var(--text-muted)';
    const bgColor     = status === 'today' ? '#F1F8E9' : status === 'future' ? '#FFFBF0' : 'var(--white)';
    const card        = document.createElement('div');
    card.style.cssText = `background:${bgColor}; border:1px solid var(--border); border-radius:12px; padding:20px; cursor:pointer; transition:all 0.2s;`;
    card.onmouseover   = () => { card.style.transform='translateY(-2px)'; card.style.boxShadow='0 4px 16px rgba(44,31,26,0.1)'; };
    card.onmouseout    = () => { card.style.transform=''; card.style.boxShadow=''; };
    card.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:12px;">
        <div>
          <div style="font-family:'Cormorant Garamond',serif; font-size:17px; color:var(--text); margin-bottom:2px;">${s.groom} ♥ ${s.bride}</div>
          <div style="font-size:11px; color:var(--text-muted);">${s.date}</div>
        </div>
        <div style="font-size:11px; font-weight:600; color:${statusColor}; background:white; padding:3px 8px; border-radius:10px; border:1px solid ${statusColor};">${getDday(s.date)}</div>
      </div>
      ${status !== 'future' ? `
      <div style="display:flex; gap:12px; border-top:1px solid var(--border); padding-top:12px;">
        <div style="text-align:center; flex:1;"><div style="font-size:16px; font-weight:600; color:var(--deep-rose);">${s.guests}</div><div style="font-size:10px; color:var(--text-muted);">참여 하객</div></div>
        <div style="text-align:center; flex:1;"><div style="font-size:16px; font-weight:600; color:var(--deep-rose);">${s.photos}</div><div style="font-size:10px; color:var(--text-muted);">업로드 사진</div></div>
        <div style="text-align:center; flex:1;"><div style="font-size:16px; font-weight:600; color:var(--deep-rose);">${status === 'today' ? '🟢' : '🔒'}</div><div style="font-size:10px; color:var(--text-muted);">${status === 'today' ? 'QR 활성' : 'QR 만료'}</div></div>
      </div>` : `
      <div style="border-top:1px solid var(--border); padding-top:12px; font-size:11px; color:var(--text-muted);">QR 아직 미활성화</div>`}
    `;
    container.appendChild(card);
  });
}

function opGoCreate() {
  document.getElementById('screen-operator').classList.remove('active');
  document.getElementById('screen-qr').classList.add('active');
  currentScreenName = 'qr';
}

function opGoManage() {
  document.getElementById('screen-operator').classList.remove('active');
  document.getElementById('screen-manage').classList.add('active');
  currentScreenName = 'manage';
  renderManageScreen();
}
