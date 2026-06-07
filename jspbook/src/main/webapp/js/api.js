const BASE_URL = '';

async function api_readJson(res, fallback = {}) {
    const text = await res.text();
    if (!text) return fallback;

    try {
        return JSON.parse(text);
    } catch (error) {
        if (Array.isArray(fallback)) {
            return fallback;
        }

        if (res.ok) {
            const snippet = text.slice(0, 120).replace(/\s+/g, ' ').trim();
            console.warn('API JSON parse fallback:', res.url, snippet);
        }

        return {
            ...fallback,
            success: false,
            authenticated: false,
            error: '서버 응답을 확인할 수 없어요.'
        };
    }
}

async function api_listEvents() {
    const res = await fetch(`${BASE_URL}/api/events`);
    return await api_readJson(res, []);
}

async function api_createEvent(groomName, brideName, weddingDate = '', qrStartDate = '', qrEndDate = '', faqItems = [], timelineItems = []) {
    const res = await fetch(`${BASE_URL}/api/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ groomName, brideName, weddingDate, qrStartDate, qrEndDate, faqItems, timelineItems })
    });
    return await api_readJson(res);
}

async function api_fetchEvent(eventCode) {
    const res = await fetch(`${BASE_URL}/api/events/${eventCode}`);
    return await api_readJson(res);
}

async function api_uploadEventPhotos(eventCode, invitationFile, photoFiles, invitationLink = '') {
    const form = new FormData();
    if (invitationFile) form.append('invitation', invitationFile);
    if (invitationLink) form.append('invitationUrl', invitationLink);
    photoFiles.forEach(f => form.append('photos', f));
    const res = await fetch(`${BASE_URL}/api/events/${eventCode}/gallery`, {
        method: 'POST',
        body: form
    });
    return await api_readJson(res);
}

async function api_deleteEvent(eventCode) {
    const res = await fetch(`${BASE_URL}/api/events/${eventCode}`, {
        method: 'DELETE'
    });
    return await api_readJson(res);
}

async function api_enterGuestSession(guestData) {
    const res = await fetch(`${BASE_URL}/api/guest-session/enter`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(guestData)
    });
    return await api_readJson(res);
}

async function api_getGuestSession(eventCode) {
    const res = await fetch(`${BASE_URL}/api/guest-session?eventCode=${encodeURIComponent(eventCode)}`);
    return await api_readJson(res, { authenticated: false });
}

async function api_clearGuestSession(eventCode) {
    const suffix = eventCode ? `?eventCode=${encodeURIComponent(eventCode)}` : '';
    const res = await fetch(`${BASE_URL}/api/guest-session${suffix}`, {
        method: 'DELETE'
    });
    return await api_readJson(res);
}

async function api_adminLogin(eventCode, code) {
    const res = await fetch(`${BASE_URL}/api/admin-session/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventCode, code })
    });
    return await api_readJson(res);
}

async function api_adminLogout() {
    const res = await fetch(`${BASE_URL}/api/admin-session`, {
        method: 'DELETE'
    });
    return await api_readJson(res);
}

async function api_adminStatus() {
    const res = await fetch(`${BASE_URL}/api/admin-session`);
    return await api_readJson(res, { authenticated: false });
}

async function api_uploadPost(postData, photoFiles) {
    const form = new FormData();

    form.append('eventCode', currentEventCode);
    form.append('guestName', postData.name);
    form.append('side', postData.side);
    form.append('category', postData.category);
    form.append('message', postData.msg);

    photoFiles.forEach(f => form.append('photos', f));

    const res = await fetch(`${BASE_URL}/api/posts`, {
        method: 'POST',
        body: form
    });

    return await api_readJson(res);
}

async function api_fetchPosts() {
    if (!currentEventCode) return [];

    const res = await fetch(`${BASE_URL}/api/posts?eventCode=${encodeURIComponent(currentEventCode)}`);
    return await api_readJson(res, []);
}

async function api_deletePost(postId) {
    const res = await fetch(`${BASE_URL}/api/posts/${postId}`, {
        method: 'DELETE'
    });

    return await api_readJson(res);
}

async function api_toggleLike(postId) {
    const res = await fetch(`${BASE_URL}/api/posts/${postId}/like-toggle`, {
        method: 'POST'
    });
    return await api_readJson(res);
}

// ── Operator Console Auth ─────────────────────

async function api_operatorLogin(username, password) {
    const res = await fetch(`${BASE_URL}/api/operator/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
    });
    return await api_readJson(res);
}

async function api_operatorStatus() {
    const res = await fetch(`${BASE_URL}/api/operator/status`);
    return await api_readJson(res, { authenticated: false });
}

async function api_operatorLogout() {
    const res = await fetch(`${BASE_URL}/api/operator/logout`, {
        method: 'DELETE'
    });
    return await api_readJson(res);
}

async function api_getOperatorTodos() {
    const res = await fetch(`${BASE_URL}/api/operator/todos`);
    return await api_readJson(res, { success: false, items: [] });
}

async function api_saveOperatorTodos(items) {
    const res = await fetch(`${BASE_URL}/api/operator/todos`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items })
    });
    return await api_readJson(res, { success: false, items: [] });
}

async function api_getOperatorLogs() {
    const res = await fetch(`${BASE_URL}/api/operator/logs`);
    return await api_readJson(res, { success: false, items: [] });
}

async function api_downloadPhoto(src, index) {
    const a = document.createElement('a');
    a.href = src;
    a.download = `순간_${index + 1}.jpg`;
    a.click();
    return { success: true };
}

async function api_downloadAll() {
    const allPhotos = posts.flatMap(p => p.photos || []);
    if (allPhotos.length === 0) return { success: false };

    allPhotos.forEach((src, i) => {
        const a = document.createElement('a');
        a.href = src;
        a.download = `순간_${i + 1}.jpg`;
        a.click();
    });

    return { success: true };
}
