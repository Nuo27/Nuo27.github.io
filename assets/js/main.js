/**
 * main.js — Nuo.Dev frontend
 * Vanilla JS. Pairs with assets/js/router.js for client-side navigation.
 * Respects prefers-reduced-motion.
 *
 * Architecture:
 *   · Run-once initializers (atmosphere, scroll bar, lightbox, …) bind
 *     to persistent shell DOM and execute exactly once for the tab.
 *   · Per-navigation initializers (reveal, galleries, search, …) accept
 *     a `scope` (the new <main id="app">) and re-run after every router
 *     swap. IntersectionObservers are tracked on the scope so the router
 *     can disconnect them before replacing the node.
 */

(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var isTouch = window.matchMedia('(hover: none), (pointer: coarse)').matches;

  // ============================================================
  // Scope-aware observer tracker — router disconnects these
  // before swapping the scope out, so IOs don't leak.
  // ============================================================
  function trackObserver(scope, observer) {
    if (!scope.__observers) scope.__observers = [];
    scope.__observers.push(observer);
    return observer;
  }

  // ============================================================
  // Run-once guard
  // ============================================================
  var ran = {};
  function runOnce(key, fn) {
    if (ran[key]) return;
    ran[key] = true;
    fn();
  }

  // ============================================================
  // RUN-ONCE INITIALIZERS — bind to the persistent shell
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

  function initScrollProgress() {
    var progressBar = document.createElement('div');
    progressBar.className = 'scroll-progress';
    document.body.prepend(progressBar);
    function update(pos) {
      var docHeight = document.documentElement.scrollHeight - window.innerHeight;
      var progress = docHeight > 0 ? (pos / docHeight) * 100 : 0;
      progressBar.style.transform = 'scaleX(' + (progress / 100) + ')';
    }
    // Driven by the smooth-scroll render position so the bar tracks what
    // the user actually sees, not the raw native scrollY (which is ahead
    // of the wrapper during the LERP catch-up).
    window.addEventListener('resize', function () { update(window.__smoothScroll.getPosition()); }, { passive: true });
    window.__smoothScroll.subscribe(function (s) { update(s.pos); });
  }

  function initBackToTop() {
    var btn = document.getElementById('backToTop');
    if (!btn) return;
    window.__smoothScroll.subscribe(function (s) {
      btn.classList.toggle('visible', s.pos > 500);
    });
    btn.addEventListener('click', function () {
      // When smooth-scroll is active, jump native scrollY to 0 instantly
      // and let the wrapper LERP — avoids browser-easing on top of our
      // own. In pass-through mode (touch / reduced-motion), keep the
      // original behavior.
      var smooth = window.__smoothScroll && window.__smoothScroll.isSmooth();
      if (smooth) window.scrollTo(0, 0);
      else window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
    });
  }

  function initNavbarScroll() {
    var navbar = document.querySelector('.navbar-themed');
    if (!navbar) return;
    // .navbar-themed lives on the persistent shell — never swapped by the
    // router — so no isConnected guard needed.
    window.__smoothScroll.subscribe(function (s) {
      navbar.classList.toggle('scrolled', s.pos > 50);
    });
  }

  // ============================================================
  // Lightbox — overlay mounted once, content discovered via
  // delegation so it picks up images swapped in by the router.
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

  // Global "/" handler — opens the first terminal-search scope on the page.
  function bindTerminalSearchKey() {
    function inField(el) {
      if (!el) return false;
      return el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' ||
             el.tagName === 'SELECT' || el.isContentEditable;
    }
    document.addEventListener('keydown', function (e) {
      if (e.key !== '/' || e.ctrlKey || e.metaKey || e.altKey) return;
      if (inField(document.activeElement)) return;
      if (document.querySelector('.lightbox.open')) return;
      e.preventDefault();
      var scopes = document.querySelectorAll('[data-terminal-search]');
      for (var i = 0; i < scopes.length; i++) {
        if (scopes[i]._open) { scopes[i]._open(); break; }
      }
    });
  }

  // Global click handler — captures [data-scroll-to] targets into
  // sessionStorage so the destination page can smooth-scroll to them.
  function bindGuidedScrollClick() {
    document.addEventListener('click', function (e) {
      var a = e.target.closest && e.target.closest('[data-scroll-to]');
      if (!a) return;
      try { sessionStorage.setItem('guidedScroll', a.getAttribute('data-scroll-to')); }
      catch (err) {}
    });
  }

  // ============================================================
  // PER-NAVIGATION INITIALIZERS — run on every <main> swap
  // ============================================================

  // ============================================================
  // Project-page hero kicker typewriter + title word split.
  // Idempotent across PJAX swaps via data markers and isConnected
  // checks on every tick. Reduced motion bypasses all wrapping.
  // ============================================================
  function splitHeroTitle(title) {
    if (!title || title.dataset.split === '1' || reduceMotion) return;
    if (title.querySelector('.hero-w')) { title.dataset.split = '1'; return; }
    var src = title.textContent;
    if (!src) return;
    title.textContent = '';
    var wordIdx = 0;
    src.split(/(\s+)/).forEach(function (part) {
      if (!part) return;
      if (/^\s+$/.test(part)) {
        title.appendChild(document.createTextNode(part));
        return;
      }
      var wrap = document.createElement('span');
      wrap.className = 'hero-w';
      var inner = document.createElement('span');
      inner.className = 'hero-w-i';
      inner.style.setProperty('--word-i', String(wordIdx++));
      inner.textContent = part;
      wrap.appendChild(inner);
      title.appendChild(wrap);
    });
    title.classList.add('is-ready');
    title.dataset.split = '1';
  }

  function typeHeroKicker(kicker) {
    if (!kicker || kicker.dataset.typed === 'done') return;
    if (kicker.dataset.typed === '1') return; // already running
    if (reduceMotion) {
      kicker.dataset.typed = 'done';
      return;
    }
    var textEl = kicker.querySelector('.kicker-text');
    if (!textEl || textEl.dataset.typer === '1') return;
    textEl.dataset.typer = '1';
    var full = textEl.textContent;
    textEl.textContent = '';

    var typer = document.createElement('span');
    typer.className = 'typer';
    var caret = document.createElement('span');
    caret.className = 'typer-caret';
    caret.setAttribute('aria-hidden', 'true');
    caret.textContent = '_';

    kicker.appendChild(typer);
    kicker.appendChild(caret);

    var i = 0;
    function tick() {
      if (!kicker.isConnected || !textEl.isConnected) return;
      if (i >= full.length) {
        kicker.dataset.typed = 'done';
        caret.classList.add('is-done');
        return;
      }
      typer.appendChild(document.createTextNode(full.charAt(i++)));
      kicker._typerTimer = setTimeout(tick, 28);
    }
    kicker.dataset.typed = '1';
    kicker._typerTimer = setTimeout(tick, 28);
  }

  function initProjectHero(scope) {
    if (!scope.querySelector || !scope.querySelector('.project-detail')) return;
    var kicker = scope.querySelector('.hero-kicker');
    if (kicker) typeHeroKicker(kicker);
    scope.querySelectorAll('.hero-title').forEach(splitHeroTitle);
  }

  // Adds data-reveal to .project-body > * with a staggered delay.
  // Reuses the site-wide reveal observer; no new IntersectionObserver.
  function initProjectBodyReveal(scope) {
    var body = scope.querySelector && scope.querySelector('.project-body');
    if (!body) return;
    var kids = Array.prototype.slice.call(body.children);
    kids.forEach(function (el, i) {
      if (el.dataset.revealReady === '1') return;
      el.dataset.revealReady = '1';
      el.setAttribute('data-reveal', '');
      el.style.setProperty('--reveal-delay', ((i % 6) * 60) + 'ms');
    });
  }

  function initScrollReveal(scope) {
    var targets = scope.querySelectorAll('.reveal, .reveal-left, .reveal-right, [data-reveal]');
    if (!targets.length) return;
    document.body.classList.add('js-reveal-ready');

    if (reduceMotion || !('IntersectionObserver' in window)) {
      targets.forEach(function (el) { el.classList.add('visible', 'is-visible'); });
      return;
    }
    var observer = trackObserver(scope, new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        var el = entry.target;
        if (entry.isIntersecting) el.classList.add('visible', 'is-visible');
        else el.classList.remove('visible', 'is-visible');
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }));
    targets.forEach(function (el) { observer.observe(el); });
  }

  // Random work stream — reveal `count` random candidates per pool, per load.
  // Candidates are server-rendered hidden (.rw-item[hidden]); we unhide a
  // random subset, fix their index numbering, and re-apply side alternation.
  // Runs before initScrollReveal so the unhidden items get observed for reveal.
  function initRandomWork(scope) {
    scope.querySelectorAll('[data-random-work]').forEach(function (container) {
      var pool = Array.prototype.slice.call(container.querySelectorAll('.rw-item'));
      if (pool.length <= 1) {
        pool.forEach(function (el) { el.removeAttribute('hidden'); });
        return;
      }
      var count = parseInt(container.getAttribute('data-count'), 10) || 3;
      if (count > pool.length) count = pool.length;
      // Fisher–Yates shuffle
      for (var i = pool.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var tmp = pool[i]; pool[i] = pool[j]; pool[j] = tmp;
      }
      pool.slice(0, count).forEach(function (el, i) {
        el.removeAttribute('hidden');
        if (el.classList.contains('featured-item--project')) {
          el.classList.remove('fi-side-left', 'fi-side-right');
          el.classList.add(i % 2 === 0 ? 'fi-side-left' : 'fi-side-right');
        }
        var idx = el.querySelector('.fi-index');
        if (idx) idx.textContent = String(i + 1).padStart(2, '0');
      });
    });
  }

  function initMagneticButtons(scope) {
    if (reduceMotion || isTouch) return;
    scope.querySelectorAll('.btn-primary-custom, .btn-secondary-custom, .btn-project, [data-magnetic]').forEach(function (btn) {
      btn.addEventListener('mousemove', function (e) {
        var rect = btn.getBoundingClientRect();
        var x = e.clientX - rect.left - rect.width / 2;
        var y = e.clientY - rect.top - rect.height / 2;
        btn.style.transform = 'translate(' + (x * 0.15) + 'px, ' + (y * 0.18) + 'px) translateY(-2px)';
      });
      btn.addEventListener('mouseleave', function () { btn.style.transform = ''; });
    });
  }

  function initGlitch(scope) {
    if (reduceMotion) return;
    var el = scope.querySelector('[data-glitch]');
    if (!el) return;
    function burst() {
      el.classList.add('glitching');
      setTimeout(function () { el.classList.remove('glitching'); }, 320);
      setTimeout(burst, 3500 + Math.random() * 4000);
    }
    setTimeout(burst, 2800);
  }

  // Cover-portrait parallax — binds once. After swap the captured
  // portrait becomes detached; subsequent home visits rebind to the
  // new element. Flag prevents duplicate listeners.
  var parallaxBound = false;
  function initParallax(scope) {
    if (parallaxBound) return;
    var portrait = scope.querySelector('.cover-portrait');
    if (!portrait) return;
    parallaxBound = true;
    window.addEventListener('mousemove', function (e) {
      var cx = (e.clientX / window.innerWidth - 0.5);
      var cy = (e.clientY / window.innerHeight - 0.5);
      portrait.style.transform = 'translate3d(' + (cx * -14) + 'px,' + (cy * -10) + 'px,0)';
    });
  }

  var heroScrollBound = false;
  function initHeroScroll(scope) {
    if (heroScrollBound) return;
    var hero = scope.querySelector('.landing-wrapper');
    if (!hero) return;
    heroScrollBound = true;
    var vh = window.innerHeight;
    function update(y) {
      // hero is a child of <main> (router-swapped). Bail once it's gone
      // so we don't keep writing to a detached node across navigations.
      if (!hero.isConnected) return;
      if (y >= vh) return;
      var pp = Math.min(y / vh, 1);
      hero.style.opacity = String(1 - pp * 0.55);
      hero.style.transform = 'scale(' + (1 - pp * 0.03) + ') translate3d(0,' + (y * 0.16) + 'px,0)';
    }
    // Subscribe to the smoothed render position so the hero scales in
    // lockstep with the wrapper transform instead of running ahead of it.
    window.addEventListener('resize', function () { vh = window.innerHeight; update(window.__smoothScroll.getPosition()); }, { passive: true });
    window.__smoothScroll.subscribe(function (s) { update(s.pos); });
  }

  function initHeroAurora(scope) {
    if (!scope.querySelector('.landing-wrapper')) return;
    if (document.querySelector('.hero-aurora')) return;
    var aurora = document.createElement('div');
    aurora.className = 'hero-aurora';
    document.body.appendChild(aurora);
  }

  function augmentMarkdownImages(scope) {
    scope.querySelectorAll('.markdown-body').forEach(function (body, bi) {
      body.querySelectorAll('img:not(.emoji)').forEach(function (img) {
        if (img.closest('.gallery')) return;
        if (img.hasAttribute('data-lightbox')) return;
        img.setAttribute('data-lightbox', '');
        img.setAttribute('data-lightbox-group', 'md-' + bi);
      });
    });
  }

  function initGalleries(scope) {
    var galleries = scope.querySelectorAll('.gallery');
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
        trackObserver(scope, new IntersectionObserver(function (entries) {
          entries.forEach(function (en) {
            if (en.isIntersecting) inViewGallery = gallery;
            else if (inViewGallery === gallery) inViewGallery = null;
          });
        }, { threshold: 0.6 })).observe(gallery);
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

  function initCardParallax(scope) {
    if (reduceMotion || isTouch) return;
    scope.querySelectorAll('.featured-item--project').forEach(function (card) {
      var img = card.querySelector('.fi-media img');
      if (!img) return;
      card.addEventListener('mousemove', function (e) {
        var r = card.getBoundingClientRect();
        var dx = (e.clientX - r.left - r.width / 2) / r.width;
        var dy = (e.clientY - r.top - r.height / 2) / r.height;
        img.style.transform = 'translate3d(' + (dx * 10) + 'px,' + (dy * 10) + 'px,0) scale(1.04)';
      });
      card.addEventListener('mouseleave', function () { img.style.transform = ''; });
    });
  }

  function initTerminalSearch(scope) {
    var scopes = scope.querySelectorAll('[data-terminal-search]');
    if (!scopes.length) return;

    function setup(s) {
      var bar = s.querySelector('.search-bar');
      var input = s.querySelector('.search-input');
      var toggle = s.querySelector('.search-toggle');
      var countEl = s.querySelector('[data-search-count]');
      var empty = s.querySelector('[data-search-empty]');
      var emptyQuery = s.querySelector('[data-search-empty-query]');
      var listEl = document.querySelector(s.getAttribute('data-search-list'));
      var itemSel = s.getAttribute('data-search-item') || '.article-entry';
      if (!bar || !input || !listEl) return;
      var items = Array.prototype.slice.call(listEl.querySelectorAll(itemSel));
      var total = items.length;

      function open() { bar.classList.add('active'); setTimeout(function () { input.focus(); }, 150); }
      function close() {
        input.value = '';
        bar.classList.remove('active');
        if (countEl) countEl.textContent = total + ' entries';
        listEl.style.display = '';
        if (empty) empty.style.display = 'none';
        items.forEach(function (el) { el.style.display = ''; });
      }
      function run() {
        var q = input.value.toLowerCase().trim();
        var cat = listEl.dataset.activeCat || 'all';
        var visible = 0;
        items.forEach(function (el) {
          var textMatch = q === '' || el.textContent.toLowerCase().indexOf(q) !== -1;
          var catMatch = cat === 'all' || el.getAttribute('data-category') === cat;
          var match = textMatch && catMatch;
          el.style.display = match ? '' : 'none';
          if (match) visible++;
        });
        if (q === '' && cat === 'all') {
          if (countEl) countEl.textContent = total + ' entries';
          listEl.style.display = '';
          if (empty) empty.style.display = 'none';
        } else {
          if (countEl) countEl.textContent = visible + '/' + total;
          listEl.style.display = visible > 0 ? '' : 'none';
          if (empty) empty.style.display = visible === 0 ? '' : 'none';
          if (emptyQuery) emptyQuery.textContent = input.value.trim();
        }
      }

      if (toggle) toggle.addEventListener('click', function () {
        bar.classList.contains('active') ? close() : open();
      });
      input.addEventListener('input', run);
      input.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') { close(); input.blur(); }
      });
      input.addEventListener('blur', function () {
        if (input.value.trim() === '') bar.classList.remove('active');
      });

      s._open = open;
    }

    scopes.forEach(setup);
  }

  // Category filter chips. Sets listEl.dataset.activeCat, then re-runs the
  // terminal search (now category-aware) when one exists; falls back to a
  // standalone hide/show otherwise.
  function initCategoryFilter(scope) {
    scope.querySelectorAll('[data-category-filter]').forEach(function (nav) {
      var listSel = nav.getAttribute('data-filter-list');
      var itemSel = nav.getAttribute('data-filter-item') || '.card-wrap';
      var listEl = listSel && document.querySelector(listSel);
      if (!listEl) return;
      var chips = Array.prototype.slice.call(nav.querySelectorAll('[data-cat]'));
      var searchInput = document.querySelector('[data-terminal-search][data-search-list="' + listSel + '"] .search-input');

      chips.forEach(function (chip) {
        chip.addEventListener('click', function () {
          if (chip.classList.contains('is-active')) return;
          chips.forEach(function (c) { c.classList.remove('is-active'); });
          chip.classList.add('is-active');
          listEl.dataset.activeCat = chip.getAttribute('data-cat');
          if (searchInput) {
            searchInput.dispatchEvent(new Event('input', { bubbles: true }));
          } else {
            var active = listEl.dataset.activeCat;
            Array.prototype.slice.call(listEl.querySelectorAll(itemSel)).forEach(function (el) {
              el.style.display = (active === 'all' || el.getAttribute('data-category') === active) ? '' : 'none';
            });
          }
        });
      });
    });
  }

  // Reads the guided-scroll target set by the previous page's
  // [data-scroll-to] click, then smooth-scrolls to it.
  function initGuidedScroll() {
    var target;
    try { target = sessionStorage.getItem('guidedScroll'); } catch (err) {}
    if (!target) return;
    try { sessionStorage.removeItem('guidedScroll'); } catch (err) {}
    var el = document.getElementById(target);
    if (!el) return;

    window.scrollTo(0, 0);
    if (window.__smoothScroll) window.__smoothScroll.snapTo(0);

    // When smooth-scroll is active, jump the native position instantly and
    // let the wrapper LERP to the target — avoids the browser's own easing
    // competing with ours. Otherwise fall back to the original native
    // scrollIntoView({behavior:'smooth'}) (or instant on reduced-motion).
    var smooth = !!(window.__smoothScroll && window.__smoothScroll.isSmooth());
    setTimeout(function () {
      el.scrollIntoView({ behavior: smooth ? 'auto' : (reduceMotion ? 'auto' : 'smooth'), block: 'start' });
    }, smooth ? 500 : (reduceMotion ? 0 : 500));
  }

  // ============================================================
  // initPageFeatures — public hook the router calls after each swap.
  // `scope` is the new <main id="app"> (or `document` on initial load).
  // ============================================================
  function initPageFeatures(scope) {
    scope = scope || document;

    // Run once (lifetime of tab)
    runOnce('atmosphere', injectAtmosphere);
    runOnce('scrollProgress', initScrollProgress);
    runOnce('backToTop', initBackToTop);
    runOnce('navbarScroll', initNavbarScroll);
    runOnce('lightbox', initLightbox);
    runOnce('terminalSearchKey', bindTerminalSearchKey);
    runOnce('guidedScrollClick', bindGuidedScrollClick);

    // Per navigation
    initHeroAurora(scope);
    initProjectHero(scope);
    initProjectBodyReveal(scope);
    initRandomWork(scope);
    initScrollReveal(scope);
    initMagneticButtons(scope);
    initGlitch(scope);
    initParallax(scope);
    initHeroScroll(scope);
    initGalleries(scope);
    augmentMarkdownImages(scope);
    initCardParallax(scope);
    initTerminalSearch(scope);
    initCategoryFilter(scope);
    initGuidedScroll();
  }

  window.__initPageFeatures = initPageFeatures;

  // Initial load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { initPageFeatures(document); });
  } else {
    initPageFeatures(document);
  }
})();