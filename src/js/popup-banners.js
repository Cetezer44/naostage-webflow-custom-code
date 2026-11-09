/* ── popup-banners ── composant Webflow « Popup Bannière » (.popup-banner, dans .popup-stack)
   Clic sur la croix [data-popup-close] → masque la bannière (fondu). Aucune mémorisation :
   les popups réapparaissent à chaque chargement de page. */
(() => {
  const hide = (banner) => {
    const done = () => { banner.style.display = 'none'; banner.setAttribute('aria-hidden', 'true'); };
    banner.style.opacity = '0';
    banner.style.transform = 'translateY(12px)';
    banner.addEventListener('transitionend', done, { once: true });
    setTimeout(done, 350); // sécurité si transitionend ne se déclenche pas
  };

  const init = () => {
    document.querySelectorAll('.popup-banner [data-popup-close]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const banner = btn.closest('.popup-banner');
        if (banner) hide(banner);
      });
    });
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
