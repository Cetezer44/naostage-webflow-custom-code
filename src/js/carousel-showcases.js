/* ── carousel-showcases ── source Webflow : home_embed-carroussel-showcases.html ── */
(() => {
  const init = () => {
    const list = document.querySelector('.flex-showcase-2');
    if (!list) return;
    const wrapper = list.parentElement;
    if (!wrapper) return;

    wrapper.classList.add('flex-showcase-2-wrapper');

    // 1) Items originaux uniquement
    const originals = [...list.children].filter(c => !c.hasAttribute('data-marquee-clone'));
    if (!originals.length) return;

    originals.forEach(it => {
      it.querySelectorAll('img').forEach(img => img.draggable = false);
      it.querySelectorAll('a').forEach(a => a.addEventListener('dragstart', e => e.preventDefault()));
    });

    // 2) Clone un set complet en réinitialisant les styles GSAP/animation
    const cloneSet = () => {
      originals.forEach(orig => {
        const clone = orig.cloneNode(true);
        clone.setAttribute('data-marquee-clone', '1');
        clone.setAttribute('aria-hidden', 'true');
        clone.querySelectorAll('img').forEach(img => img.draggable = false);
        clone.querySelectorAll('a').forEach(a => a.addEventListener('dragstart', e => e.preventDefault()));

        // ✅ FIX : reset les styles inline laissés par GSAP/Webflow (opacity:0, transform:translateY)
        clone.querySelectorAll('[style]').forEach(el => {
          el.style.removeProperty('opacity');
          el.style.removeProperty('transform');
          el.style.removeProperty('translate');
          el.style.removeProperty('rotate');
          el.style.removeProperty('scale');
        });
        // Reset aussi sur le clone lui-même s'il a un style
        clone.style.removeProperty('opacity');
        clone.style.removeProperty('transform');

        list.appendChild(clone);
      });
    };

    // 3) Premier set pour mesurer setWidth
    cloneSet();

    // 4) setWidth = offsetLeft du 1er clone = largeur exacte d'un set + gaps
    let setWidth = list.querySelector('[data-marquee-clone="1"]').offsetLeft;

    // 5) Cloner jusqu'à couvrir setWidth * 2 + viewportWidth (garantie mathématique anti-blanc)
    let safety = 0;
    while (list.scrollWidth < setWidth * 2 + wrapper.offsetWidth && safety++ < 20) {
      cloneSet();
    }

    const state = {
      offset:      0,
      speed:       50,      // px/s — ajuste la vitesse ici
      lastTs:      null,
      dragging:    false,
      pointerId:   null,
      startX:      0,
      startOffset: 0,
      lastMoveX:   0,
      lastMoveTs:  0,
      velocity:    0,
      inertia:     0,
      paused:      false,
      raf:         0,
      moved:       false    // a-t-on dépassé le seuil de drag ?
    };

    const DRAG_THRESHOLD = 6; // px — en dessous, on considère que c'est un clic

    const normalizeOffset = (o) => {
      o = o % setWidth;
      if (o > 0) o -= setWidth;
      return o;
    };

    const apply = () => {
      list.style.transform = `translate3d(${normalizeOffset(state.offset)}px, 0, 0)`;
    };

    const tick = (ts) => {
      if (state.lastTs == null) state.lastTs = ts;
      const dt = Math.min((ts - state.lastTs) / 1000, 0.1);
      state.lastTs = ts;

      if (!state.dragging && !state.paused) {
        if (Math.abs(state.inertia) > 1) {
          state.offset += state.inertia * dt;
          state.inertia *= Math.pow(0.94, dt * 60);
          if (Math.abs(state.inertia) < state.speed) state.inertia = 0;
        } else {
          state.offset -= state.speed * dt;
        }
        apply();
      }
      state.raf = requestAnimationFrame(tick);
    };

    const onMove = (e) => {
      if (!state.dragging || e.pointerId !== state.pointerId) return;
      const dx = e.clientX - state.startX;
      if (!state.moved && Math.abs(dx) > DRAG_THRESHOLD) state.moved = true;
      state.offset = state.startOffset + dx;
      apply();
      const now = performance.now();
      const ddt = (now - state.lastMoveTs) / 1000;
      if (ddt > 0) state.velocity = (e.clientX - state.lastMoveX) / ddt;
      state.lastMoveX  = e.clientX;
      state.lastMoveTs = now;
    };

    const onUp = (e) => {
      if (!state.dragging) return;
      state.dragging = false;
      state.inertia  = state.velocity;
      wrapper.classList.remove('is-dragging');
      // ✅ FIX : plus de pointer capture → on retire les listeners posés sur window
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
    };

    const onDown = (e) => {
      if (e.button !== undefined && e.button !== 0) return;
      state.dragging    = true;
      state.pointerId   = e.pointerId;
      state.startX      = e.clientX;
      state.offset      = normalizeOffset(state.offset);
      state.startOffset = state.offset;
      state.lastMoveX   = e.clientX;
      state.lastMoveTs  = performance.now();
      state.velocity    = 0;
      state.inertia     = 0;
      state.moved       = false;
      wrapper.classList.add('is-dragging');
      // ✅ FIX : PAS de setPointerCapture — ça "volait" le click natif des liens.
      // On suit le drag via window pour continuer à capter le mouvement même
      // si le pointeur sort du wrapper.
      window.addEventListener('pointermove', onMove);
      window.addEventListener('pointerup', onUp);
      window.addEventListener('pointercancel', onUp);
    };

    wrapper.addEventListener('pointerdown', onDown);

    // Bloque le clic sur les liens uniquement si un vrai drag a eu lieu juste avant
    wrapper.addEventListener('click', (e) => {
      if (state.moved) {
        e.preventDefault();
        e.stopPropagation();
      }
    }, true);

    // Pause hors viewport — reset lastTs pour éviter un saut de dt au retour
    new IntersectionObserver((entries) => {
      entries.forEach(en => {
        if (!en.isIntersecting) {
          state.paused = true;
        } else {
          state.paused = false;
          state.lastTs = null; // ✅ reset pour éviter un gros dt au retour
        }
      });
    }, { threshold: 0 }).observe(wrapper);

    // Recalcul sur resize
    let rt;
    window.addEventListener('resize', () => {
      clearTimeout(rt);
      rt = setTimeout(() => {
        const fc = list.querySelector('[data-marquee-clone="1"]');
        if (fc) setWidth = fc.offsetLeft;
        state.offset = normalizeOffset(state.offset);
      }, 150);
    });

    state.raf = requestAnimationFrame(tick);
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
