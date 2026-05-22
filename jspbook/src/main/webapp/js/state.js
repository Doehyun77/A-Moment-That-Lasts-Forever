// =====================================================
//  state.js — 전역 상태
// =====================================================

let posts = [];                    // 서버에서 불러온 게시글 목록

async function loadPosts() {
  if (!currentEventCode) { posts = []; return; }
  try {
    const data = await api_fetchPosts();
    posts = data.map(p => ({
      ...p,
      nick: p.nick || p.name,
      displayName: p.displayName || [p.side, p.category, p.nick || p.name].filter(Boolean).join(' '),
      color: '#C5826A',
      liked: !!p.liked,
      canDelete: !!p.canDelete,
      canAdminDelete: !!p.canAdminDelete,
      likes: Number(p.likes || 0)
    }));
  } catch (e) {
    console.error('게시글 로드 실패:', e);
    posts = [];
  }
}

let currentNickname = '';
let currentCategory = '';
let currentNick     = '';
let currentSide     = '';
let postCount       = 0;
let pendingPhotos   = [];
let pendingFiles    = [];

let currentSort   = 'recent';
let currentFilter = 'all';
let adminFilter   = 'all';
let adminEvents   = [];
let adminEventCode = '';

let screenHistory    = [];
let currentScreenName = 'login';
const screenOrder    = ['landing', 'upload', 'gallery'];

let deleteTargetPostId = null;
let qrInstance        = null;
let currentEventCode  = '';
let currentEventInfo  = null;

function buildEventEntryUrl(eventCode) {
  return window.location.origin + window.location.pathname + '?mode=entry&code=' + encodeURIComponent(eventCode);
}
