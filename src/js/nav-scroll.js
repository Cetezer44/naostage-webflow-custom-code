/* ── nav-scroll ── source Webflow : site footer "[Color Background Menu]" ── */
  document.addEventListener("DOMContentLoaded", function () {
    const nav = document.querySelector(".nav_component");
    if (!nav) return;

    function toggleNavClass() {
      if (window.scrollY > 30) {
        nav.classList.add("nav_scrolled");
      } else {
        nav.classList.remove("nav_scrolled");
      }
    }

    window.addEventListener("scroll", toggleNavClass);
    toggleNavClass();
  });
