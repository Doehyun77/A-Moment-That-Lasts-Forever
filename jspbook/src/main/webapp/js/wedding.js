// =====================================================
//  wedding.js — 웨딩사진 페이지 처리
// =====================================================

const DUMMY_WEDDING_PHOTOS = [
  'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=400&q=80',
  'https://images.unsplash.com/photo-1606216794074-735e91aa2c92?w=400&q=80',
  'https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=400&q=80',
  'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?w=400&q=80',
];

function showWeddingPhotoScreen() {
  const photos = weddingPhotos.length > 0 ? weddingPhotos : DUMMY_WEDDING_PHOTOS;
  const grid = document.getElementById('wedding-display-grid');
  grid.innerHTML = '';
  photos.forEach(src => {
    const img = document.createElement('img');
    img.src = src;
    img.style.cssText = 'width:100%; aspect-ratio:1; object-fit:cover; border-radius:10px; border:1px solid var(--border);';
    grid.appendChild(img);
  });
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById('slide-wrapper').style.display = 'none';
  document.getElementById('main-nav').style.display = 'none';
  document.querySelectorAll('.screen-body').forEach(b => b.style.display = 'none');
  document.getElementById('screen-wedding').classList.add('active');
  currentScreenName = 'wedding';
  screenHistory.push('upload');
}
