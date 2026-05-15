const BASE_URL = '';

async function api_createEvent(groomName, brideName) {
    const res = await fetch(`${BASE_URL}/api/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ groomName, brideName })
    });
    return await res.json();
}

async function api_fetchEvent(eventCode) {
    const res = await fetch(`${BASE_URL}/api/events/${eventCode}`);
    return await res.json();
}

async function api_uploadPost(postData, photoFiles) {
    const form = new FormData();

    form.append('eventCode', currentEventCode);
    form.append('guestName', postData.name);
    form.append('side', postData.side);
    form.append('category', postData.category);
    form.append('message', postData.msg);
    form.append('deletePin', postData.pin);

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

async function api_deletePost(postId, pin) {
    const res = await fetch(`${BASE_URL}/api/posts/${postId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin })
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
    const allPhotos = samplePosts.flatMap(p => p.photos || []);
    if (allPhotos.length === 0) return { success: false };

    allPhotos.forEach((src, i) => {
        const a = document.createElement('a');
        a.href = src;
        a.download = `순간_${i + 1}.jpg`;
        a.click();
    });

    return { success: true };
}