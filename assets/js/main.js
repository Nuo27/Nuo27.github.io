/**
 * main.js — Nuo.Dev frontend
 * Vanilla JS. Native navigation; no soft-router.
 * Respects prefers-reduced-motion.
 */

(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var isTouch = window.matchMedia('(hover: none), (pointer: coarse)').matches;

  // ============================================================
  // Atmosphere overlay (CRT grain, vignette, scanlines, HUD corners)
  // ============================================================
  function injectAtmosphere() {
    var frag = document.createDocumentFragment();
    ['crt-grain', 'crt-vignette', 'crt-overlay'].forEach(function (cls) {
      var d = document.createElement('div');
      d.className = cls;
      frag.appendChild(d);
    });
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

  // ============================================================
  // Scroll progress bar
  // ============================================================
  function initScrollProgress() {
    var progressBar = document.createElement('div');
    progressBar.className = 'scroll-progress';
    document.body.prepend(progressBar);
    function update() {
      var docHeight = document.documentElement.scrollHeight - window.innerHeight;
      var progress = docHeight > 0 ? (window.scrollY / docHeight) * 100 : 0;
      progressBar.style.width = progress + '%';
    }
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update, { passive: true });
    update();
  }

  // ============================================================
  // Back to top (button lives in footer)
  // ============================================================
  function initBackToTop() {
    var btn = document.getElementById('backToTop');
    if (!btn) return;
    window.addEventListener('scroll', function () {
      btn.classList.toggle('visible', window.scrollY > 500);
    }, { passive: true });
    btn.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // ============================================================
  // Navbar scroll state
  // ============================================================
  function initNavbarScroll() {
    var navbar = document.querySelector('.navbar-themed');
    if (!navbar) return;
    var onScroll = function () {
      navbar.classList.toggle('scrolled', window.scrollY > 50);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  // ============================================================
  // Scroll reveal (toggle on enter/exit → reversible)
  // ============================================================
  function initScrollReveal() {
    var targets = document.querySelectorAll('.reveal, .reveal-left, .reveal-right, [data-reveal]');
    if (!targets.length) return;
    document.body.classList.add('js-reveal-ready');

    if (reduceMotion || !('IntersectionObserver' in window)) {
      targets.forEach(function (el) { el.classList.add('visible', 'is-visible'); });
      return;
    }
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        var el = entry.target;
        if (entry.isIntersecting) el.classList.add('visible', 'is-visible');
        else el.classList.remove('visible', 'is-visible');
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    targets.forEach(function (el) { observer.observe(el); });
  }

  // ============================================================
  // Magnetic hover for primary CTAs
  // ============================================================
  function initMagneticButtons() {
    if (reduceMotion || isTouch) return;
    document.querySelectorAll('.btn-primary-custom, .btn-secondary-custom, .btn-project, .btn-resume, [data-magnetic]').forEach(function (btn) {
      btn.addEventListener('mousemove', function (e) {
        var rect = btn.getBoundingClientRect();
        var x = e.clientX - rect.left - rect.width / 2;
        var y = e.clientY - rect.top - rect.height / 2;
        btn.style.transform = 'translate(' + (x * 0.15) + 'px, ' + (y * 0.18) + 'px)';
      });
      btn.addEventListener('mouseleave', function () { btn.style.transform = ''; });
    });
  }

  // ============================================================
  // Glitch bursts on the cover wordmark
  // ============================================================
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

  // ============================================================
  // Cover-portrait mouse parallax
  // ============================================================
  function initParallax() {
    if (reduceMotion || isTouch) return;
    var portrait = document.querySelector('.cover-portrait');
    if (!portrait) return;
    window.addEventListener('mousemove', function (e) {
      var cx = (e.clientX / window.innerWidth - 0.5);
      var cy = (e.clientY / window.innerHeight - 0.5);
      portrait.style.transform = 'translate3d(' + (cx * -14) + 'px,' + (cy * -10) + 'px,0)';
    });
  }

  // ============================================================
  // Hero scroll recede
  // ============================================================
  function initHeroScroll() {
    if (reduceMotion) return;
    var hero = document.querySelector('.landing-wrapper');
    if (!hero) return;
    var ticking = false;
    function update() {
      var y = window.scrollY, vh = window.innerHeight;
      if (y >= vh) { ticking = false; return; }
      var pp = Math.min(y / vh, 1);
      hero.style.opacity = String(1 - pp * 0.55);
      hero.style.transform = 'scale(' + (1 - pp * 0.03) + ') translate3d(0,' + (y * 0.16) + 'px,0)';
      ticking = false;
    }
    window.addEventListener('scroll', function () {
      if (!ticking) { window.requestAnimationFrame(update); ticking = true; }
    }, { passive: true });
    update();
  }

  // ============================================================
  // Hero aurora (homepage only)
  // ============================================================
  function initHeroAurora() {
    if (!document.querySelector('.landing-wrapper')) return;
    var aurora = document.createElement('div');
    aurora.className = 'hero-aurora';
    document.body.appendChild(aurora);
  }

  // ============================================================
  // Lightbox overlay (mounted once; delegation)
  // ============================================================
  var lightboxApi = null;
  function initLightbox() {
    if (lightboxApi || document.querySelector('.lightbox')) return;

    var overlay = document.createElement('div');
    overlay.className = 'lightbox';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-label', 'Image viewer');
    overlay.innerHTML =
      '<span class="lightbox-counter mono"></span>' +
      '<button class="lightbox-btn lightbox-prev" type="button" aria-label="Previous"><i class="fas fa-chevron-left"></i></button>' +
      '<img class="lightbox-img" alt="" />' +
      '<button class="lightbox-btn lightbox-next" type="button" aria-label="Next"><i class="fas fa-chevron-right"></i></button>' +
      '<button class="lightbox-btn lightbox-close" type="button" aria-label="Close"><i class="fas fa-times"></i></button>';
    document.body.appendChild(overlay);

    var imgEl = overlay.querySelector('.lightbox-img');
    var counterEl = overlay.querySelector('.lightbox-counter');
    var prevBtn = overlay.querySelector('.lightbox-prev');
    var nextBtn = overlay.querySelector('.lightbox-next');
    var closeBtn = overlay.querySelector('.lightbox-close');
    var items = [], index = 0, lastFocused = null;

    function srcOf(el) {
      var s = el.getAttribute('data-lightbox-src');
      if (s) return s;
      var inner = el.querySelector && el.querySelector('img');
      return inner ? inner.src : el.src;
    }
    function groupOf(el) {
      var g = el.getAttribute('data-lightbox-group');
      if (g) return g;
      var parent = el.closest('[data-lightbox-group]');
      return parent ? parent.getAttribute('data-lightbox-group') : 'default';
    }
    function pad(n) { return n < 10 ? '0' + n : '' + n; }
    function show(i) {
      index = (i + items.length) % items.length;
      imgEl.src = items[index];
      counterEl.textContent = pad(index + 1) + ' / ' + pad(items.length);
    }
    function open(triggerEl) {
      var group = groupOf(triggerEl);
      var nodes = Array.prototype.slice.call(
        document.querySelectorAll('[data-lightbox-group="' + group + '"] [data-lightbox], [data-lightbox][data-lightbox-group="' + group + '"]')
      );
      var seen = {}; items = [];
      nodes.forEach(function (n) { var s = srcOf(n); if (!seen[s]) { seen[s] = 1; items.push(s); } });
      if (!items.length) items = [srcOf(triggerEl)];
      var start = nodes.indexOf(triggerEl);
      lastFocused = document.activeElement;
      overlay.classList.add('open');
      document.documentElement.style.overflow = 'hidden';
      show(start < 0 ? 0 : start);
      closeBtn.focus();
    }
    function close() {
      overlay.classList.remove('open');
      document.documentElement.style.overflow = '';
      if (lastFocused && lastFocused.focus) lastFocused.focus();
    }
    overlay.addEventListener('click', function (e) {
      if (e.target === overlay || e.target === closeBtn) close();
    });
    prevBtn.addEventListener('click', function (e) { e.stopPropagation(); show(index - 1); });
    nextBtn.addEventListener('click', function (e) { e.stopPropagation(); show(index + 1); });
    closeBtn.addEventListener('click', close);
    document.addEventListener('keydown', function (e) {
      if (!overlay.classList.contains('open')) return;
      if (e.key === 'Escape') close();
      else if (e.key === 'ArrowLeft') show(index - 1);
      else if (e.key === 'ArrowRight') show(index + 1);
    });
    document.addEventListener('click', function (e) {
      var el = e.target.closest('[data-lightbox]');
      if (!el || el.closest('.gallery')) return;
      e.preventDefault();
      open(el);
    });
    lightboxApi = {
      open: function (group, i) {
        var nodes = Array.prototype.slice.call(
          document.querySelectorAll('[data-lightbox][data-lightbox-group="' + group + '"]')
        );
        var seen = {}; items = [];
        nodes.forEach(function (n) { var s = srcOf(n); if (!seen[s]) { seen[s] = 1; items.push(s); } });
        if (!items.length) return;
        lastFocused = document.activeElement;
        overlay.classList.add('open');
        document.documentElement.style.overflow = 'hidden';
        show(Math.max(0, Math.min(i || 0, items.length - 1)));
        closeBtn.focus();
      }
    };
  }

  // ============================================================
  // Opt markdown images into the lightbox
  // ============================================================
  function augmentMarkdownImages() {
    document.querySelectorAll('.markdown-body').forEach(function (body, bi) {
      body.querySelectorAll('img:not(.emoji)').forEach(function (img) {
        if (img.closest('.gallery')) return;
        if (img.hasAttribute('data-lightbox')) return;
        img.setAttribute('data-lightbox', '');
        img.setAttribute('data-lightbox-group', 'md-' + bi);
      });
    });
  }

  // ============================================================
  // Galleries — slide track, swipe/drag, thumbs, in-view keyboard
  // ============================================================
  function initGalleries() {
    var galleries = document.querySelectorAll('.gallery');
    if (!galleries.length) return;
    var inViewGallery = null;
    var pad = function (n) { return n < 10 ? '0' + n : '' + n; };

    galleries.forEach(function (gallery) {
      var stage = gallery.querySelector('.gallery-stage');
      var track = gallery.querySelector('.gallery-track');
      var slides = gallery.querySelectorAll('.gallery-slide');
      var thumbs = gallery.querySelectorAll('.gallery-thumb');
      var prevBtn = gallery.querySelector('.gallery-prev');
      var nextBtn = gallery.querySelector('.gallery-next');
      var currentEl = gallery.querySelector('.gallery-current');
      var count = slides.length, index = 0;

      function go(i) {
        index = (i + count) % count;
        gallery.dataset.index = index;
        track.style.transform = 'translateX(' + (-index * 100) + '%)';
        thumbs.forEach(function (t, ti) { t.classList.toggle('active', ti === index); });
        if (currentEl) currentEl.textContent = pad(index + 1);
      }
      gallery._go = go;

      if (prevBtn) prevBtn.addEventListener('click', function (e) { e.stopPropagation(); go(index - 1); });
      if (nextBtn) nextBtn.addEventListener('click', function (e) { e.stopPropagation(); go(index + 1); });
      thumbs.forEach(function (t, ti) {
        t.addEventListener('click', function (e) { e.stopPropagation(); go(ti); });
      });

      var startX = 0, dragging = false, moved = 0, lastDelta = 0;
      function down(e) {
        if (e.target.closest('.gallery-nav, .gallery-thumb')) return;
        dragging = true; moved = 0; lastDelta = 0;
        startX = e.clientX;
        track.classList.add('dragging');
        if (stage.setPointerCapture) { try { stage.setPointerCapture(e.pointerId); } catch (err) {} }
      }
      function move(e) {
        if (!dragging) return;
        var dx = e.clientX - startX;
        moved = Math.max(moved, Math.abs(dx));
        lastDelta = dx;
        var edge = ((index === 0 && dx > 0) || (index === count - 1 && dx < 0)) ? dx * 0.35 : dx;
        track.style.transform = 'translateX(calc(' + (-index * 100) + '% + ' + edge + 'px))';
      }
      function up() {
        if (!dragging) return;
        dragging = false;
        track.classList.remove('dragging');
        var threshold = Math.max(40, stage.clientWidth * 0.1);
        if (Math.abs(lastDelta) > threshold) go(lastDelta < 0 ? index + 1 : index - 1);
        else go(index);
        if (moved < 8 && lightboxApi) {
          var grp = slides[index].getAttribute('data-lightbox-group');
          if (grp) setTimeout(function () { lightboxApi.open(grp, index); }, 0);
        }
      }
      stage.addEventListener('pointerdown', down);
      stage.addEventListener('pointermove', move);
      stage.addEventListener('pointerup', up);
      stage.addEventListener('pointercancel', up);
      stage.addEventListener('dragstart', function (e) { e.preventDefault(); });

      if ('IntersectionObserver' in window) {
        new IntersectionObserver(function (entries) {
          entries.forEach(function (en) {
            if (en.isIntersecting) inViewGallery = gallery;
            else if (inViewGallery === gallery) inViewGallery = null;
          });
        }, { threshold: 0.6 }).observe(gallery);
      }
    });

    document.addEventListener('keydown', function (e) {
      if (!inViewGallery) return;
      if (document.querySelector('.lightbox.open')) return;
      var ae = document.activeElement;
      if (ae && (ae.tagName === 'INPUT' || ae.tagName === 'TEXTAREA' || ae.isContentEditable)) return;
      var i = parseInt(inViewGallery.dataset.index || '0', 10);
      if (e.key === 'ArrowLeft') { e.preventDefault(); inViewGallery._go(i - 1); }
      else if (e.key === 'ArrowRight') { e.preventDefault(); inViewGallery._go(i + 1); }
    });
  }

  // ============================================================
  // Per-card image parallax on featured projects
  // ============================================================
  function initCardParallax() {
    if (reduceMotion || isTouch) return;
    document.querySelectorAll('.featured-item--project').forEach(function (card) {
      var img = card.querySelector('.fi-media img');
      if (!img) return;
      card.addEventListener('mousemove', function (e) {
        var r = card.getBoundingClientRect();
        var dx = (e.clientX - r.left - r.width / 2) / r.width;
        var dy = (e.clientY - r.top - r.height / 2) / r.height;
        img.style.transform = 'translate3d(' + (dx * 10) + 'px,' + (dy * 10) + 'px,0) scale(1.05)';
      });
      card.addEventListener('mouseleave', function () { img.style.transform = ''; });
    });
  }

  // ============================================================
  // Bootstrap
  // ============================================================
  document.addEventListener('DOMContentLoaded', function () {
    injectAtmosphere();
    initScrollProgress();
    initBackToTop();
    initLightbox();
    initNavbarScroll();
    initScrollReveal();
    initMagneticButtons();
    initGlitch();
    initParallax();
    initHeroScroll();
    initHeroAurora();
    initGalleries();
    augmentMarkdownImages();
    initCardParallax();
  });

})();
