/* ── applications-category ── source Webflow : page_categorie-applications_embed-app-cat.html ── */
(function () {
  // Garde : ne s'exécute que si la page contient des tags de solution
  if (!document.querySelector('.tag-solution-cat')) return;
  const colorMap = {
    'K SYSTEM Sense': '#511db1',
    'K SYSTEM Custom': '#6da7d6',
    'Beakon Module': '#d09ed3',
    'K SYSTEM Flow': '#9328d2'
  };

  function applyTagColors() {
    document.querySelectorAll('.tag-solution-cat').forEach(el => {
      const text = el.textContent.trim();
      if (colorMap[text]) {
        el.style.backgroundColor = colorMap[text];
      }
    });
  }

  // Appliquer au chargement
  document.addEventListener('DOMContentLoaded', applyTagColors);

  // Observer les changements dynamiques (CMS Webflow)
  const observer = new MutationObserver(applyTagColors);
  observer.observe(document.body, { childList: true, subtree: true });
})();
