/* ── anim-fade-up ── source Webflow : cmp_main-header_embed-fade-up.html ── */
document.addEventListener("DOMContentLoaded", function () {
  if (typeof gsap === "undefined" || typeof ScrollTrigger === "undefined") return;
  gsap.registerPlugin(ScrollTrigger);

  // 🎯 Sélecteur : tous les éléments avec data-anim="fade-up"
  const fadeElements = document.querySelectorAll('[data-anim="fade-up"]');

  fadeElements.forEach((el) => {
    // Valeurs surchargeables via attributs (optionnel)
    const distance = parseFloat(el.dataset.distance) || 20;   // px
    const duration = parseFloat(el.dataset.duration) || 0.8;  // s
    const delay    = parseFloat(el.dataset.delay)    || 0;    // s
    const startPos = el.dataset.start || "top 85%";

    // État initial
    gsap.set(el, { opacity: 0, y: distance });

    // Animation au scroll (one-shot, pas de scrub : l'anim se joue une fois)
    gsap.to(el, {
      opacity: 1,
      y: 0,
      duration: duration,
      delay: delay,
      ease: "power2.out",
      scrollTrigger: {
        trigger: el,
        start: startPos,
        toggleActions: "play none none none",
        // markers: true,
      },
    });
  });

  window.addEventListener("load", () => ScrollTrigger.refresh());
});
