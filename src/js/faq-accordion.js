/* ── faq-accordion ── source Webflow : page_faq_faq-embed.html ── */
  document.addEventListener('DOMContentLoaded', () => {

    document.querySelectorAll('.faq-item-1').forEach((item) => {

      const top = item.querySelector('.top-faq-item1');
      if (!top) return;

      top.addEventListener('click', () => {
        // Ouvre/ferme uniquement l'item cliqué, sans toucher aux autres
        item.classList.toggle('is-open');
      });

    });

  });
