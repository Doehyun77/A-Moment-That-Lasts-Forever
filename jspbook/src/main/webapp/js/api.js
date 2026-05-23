// =====================================================
//  api.js — Spring Boot API integration
// =====================================================

const DEFAULT_API_TIMEOUT_MS = 20000;

function getApiBaseUrl() {
    const configured = window.JSPBOOK_API_BASE_URL || localStorage.getItem('JSPBOOK_API_BASE_URL') || '';
    return String(configured).replace(/\/+$/, '');
}

function buildApiUrl(path, query) {
    const fallbackOrigin = window.location.origin && window.location.origin !== 'null'
        ? window.location.origin
        : 'http://localhost:8080';
    const normalizedPath = path.startsWith('/') ? path : '/' + path;
    const url = new URL(getApiBaseUrl() + normalizedPath, fallbackOrigin);

    if (query) {
        Object.entries(query).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== '') {
                url.searchParams.set(key, value);
            }
        });
    }

    return url.toString();
}

function withApiTimeout(timeoutMs = DEFAULT_API_TIMEOUT_MS) {
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), timeoutMs);
    return { signal: controller.signal, clear: () => window.clearTimeout(timer) };
}

async function parseApiResponse(response) {
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) return response.json();

    const text = await response.text();
    if (!text) return null;

    try {
        return JSON.parse(text);
    } catch {
        return text;
    }
}

function createApiError(response, payload) {
    const message = payload?.error || payload?.message || response.statusText || `HTTP ${response.status}`;
    const error = new Error(message);
    error.status = response.status;
    error.payload = payload;
    return error;
}

async function apiRequest(path, options = {}) {
    const { method = 'GET', query, body, headers = {}, timeoutMs } = options;
    const isFormData = body instanceof FormData;
    const timeout = withApiTimeout(timeoutMs);

    try {
        const response = await fetch(buildApiUrl(path, query), {
            method,
            credentials: 'include',
            headers: {
                ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
                ...headers
            },
            body: body === undefined ? undefined : isFormData ? body : JSON.stringify(body),
            signal: timeout.signal
        });

        const payload = await parseApiResponse(response);
        if (!response.ok) throw createApiError(response, payload);
        return payload;
    } finally {
        timeout.clear();
    }
}

function normalizeFiles(files) {
    if (!files) return [];
    if (Array.isArray(files)) return files.filter(Boolean);
    return Array.from(files).filter(Boolean);
}

function dataUrlToFile(dataUrl, index) {
    const [header, base64] = String(dataUrl).split(',');
    if (!header || !base64) return null;

    const mimeMatch = header.match(/data:([^;]+)/);
    const mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg';
    const extension = mimeType.split('/')[1] || 'jpg';
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);

    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
    }

    return new File([bytes], `wedding_photo_${index + 1}.${extension}`, { type: mimeType });
}

function getPreviewWeddingPhotoFiles() {
    try {
        if (typeof weddingPhotos === 'undefined' || !Array.isArray(weddingPhotos)) return [];
        return weddingPhotos
            .map((src, index) => String(src).startsWith('data:') ? dataUrlToFile(src, index) : null)
            .filter(Boolean);
    } catch {
        return [];
    }
}

function getCurrentEventCodeForApi() {
    if (typeof currentEventCode !== 'undefined' && currentEventCode) return currentEventCode;
    return window.currentEventCode || '';
}

async function safeApiResult(work) {
    try {
        return await work();
    } catch (error) {
        console.error('[api]', error);
        return {
            success: false,
            error: error.message || '서버 요청에 실패했어요.',
            status: error.status || 0
        };
    }
}

function configureApiBaseUrl(baseUrl) {
    localStorage.setItem('JSPBOOK_API_BASE_URL', String(baseUrl || '').replace(/\/+$/, ''));
}

async function api_listEvents() {
    return await apiRequest('/api/events');
}

async function api_createEvent(groomName, brideName, weddingDate = '', qrStartDate = '', qrEndDate = '') {
    return await apiRequest('/api/events', {
        method: 'POST',
        body: { groomName, brideName, weddingDate, qrStartDate, qrEndDate }
    });
}

async function api_fetchEvent(eventCode) {
    return await apiRequest(`/api/events/${encodeURIComponent(eventCode)}`);
}

async function api_uploadEventPhotos(eventCode, invitationFile, photoFiles = []) {
    return await safeApiResult(async () => {
        const form = new FormData();
        const normalizedPhotos = normalizeFiles(photoFiles);
        const uploadPhotos = normalizedPhotos.length > 0 ? normalizedPhotos : getPreviewWeddingPhotoFiles();

        if (invitationFile) form.append('invitation', invitationFile);
        uploadPhotos.forEach(file => form.append('photos', file));

        return await apiRequest(`/api/events/${encodeURIComponent(eventCode)}/gallery`, {
            method: 'POST',
            body: form
        });
    });
}

async function api_deleteEvent(eventCode) {
    return await safeApiResult(async () => await apiRequest(`/api/events/${encodeURIComponent(eventCode)}`, {
        method: 'DELETE'
    }));
}

async function api_enterGuestSession(guestData) {
    return await safeApiResult(async () => await apiRequest('/api/guest-session/enter', {
        method: 'POST',
        body: guestData
    }));
}

async function api_getGuestSession(eventCode) {
    return await apiRequest('/api/guest-session', {
        query: { eventCode }
    });
}

async function api_clearGuestSession(eventCode) {
    return await safeApiResult(async () => await apiRequest('/api/guest-session', {
        method: 'DELETE',
        query: { eventCode }
    }));
}

async function api_adminLogin(code) {
    return await safeApiResult(async () => await apiRequest('/api/admin-session/login', {
        method: 'POST',
        body: { code }
    }));
}

async function api_adminLogout() {
    return await safeApiResult(async () => await apiRequest('/api/admin-session', {
        method: 'DELETE'
    }));
}

async function api_adminStatus() {
    return await apiRequest('/api/admin-session');
}

async function api_uploadPost(postData, photoFiles = []) {
    return await safeApiResult(async () => {
        const form = new FormData();
        form.append('eventCode', postData.eventCode || getCurrentEventCodeForApi());
        form.append('guestName', postData.guestName || postData.name || postData.nick || '');
        form.append('side', postData.side || '');
        form.append('category', postData.category || '');
        form.append('message', postData.message ?? postData.msg ?? '');

        normalizeFiles(photoFiles).forEach(file => form.append('photos', file));

        return await apiRequest('/api/posts', {
            method: 'POST',
            body: form
        });
    });
}

async function api_fetchPosts() {
    const eventCode = getCurrentEventCodeForApi();
    if (!eventCode) return [];

    return await apiRequest('/api/posts', {
        query: { eventCode }
    });
}

async function api_deletePost(postId) {
    return await safeApiResult(async () => await apiRequest(`/api/posts/${encodeURIComponent(postId)}`, {
        method: 'DELETE'
    }));
}

async function api_toggleLike(postId) {
    return await safeApiResult(async () => await apiRequest(`/api/posts/${encodeURIComponent(postId)}/like-toggle`, {
        method: 'POST'
    }));
}

async function api_operatorLogin(username, password) {
    return await safeApiResult(async () => await apiRequest('/api/operator/login', {
        method: 'POST',
        body: { username, password }
    }));
}

async function api_operatorStatus() {
    return await apiRequest('/api/operator/status');
}

async function api_operatorLogout() {
    return await safeApiResult(async () => await apiRequest('/api/operator/logout', {
        method: 'DELETE'
    }));
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

window.JspbookApi = {
    configureApiBaseUrl,
    get baseUrl() {
        return getApiBaseUrl();
    },
    request: apiRequest,
    listEvents: api_listEvents,
    createEvent: api_createEvent,
    fetchEvent: api_fetchEvent,
    uploadEventPhotos: api_uploadEventPhotos,
    deleteEvent: api_deleteEvent,
    enterGuestSession: api_enterGuestSession,
    getGuestSession: api_getGuestSession,
    clearGuestSession: api_clearGuestSession,
    adminLogin: api_adminLogin,
    adminLogout: api_adminLogout,
    adminStatus: api_adminStatus,
    uploadPost: api_uploadPost,
    fetchPosts: api_fetchPosts,
    deletePost: api_deletePost,
    toggleLike: api_toggleLike,
    operatorLogin: api_operatorLogin,
    operatorStatus: api_operatorStatus,
    operatorLogout: api_operatorLogout
};
