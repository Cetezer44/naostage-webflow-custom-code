/* ── popup-banners ── composant Webflow « Popup Bannière » (.popup-banner, dans .popup-stack)
   - clic sur la croix [data-popup-close] → masque la bannière (fondu) et mémorise la fermeture
     pour la session (sessionStorage, clé = data-popup-id) ; changer l'Identifiant dans les
     propriétés du composant ré-affiche la popup à tout le monde.
   - les bannières fermées pendant la session ne réapparaissent pas au rechargement. */
(() => {
  const KEY = 'naostage-popup-closed:';
  const store = {
    get: (id) => { try { return sessionStorage.getItem(KEY + id) === '1'; } catch { return false; } },
    set: (id) => { try { sessionStorage.setItem(KEY + id, '1'); } catch {} },
  };

  const hide = (banner, animate) => {
    const done = () => { banner.style.display = 'none'; banner.setAttribute('aria-hidden', 'true'); };
    if (!animate) return done();
    banner.style.opacity = '0';
    banner.style.transform = 'translateY(12px)';
    banner.addEventListener('transitionend', done, { once: true });
    setTimeout(done, 350); // sécurité si transitionend ne se déclenche pas
  };

  const init = () => {
    const banners = document.querySelectorAll('.popup-banner');
    if (!banners.length) return;

    banners.forEach((banner) => {
      const id = banner.getAttribute('data-popup-id') || '';
      if (id && store.get(id)) { hide(banner, false); return; }

      banner.querySelectorAll('[data-popup-close]').forEach((btn) => {
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          if (id) store.set(id);
          hide(banner, true);
        });
      });
    });
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
