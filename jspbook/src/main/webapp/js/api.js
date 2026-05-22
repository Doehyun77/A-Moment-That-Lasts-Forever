const BASE_URL = '';

async function api_listEvents() {
    const res = await fetch(`${BASE_URL}/api/events`);
    return await res.json();
}

async function api_createEvent(groomName, brideName, weddingDate = '', qrStartDate = '', qrEndDate = '') {
    const res = await fetch(`${BASE_URL}/api/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ groomName, brideName, weddingDate, qrStartDate, qrEndDate })
    });
    return await res.json();
}

async function api_fetchEvent(eventCode) {
    const res = await fetch(`${BASE_URL}/api/events/${eventCode}`);
    return await res.json();
}

async function api_uploadEventPhotos(eventCode, invitationFile, photoFiles) {
    const form = new FormData();
    if (invitationFile) form.append('invitation', invitationFile);
    photoFiles.forEach(f => form.append('photos', f));
    const res = await fetch(`${BASE_URL}/api/events/${eventCode}/gallery`, {
        method: 'POST',
        body: form
    });
    return await res.json();
}

async function api_deleteEvent(eventCode) {
    const res = await fetch(`${BASE_URL}/api/events/${eventCode}`, {
        method: 'DELETE'
    });
    return await res.json();
}

async function api_enterGuestSession(guestData) {
    const res = await fetch(`${BASE_URL}/api/guest-session/enter`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(guestData)
    });
    return await res.json();
}

async function api_getGuestSession(eventCode) {
    const res = await fetch(`${BASE_URL}/api/guest-session?eventCode=${encodeURIComponent(eventCode)}`);
    return await res.json();
}

async function api_clearGuestSession(eventCode) {
    const suffix = eventCode ? `?eventCode=${encodeURIComponent(eventCode)}` : '';
    const res = await fetch(`${BASE_URL}/api/guest-session${suffix}`, {
        method: 'DELETE'
    });
    return await res.json();
}

async function api_adminLogin(code) {
    const res = await fetch(`${BASE_URL}/api/admin-session/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code })
    });
    return await res.json();
}

async function api_adminLogout() {
    const res = await fetch(`${BASE_URL}/api/admin-session`, {
        method: 'DELETE'
    });
    return await res.json();
}

async function api_adminStatus() {
    const res = await fetch(`${BASE_URL}/api/admin-session`);
    return await res.json();
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

    return await res.json();
}

async function api_fetchPosts() {
    if (!currentEventCode) return [];

    const res = await fetch(`${BASE_URL}/api/posts?eventCode=${encodeURIComponent(currentEventCode)}`);
    return await res.json();
}

async function api_deletePost(postId) {
    const res = await fetch(`${BASE_URL}/api/posts/${postId}`, {
        method: 'DELETE'
    });

    return await res.json();
}

async function api_toggleLike(postId) {
    const res = await fetch(`${BASE_URL}/api/posts/${postId}/like-toggle`, {
        method: 'POST'
    });
    return await res.json();
}

// ── Operator Console Auth ─────────────────────

async function api_operatorLogin(username, password) {
    const res = await fetch(`${BASE_URL}/api/operator/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
    });
    return await res.json();
}

async function api_operatorStatus() {
    const res = await fetch(`${BASE_URL}/api/operator/status`);
    return await res.json();
}

async function api_operatorLogout() {
    const res = await fetch(`${BASE_URL}/api/operator/logout`, {
        method: 'DELETE'
    });
    return await res.json();
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
