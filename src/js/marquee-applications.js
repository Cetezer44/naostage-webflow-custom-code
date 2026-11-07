/* ── marquee-applications ── source Webflow : cmp_section-application-solution_embed-apps-home.html ── */
(() => {
  const SPEED = 50; // px/s

  const initList = (list) => {
    if (!list || list.dataset.marqueeInit === '1') return;
    const wrapper = list.parentElement;
    if (!wrapper) return;
    list.dataset.marqueeInit = '1';                 // évite une double init
    wrapper.classList.add('list-applications-home-wrapper');

    const originals = [...list.children].filter(c => !c.hasAttribute('data-marquee-clone'));
    if (!originals.length) return;

    const noDrag = (el) => {
      el.querySelectorAll('img').forEach(img => { img.draggable = false; });
      el.querySelectorAll('a').forEach(a => a.addEventListener('dragstart', e => e.preventDefault()));
    };
    originals.forEach(noDrag);

    // ⬇️ LE FIX : on purge l'état d'animation hérité (Webflow IX2 / GSAP)
    const sanitize = (root) => {
      [root, ...root.querySelectorAll('*')].forEach(el => {
        ['opacity','transform','translate','rotate','scale','visibility'].forEach(p => el.style.removeProperty(p));
        el.removeAttribute('data-w-id');            // IX2 ne rebindera pas les clones
      });
      root.querySelectorAll('img').forEach(img => { img.loading = 'eager'; });
    };
    const sanitizeAll = () => list.querySelectorAll('[data-marquee-clone="1"]').forEach(sanitize);

    const cloneSet = () => originals.forEach(orig => {
      const clone = orig.cloneNode(true);
      clone.setAttribute('data-marquee-clone', '1');
      clone.setAttribute('aria-hidden', 'true');
      clone.querySelectorAll('a,button').forEach(a => a.setAttribute('tabindex', '-1'));
      noDrag(clone);
      sanitize(clone);
      list.appendChild(clone);
    });

    // Mesure robuste : écart réel entre le 1er original et le 1er clone
    let setWidth = 1;
    const measure = () => {
      const fc = list.querySelector('[data-marquee-clone="1"]');
      if (fc) {
        const w = fc.getBoundingClientRect().left - originals[0].getBoundingClientRect().left;
        if (w > 0) setWidth = w;
      }
      return setWidth;
    };

    const fill = () => {
      measure();
      let safety = 0;
      // il faut au moins 1 set + 2 viewports de contenu
      while (list.scrollWidth < setWidth + wrapper.offsetWidth * 2 && safety++ < 8) cloneSet();
    };
    cloneSet();
    fill();

    const state = { offset:0, lastTs:null, dragging:false, pointerId:null,
                    startX:0, startOffset:0, lastMoveX:0, lastMoveTs:0,
                    velocity:0, inertia:0, moved:0, paused:false, raf:0 };

    const apply = () => {
      let o = state.offset % setWidth;
      if (o > 0) o -= setWidth;
      list.style.transform = `translate3d(${o}px,0,0)`;   // backticks !
    };
    apply();

    const tick = (ts) => {
      if (state.lastTs == null) state.lastTs = ts;
      const dt = Math.min((ts - state.lastTs) / 1000, 0.05); // évite les gros sauts après un onglet inactif
      state.lastTs = ts;
      if (!state.dragging && !state.paused) {
        let v = -SPEED;
        if (Math.abs(state.inertia) > 1) {
          v = state.inertia;
          state.inertia *= Math.pow(0.94, dt * 60);        // décroissance corrigée
          if (Math.abs(state.inertia) < SPEED) state.inertia = 0;
        }
        state.offset += v * dt;
        apply();
      }
      state.raf = requestAnimationFrame(tick);
    };

    const onDown = (e) => {
      if (e.button !== undefined && e.button !== 0) return;
      Object.assign(state, { dragging:true, pointerId:e.pointerId, startX:e.clientX,
        startOffset:state.offset, lastMoveX:e.clientX, lastMoveTs:performance.now(),
        velocity:0, moved:0 });
      wrapper.classList.add('is-dragging');
      try { wrapper.setPointerCapture(e.pointerId); } catch(_) {}
    };
    const onMove = (e) => {
      if (!state.dragging || e.pointerId !== state.pointerId) return;
      const dx = e.clientX - state.startX;
      state.moved = Math.max(state.moved, Math.abs(dx));
      state.offset = state.startOffset + dx;
      apply();
      const now = performance.now();
      const ddt = (now - state.lastMoveTs) / 1000;
      if (ddt > 0) state.velocity = (e.clientX - state.lastMoveX) / ddt;
      state.lastMoveX = e.clientX; state.lastMoveTs = now;
    };
    const onUp = (e) => {
      if (!state.dragging) return;
      state.dragging = false;
      state.inertia = state.velocity;
      wrapper.classList.remove('is-dragging');
      try { wrapper.releasePointerCapture(e.pointerId); } catch(_) {}
    };
    wrapper.addEventListener('pointerdown', onDown);
    wrapper.addEventListener('pointermove', onMove);
    wrapper.addEventListener('pointerup', onUp);
    wrapper.addEventListener('pointercancel', onUp);
    // pas d'ouverture de lien si on vient de drag
    wrapper.addEventListener('click', (e) => {
      if (state.moved > 6) { e.preventDefault(); e.stopPropagation(); state.moved = 0; }
    }, true);

    new IntersectionObserver((entries) => {
      entries.forEach(en => { state.paused = !en.isIntersecting; });
    }, { threshold: 0 }).observe(wrapper);

    // re-mesure quand tout est vraiment chargé + sur resize
    const refresh = () => { sanitizeAll(); measure(); fill(); apply(); };
    window.addEventListener('load', refresh);
    setTimeout(refresh, 1200);                     // après le reveal Webflow
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(refresh);
    let rt;
    window.addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(refresh, 150); });
    if ('ResizeObserver' in window) new ResizeObserver(() => { clearTimeout(rt); rt = setTimeout(refresh, 150); }).observe(wrapper);

    state.raf = requestAnimationFrame(tick);
  };

  const init = () => document.querySelectorAll('.list-applications-home').forEach(initList);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
