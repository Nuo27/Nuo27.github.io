/**
 * main.js — Nuo.Dev tactical telemetry frontend
 * Vanilla JS. Cinematic motion. Respects prefers-reduced-motion.
 */

(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var isTouch = window.matchMedia('(hover: none), (pointer: coarse)').matches;

  // ============================================
  // Inject CRT overlay, grain, vignette, HUD frame
  // ============================================
  function injectAtmosphere() {
    var frag = document.createDocumentFragment();

    var grain = document.createElement('div');
    grain.className = 'crt-grain';
    frag.appendChild(grain);

    var vignette = document.createElement('div');
    vignette.className = 'crt-vignette';
    frag.appendChild(vignette);

    var overlay = document.createElement('div');
    overlay.className = 'crt-overlay';
    frag.appendChild(overlay);

    // HUD corner registration marks
    var hud = document.createElement('div');
    hud.className = 'hud-frame';
    ['tl', 'tr', 'bl', 'br'].forEach(function (pos) {
      var c = document.createElement('span');
      c.className = 'hud-corner ' + pos;
      hud.appendChild(c);
    });
    frag.appendChild(hud);

    document.body.appendChild(frag);
  }

  // ============================================
  // Scroll progress bar
  // ============================================
  function initScrollProgress() {
    var progressBar = document.createElement('div');
    progressBar.className = 'scroll-progress';
    document.body.prepend(progressBar);

    function update() {
      var scrollTop = window.scrollY;
      var docHeight = document.documentElement.scrollHeight - window.innerHeight;
      var progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
      progressBar.style.width = progress + '%';
    }
    window.addEventListener('scroll', update, { passive: true });
    update();
  }

  // ============================================
  // Back to top
  // ============================================
  function initBackToTop() {
    var btn = document.getElementById('backToTop');
    if (!btn) return;
    window.addEventListener('scroll', function () {
      if (window.scrollY > 500) btn.classList.add('visible');
      else btn.classList.remove('visible');
    }, { passive: true });
    btn.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // ============================================
  // Navbar scroll state
  // ============================================
  function initNavbarScroll() {
    var navbar = document.querySelector('.navbar-themed');
    if (!navbar) return;
    window.addEventListener('scroll', function () {
      if (window.scrollY > 50) navbar.classList.add('scrolled');
      else navbar.classList.remove('scrolled');
    }, { passive: true });
  }

  // ============================================
  // Scroll reveal — handles .reveal, [data-reveal]
  // ============================================
  function initScrollReveal() {
    var targets = document.querySelectorAll('.reveal, .reveal-left, .reveal-right, [data-reveal]');
    if (!targets.length) return;

    // Mark body so CSS knows JS is ready — this is what activates the hide styles.
    // Without this class, .reveal content is visible by default (no-JS fallback).
    document.body.classList.add('js-reveal-ready');

    if (reduceMotion) {
      targets.forEach(function (el) {
        el.classList.add('visible', 'is-visible');
      });
      return;
    }

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

    targets.forEach(function (el) { observer.observe(el); });

    // Safety net: after 2.5s, force-show any reveal elements the observer
    // hasn't revealed yet (handles observer edge cases / hidden elements).
    setTimeout(function () {
      document.querySelectorAll('.reveal:not(.visible), .reveal-left:not(.visible), .reveal-right:not(.visible), [data-reveal]:not(.is-visible)').forEach(function (el) {
        el.classList.add('visible', 'is-visible');
      });
    }, 2500);
  }

  // ============================================
  // Theme — handled by assets/js/theme.js (pre-paint).
  // toggleTheme() and initTheme() live there to avoid FOUC.
  // ============================================

  // ============================================
  // Magnetic hover for primary CTAs
  // ============================================
  function initMagneticButtons() {
    if (reduceMotion || isTouch) return;
    var buttons = document.querySelectorAll('.btn-primary-custom, .btn-secondary-custom, .btn-project, .btn-resume');
    buttons.forEach(function (btn) {
      btn.addEventListener('mousemove', function (e) {
        var rect = btn.getBoundingClientRect();
        var x = e.clientX - rect.left - rect.width / 2;
        var y = e.clientY - rect.top - rect.height / 2;
        btn.style.transform = 'translate(' + (x * 0.18) + 'px, ' + (y * 0.22) + 'px)';
      });
      btn.addEventListener('mouseleave', function () {
        btn.style.transform = '';
      });
    });
  }

  // ============================================
  // Custom cursor — additive phosphor tracer (no native cursor hidden)
  // ============================================
  function initCursor() {
    if (reduceMotion || isTouch) return;

    var dot = document.createElement('div');
    dot.className = 'cursor-dot';
    var ring = document.createElement('div');
    ring.className = 'cursor-ring';
    document.body.appendChild(dot);
    document.body.appendChild(ring);

    var mx = window.innerWidth / 2, my = window.innerHeight / 2;
    var rx = mx, ry = my;
    var visible = false;

    window.addEventListener('mousemove', function (e) {
      mx = e.clientX; my = e.clientY;
      dot.style.transform = 'translate(' + mx + 'px, ' + my + 'px)';
      if (!visible) {
        visible = true;
        dot.style.opacity = '1';
        ring.style.opacity = '1';
      }
    });

    document.addEventListener('mouseleave', function () {
      visible = false;
      dot.style.opacity = '0';
      ring.style.opacity = '0';
    });

    // Ring trails with easing
    function tick() {
      rx += (mx - rx) * 0.18;
      ry += (my - ry) * 0.18;
      ring.style.transform = 'translate(' + rx + 'px, ' + ry + 'px)';
      requestAnimationFrame(tick);
    }
    tick();

    // Expand ring on interactive hover
    document.addEventListener('mouseover', function (e) {
      if (e.target.closest('a, button, .contact-icon, .social, .nav-link, .skill-tag, input')) {
        ring.classList.add('cursor-ring--active');
      }
    });
    document.addEventListener('mouseout', function (e) {
      if (e.target.closest('a, button, .contact-icon, .social, .nav-link, .skill-tag, input')) {
        ring.classList.remove('cursor-ring--active');
      }
    });
  }

  // ============================================
  // Glitch — random bursts on the landing display name
  // ============================================
  function initGlitch() {
    if (reduceMotion) return;
    var el = document.querySelector('[data-glitch]');
    if (!el) return;
    function burst() {
      el.classList.add('glitching');
      setTimeout(function () { el.classList.remove('glitching'); }, 320);
      setTimeout(burst, 3500 + Math.random() * 4000);
    }
    setTimeout(burst, 2800);
  }

  // ============================================
  // Parallax — profile monitor + ambient orbs respond to mouse
  // ============================================
  function initParallax() {
    if (reduceMotion || isTouch) return;
    var monitor = document.querySelector('.profile-monitor');
    var hero = document.querySelector('.landing-wrapper');
    if (!monitor && !hero) return;

    window.addEventListener('mousemove', function (e) {
      var cx = (e.clientX / window.innerWidth - 0.5);
      var cy = (e.clientY / window.innerHeight - 0.5);
      if (monitor) {
        monitor.style.transition = 'none';
        monitor.style.transform = 'translate(' + (cx * -18) + 'px, ' + (cy * -14) + 'px)';
      }
    });
  }

  // ============================================
  // Boot cursor blink — cycle terminal cursor after boot lines settle
  // ============================================
  function initBootCursor() {
    var seq = document.querySelector('[data-boot]');
    if (!seq) return;
    var lines = seq.querySelectorAll('.boot-line');
    if (!lines.length) return;
    // Remove the trailing cursor block once boot completes
    setTimeout(function () {
      lines.forEach(function (l) {
        var c = l.querySelector('.cursor');
        if (c) c.style.display = 'inline-block'; // keep blinking on last line only
      });
      // Hide cursors on lines except last
      for (var i = 0; i < lines.length - 1; i++) {
        var c = lines[i].querySelector('.cursor');
        if (c) c.style.display = 'none';
      }
    }, 1800);
  }

  // ============================================
  // Init all
  // ============================================
  document.addEventListener('DOMContentLoaded', function () {
    injectAtmosphere();
    initScrollProgress();
    initBackToTop();
    initNavbarScroll();
    initScrollReveal();
    initMagneticButtons();
    initCursor();
    initGlitch();
    initParallax();
    initBootCursor();
  });

})();
