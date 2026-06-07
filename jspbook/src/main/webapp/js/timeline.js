// =====================================================
//  timeline.js — 예식 타임테이블 설정 / 표시
// =====================================================

let timelineItems = [];

const DEFAULT_TIMETABLE_ITEMS = [
  { time: '13:30', title: '하객 입장 시작', desc: '사진 업로드와 방명 메시지를 천천히 남겨주세요.' },
  { time: '14:00', title: '예식 시작', desc: '예식 진행 중에는 촬영 동선을 배려해 주세요.' },
  { time: '15:00', title: '식사 및 인사', desc: '마지막까지 축하 인사를 함께 나눠 주세요.' }
];

function normalizeTimelineClientItems(items = []) {
  if (!Array.isArray(items)) return [];
  return items
    .map((item) => ({
      time: String(item?.time || '').trim().slice(0, 20),
      title: String(item?.title || '').trim().slice(0, 50),
      desc: String(item?.desc || '').trim().slice(0, 150)
    }))
    .filter((item) => item.title || item.time || item.desc)
    .slice(0, 8);
}

function addTimelineItem(seed = null) {
  if (timelineItems.length >= 8) {
    showToast('타임테이블은 최대 8개까지 추가할 수 있어요');
    return;
  }
  timelineItems.push(seed || { time: '', title: '', desc: '' });
  renderTimelineEditList();
  clearQR();
}

function addDefaultTimelineItems() {
  if (timelineItems.length > 0) return;
  timelineItems = DEFAULT_TIMETABLE_ITEMS.map((item) => ({ ...item }));
  renderTimelineEditList();
  clearQR();
}

function removeTimelineItem(index) {
  timelineItems.splice(index, 1);
  renderTimelineEditList();
  clearQR();
}

function syncTimelineItem(index, field, value) {
  if (!timelineItems[index]) return;
  timelineItems[index][field] = value;
  refreshCreateWorkspace();
}

function setTimelineItems(items = []) {
  timelineItems = normalizeTimelineClientItems(items);
  renderTimelineEditList();
}

function getTimelineItemsForSubmit() {
  return normalizeTimelineClientItems(timelineItems).filter((item) => item.title);
}

function renderTimelineEditList() {
  const list = document.getElementById('timeline-edit-list');
  const empty = document.getElementById('timeline-edit-empty');
  if (!list) return;

  if (timelineItems.length === 0) {
    list.innerHTML = '';
    if (empty) empty.style.display = 'block';
    refreshCreateWorkspace();
    return;
  }

  if (empty) empty.style.display = 'none';
  list.innerHTML = timelineItems.map((item, i) => `
    <div class="faq-edit-item timeline-edit-item">
      <div class="faq-edit-header">
        <span class="faq-edit-num">STEP ${i + 1}</span>
        <button class="faq-edit-remove" onclick="removeTimelineItem(${i})" title="삭제">✕</button>
      </div>
      <input type="text" class="form-input timeline-time-input"
        placeholder="시간 (예: 14:00)" maxlength="20"
        oninput="syncTimelineItem(${i}, 'time', this.value)"
        style="margin-bottom:8px; font-size:13px;">
      <input type="text" class="form-input timeline-title-input"
        placeholder="순서 제목 (예: 예식 시작)" maxlength="50"
        oninput="syncTimelineItem(${i}, 'title', this.value)"
        style="margin-bottom:8px; font-size:13px;">
      <textarea class="form-input timeline-desc-input"
        placeholder="설명 (최대 150자)" maxlength="150"
        oninput="syncTimelineItem(${i}, 'desc', this.value)"
        rows="3" style="resize:none; margin-bottom:0; font-size:13px; line-height:1.5;"></textarea>
    </div>
  `).join('');

  list.querySelectorAll('.timeline-time-input').forEach((el, i) => { el.value = timelineItems[i]?.time || ''; });
  list.querySelectorAll('.timeline-title-input').forEach((el, i) => { el.value = timelineItems[i]?.title || ''; });
  list.querySelectorAll('.timeline-desc-input').forEach((el, i) => { el.value = timelineItems[i]?.desc || ''; });
  refreshCreateWorkspace();
}

function getTimelineItemsForGuest() {
  const normalized = normalizeTimelineClientItems(timelineItems).filter((item) => item.title);
  return normalized;
}
