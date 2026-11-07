/* ── language-modal ── source Webflow : site footer "[Language Modal]" ── */
  document.addEventListener("DOMContentLoaded", function () {
    var STORAGE_KEY = "naostage_lang_selected";

    var stored = null;
    try {
      stored = localStorage.getItem(STORAGE_KEY);
    } catch (e) {}

    var path = window.location.pathname;
    var isEnglishPath = path === "/en" || path.indexOf("/en/") === 0;

    // If the visitor already picked a language previously, send them straight
    // to the matching locale instead of showing the modal again.
    if (stored === "en" && !isEnglishPath) {
      var toEn = path === "/" ? "/en" : "/en" + path;
      window.location.replace(toEn + window.location.search + window.location.hash);
      return;
    }
    if (stored === "fr" && isEnglishPath) {
      var toFr = path.replace(/^\/en(\/|$)/, "/");
      window.location.replace(toFr + window.location.search + window.location.hash);
      return;
    }

    var modal = document.querySelector(".flex-modal-language");
    if (modal && !stored) {
      modal.style.display = "flex";
    }

    function rememberLang(link) {
      var href = link.getAttribute("href") || "";
      var lang = /\/en(\/|$)/.test(href) ? "en" : "fr";
      try {
        localStorage.setItem(STORAGE_KEY, lang);
      } catch (e) {}
    }

    // Modal choice links + the FR/EN switcher already in the nav: a manual
    // click always updates the remembered preference, so switching language
    // by hand is never overridden by the auto-redirect above.
    document.querySelectorAll(".language-link, .local_link").forEach(function (link) {
      link.addEventListener("click", function () {
        rememberLang(link);
      });
    });
  });
