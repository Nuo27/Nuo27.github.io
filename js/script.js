function scrollToSection(sectionId) {
  var section = document.getElementById(sectionId);
  var mainNav = document.getElementById("mainNav");
  var headerHeight = mainNav.offsetHeight;
  var navbarTitle = document.querySelector(".navbar-title");

  if (section && mainNav) {
    var sectionPosition = section.offsetTop - headerHeight;
    var start = window.pageYOffset;
    var startTime = performance.now();
    var duration = 500;

    function scrollStep(timestamp) {
      var timeElapsed = timestamp - startTime;
      var scrollY = Math.max(
        0,
        start - easeInOutQuad(timeElapsed, 0, start - sectionPosition, duration)
      );
      window.scrollTo(0, scrollY);
      if (window.pageYOffset === 0) {
        navbarTitle.classList.add("scrolled");
      } else {
        navbarTitle.classList.remove("scrolled");
      }
      if (timeElapsed < duration) {
        window.requestAnimationFrame(scrollStep);
      }
    }

    window.requestAnimationFrame(scrollStep);
  }
}
function easeInOutQuad(t, b, c, d) {
  t /= d / 2;
  if (t < 1) return (c / 2) * t * t + b;
  t--;
  return (-c / 2) * (t * (t - 2) - 1) + b;
}
function toggleNav() {
  var navList = document.getElementById("navList");
  navList.style.display = navList.style.display === "none" ? "block" : "none";
}
