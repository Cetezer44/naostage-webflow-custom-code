/* ── contact-form ── source Webflow : page_contact_embed-form.html ── */
  document.addEventListener('DOMContentLoaded', function () {
    var sel   = document.getElementById('Objet');
    var other = document.getElementById('Autres');
    if (!sel || !other) return;

    function toggleOther() {
      if (sel.value === 'Autres') {
        other.style.display = '';
        other.disabled = false;
        other.setAttribute('required', '');
      } else {
        other.style.display = 'none';
        other.value = '';
        other.removeAttribute('required');
        other.disabled = true; // évite la soumission de la valeur si caché
      }
    }

    sel.addEventListener('change', toggleOther);
    toggleOther(); // état initial au chargement
  });

  /* Anti-spam : honeypot + délai minimum avant envoi */
  (function () {
    var MIN_DELAY = 4000; // ms entre l'affichage de la page et l'envoi
    var loadedAt = Date.now();

    document.addEventListener('DOMContentLoaded', function () {
      document.querySelectorAll('form[data-name="Formulaire de contact"], form[name="Formulaire de contact"]').forEach(function (form) {
        if (form.querySelector('.hp-field')) return;
        var wrap = document.createElement('div');
        wrap.className = 'hp-field';
        wrap.setAttribute('aria-hidden', 'true');
        wrap.innerHTML = '<label>Ne pas remplir<input type="text" name="website" tabindex="-1" autocomplete="off"></label>';
        form.appendChild(wrap);
      });
    });

    // Phase de capture : s'exécute avant le gestionnaire d'envoi de Webflow
    document.addEventListener('submit', function (e) {
      var form = e.target;
      if (!form || !form.querySelector) return;
      var hp = form.querySelector('.hp-field');
      if (!hp) return;
      var input = hp.querySelector('input');
      var tooFast = (Date.now() - loadedAt) < MIN_DELAY;
      if ((input && input.value !== '') || tooFast) {
        e.preventDefault();
        e.stopImmediatePropagation();
        return false;
      }
      // Envoi légitime : on retire le champ piège pour ne pas polluer les soumissions
      hp.parentNode.removeChild(hp);
    }, true);
  })();
