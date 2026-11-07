/* ── lightbox ── source Webflow : cmp_main-header_embed-lightbox.html ── */
  document.addEventListener('DOMContentLoaded', () => {
    const overlay = document.createElement('div');
    overlay.id = 'custom-lightbox-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.innerHTML = '<img alt="">';
    document.body.appendChild(overlay);
    const overlayImg = overlay.querySelector('img');

    const open = (src, alt) => {
      overlayImg.src = src; overlayImg.alt = alt || '';
      overlay.classList.remove('is-closing');
      overlay.classList.add('is-open');
      document.body.classList.add('lightbox-open');
      requestAnimationFrame(() => overlay.classList.add('is-visible'));
    };

    const close = () => {
      overlay.classList.add('is-closing');
      overlay.classList.remove('is-visible');
      const onEnd = () => {
        overlay.classList.remove('is-open', 'is-closing');
        document.body.classList.remove('lightbox-open');
        overlayImg.src = '';
        overlayImg.removeEventListener('animationend', onEnd);
      };
      overlayImg.addEventListener('animationend', onEnd);
    };

    document.querySelectorAll('.image-wrapper').forEach(w => {
      w.addEventListener('click', e => {
        const img = w.querySelector('img');
        if (!img) return;
        e.preventDefault();
        open(img.currentSrc || img.src, img.alt);
      });
    });

    overlay.addEventListener('click', e => { if (e.target === overlay) close(); });
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && overlay.classList.contains('is-open')) close();
    });
  });
