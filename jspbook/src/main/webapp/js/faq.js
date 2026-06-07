// =====================================================
//  faq.js — FAQ 설정 (관리자) / 표시 (하객)
// =====================================================

let faqItems = []; // [{ q: string, a: string }]

function normalizeFaqItemsForClient(items = []) {
    if (!Array.isArray(items)) return [];
    return items
        .map((item) => ({
            q: String(item?.q || '').trim().slice(0, 50),
            a: String(item?.a || '').trim().slice(0, 150)
        }))
        .filter((item) => item.q)
        .slice(0, 5);
}

function setFaqItems(items = []) {
    faqItems = normalizeFaqItemsForClient(items);
    renderFaqEditList();
}

function getFaqItemsForSubmit() {
    return normalizeFaqItemsForClient(faqItems);
}

// ── 관리자: FAQ 편집 ──────────────────────────────

function addFaqItem() {
    if (faqItems.length >= 5) {
        showToast('FAQ는 최대 5개까지 추가할 수 있어요');
        return;
    }
    faqItems.push({ q: '', a: '' });
    renderFaqEditList();
}

function removeFaqItem(idx) {
    faqItems.splice(idx, 1);
    renderFaqEditList();
}

function syncFaqItem(idx, field, value) {
    if (faqItems[idx]) faqItems[idx][field] = value;
    refreshCreateWorkspace();
}

function renderFaqEditList() {
    const list  = document.getElementById('faq-edit-list');
    const empty = document.getElementById('faq-edit-empty');
    if (!list) return;

    if (faqItems.length === 0) {
        list.innerHTML = '';
        if (empty) empty.style.display = 'block';
        return;
    }
    if (empty) empty.style.display = 'none';

    list.innerHTML = faqItems.map((item, i) => `
        <div class="faq-edit-item">
          <div class="faq-edit-header">
            <span class="faq-edit-num">Q${i + 1}</span>
            <button class="faq-edit-remove" onclick="removeFaqItem(${i})" title="삭제">✕</button>
          </div>
          <input type="text" class="form-input faq-q-input"
            placeholder="질문을 입력해 주세요 (최대 50자)" maxlength="50"
            oninput="syncFaqItem(${i}, 'q', this.value)"
            style="margin-bottom:8px; font-size:13px;">
          <textarea class="form-input faq-a-input"
            placeholder="답변을 입력해 주세요 (최대 150자)" maxlength="150"
            oninput="syncFaqItem(${i}, 'a', this.value)"
            rows="3" style="resize:none; margin-bottom:0; font-size:13px; line-height:1.5;"></textarea>
        </div>
    `).join('');

    // innerHTML value 어트리뷰트는 초기값만 설정하므로 직접 할당
    list.querySelectorAll('.faq-q-input').forEach((el, i) => { el.value = faqItems[i]?.q || ''; });
    list.querySelectorAll('.faq-a-input').forEach((el, i) => { el.value = faqItems[i]?.a || ''; });
}

// ── URL 인코딩 / 디코딩 (Base64) ─────────────────

function encodeFaqForUrl() {
    const filled = faqItems.filter(f => f.q.trim());
    if (filled.length === 0) return '';
    try {
        return btoa(unescape(encodeURIComponent(JSON.stringify(filled))));
    } catch (e) { return ''; }
}

function decodeFaqFromUrl(encoded) {
    if (!encoded) return [];
    try {
        const parsed = JSON.parse(decodeURIComponent(escape(atob(encoded))));
        return Array.isArray(parsed) ? parsed : [];
    } catch (e) { return []; }
}

// ── 하객: FAQ 모달 ────────────────────────────────

function showFaqModal() {
    const modal = document.getElementById('faq-modal');
    if (!modal) return;
    renderFaqGuestList();
    modal.style.display = 'flex';
}

function closeFaqModal() {
    const modal = document.getElementById('faq-modal');
    if (modal) modal.style.display = 'none';
}

function renderFaqGuestList() {
    const list = document.getElementById('faq-modal-list');
    if (!list) return;

    const visible = faqItems.filter(f => f.q.trim());
    if (visible.length === 0) {
        list.innerHTML = '<div class="faq-empty-msg">❓ 아직 FAQ가 등록되지 않았어요</div>';
        return;
    }

    list.innerHTML = visible.map((item) => `
        <div class="faq-guest-item" onclick="toggleFaqItem(this)">
          <div class="faq-guest-q">
            <span class="faq-label q">Q</span>
            <span class="faq-qtext">${safeTxt(item.q)}</span>
            <span class="faq-arrow">▸</span>
          </div>
          <div class="faq-guest-a" style="display:none;">
            <span class="faq-label a">A</span>
            <span class="faq-atext">${safeTxt(item.a)}</span>
          </div>
        </div>
    `).join('');
}

function toggleFaqItem(el) {
    const answer = el.querySelector('.faq-guest-a');
    const arrow  = el.querySelector('.faq-arrow');
    const isOpen = answer.style.display !== 'none';
    answer.style.display = isOpen ? 'none' : 'flex';
    arrow.textContent    = isOpen ? '▸' : '▾';
    el.classList.toggle('open', !isOpen);
}

function safeTxt(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}
