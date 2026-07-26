// Click-to-open lightbox with prev/next for .gallery-grid. No framework, no build step —
// links still have real hrefs to the full-size image, so this is a progressive enhancement:
// without JS a click just navigates there directly.
document.addEventListener('DOMContentLoaded', () => {
  const grid = document.querySelector('.gallery-grid');
  if (!grid) return;

  const items = Array.from(grid.querySelectorAll('.gallery-item'));
  if (!items.length) return;

  const lightbox = document.createElement('div');
  lightbox.className = 'lightbox';
  lightbox.innerHTML = `
    <button type="button" class="lightbox-close" aria-label="Close">&times;</button>
    <button type="button" class="lightbox-prev" aria-label="Previous artwork">&#10094;</button>
    <img class="lightbox-img" alt="">
    <button type="button" class="lightbox-next" aria-label="Next artwork">&#10095;</button>
  `;
  document.body.appendChild(lightbox);

  const img = lightbox.querySelector('.lightbox-img');
  let currentIndex = -1;

  function show(index) {
    currentIndex = (index + items.length) % items.length;
    const item = items[currentIndex];
    img.src = item.getAttribute('href');
    img.alt = item.querySelector('img').alt;
    lightbox.classList.add('open');
  }

  function close() {
    lightbox.classList.remove('open');
    img.src = '';
  }

  items.forEach((item, index) => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      show(index);
    });
  });

  lightbox.querySelector('.lightbox-close').addEventListener('click', close);
  lightbox.querySelector('.lightbox-prev').addEventListener('click', () => show(currentIndex - 1));
  lightbox.querySelector('.lightbox-next').addEventListener('click', () => show(currentIndex + 1));

  lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox) close();
  });

  document.addEventListener('keydown', (e) => {
    if (!lightbox.classList.contains('open')) return;
    if (e.key === 'Escape') close();
    if (e.key === 'ArrowLeft') show(currentIndex - 1);
    if (e.key === 'ArrowRight') show(currentIndex + 1);
  });
});
