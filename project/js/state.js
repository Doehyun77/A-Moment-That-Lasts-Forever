// =====================================================
//  state.js — 전역 상태
//  백엔드 연동 시 samplePosts 대신 서버 데이터 사용
// =====================================================

const samplePosts = [];          // TODO: 서버 연동 후 제거

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

let screenHistory    = [];
let currentScreenName = 'qr';
const screenOrder    = ['landing', 'upload', 'gallery'];

let deleteTargetIndex = null;
let qrInstance        = null;
