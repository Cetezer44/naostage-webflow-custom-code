/* ── slider-about ── source Webflow : page_a-propos_slider-about.html ── */
  document.addEventListener('DOMContentLoaded', function () {
    var sliderEl = document.querySelector('.swiper');
    if (!sliderEl || !sliderEl.querySelector('.slider-about-img')) return;

    var swiper = new Swiper(sliderEl, {
      slidesPerView: 'auto',
      centeredSlides: true,
      spaceBetween: 20,
      loop: true,
      grabCursor: true,
      speed: 700,
      navigation: {
        nextEl: '.arrow-right',
        prevEl: '.arrow-left'
      }
    });

    // Sécurité : binding manuel des flèches au cas où
    // Webflow intercepterait le clic natif.
    var arrowLeft = document.querySelector('.arrow-left');
    var arrowRight = document.querySelector('.arrow-right');

    if (arrowLeft) {
      arrowLeft.addEventListener('click', function (e) {
        e.preventDefault();
        swiper.slidePrev();
      });
    }

    if (arrowRight) {
      arrowRight.addEventListener('click', function (e) {
        e.preventDefault();
        swiper.slideNext();
      });
    }
  });
