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
  // VIEWPORT-POSITION HOVER
  //
  // The hovered element is whatever is currently under the cursor in
  // the viewport. There is exactly ONE source of truth: a continuous
  // rAF loop that runs elementsFromPoint every frame, against the
  // cursor's last-known viewport coords (updated by mousemove).
  //
  // Why this shape — not event listeners on scroll / pointermove /
  // wheel / smooth-scroll.subscribe:
  //
  //   · smooth-scroll translates the wrapper via CSS transform. The
  //     document does NOT actually scroll (window.scrollY never
  //     changes), so a 'scroll' listener on window never fires
  //     during the user's own scrolling input. Subscribing to
  //     smooth-scroll's tick also has gaps: it only ticks while
  //     smooth=true AND the loop is awake AND the diff is above
  //     threshold. Any of those fail-closed conditions would freeze
  //     hover.
  //   · Native pointer / scroll / focus events tell us when the
  //     INPUT happened, not what's under the cursor right now.
  //     That's the wrong question.
  //
  // elementsFromPoint, on the other hand, asks exactly the right
  // question ("what's at viewport (x,y) at this moment?") and it
  // forces a synchronous layout that reflects the post-transform
  // visual position — so smooth-scroll's translate3d, BFCache
  // restore, router swaps, focus-induced scrolls, and the rest are
  // all handled correctly without us having to subscribe to any of
  // them. One loop, one hit-test, one state.
  //
  // Steady-state cost: one elementsFromPoint per frame (~0.02 ms
  // for a normal page). The diff against the previous result skips
  // state propagation on idle frames.
  // ============================================================

  var HOVER_SEL = 'a,button,label[for],.nav-link,.social,.skill-tag,input,textarea,[data-cursor="hover"],[contenteditable]';
  var ZOOM_SEL  = '.gallery-slide,[data-lightbox],.featured-item--project img,[data-cursor="zoom"]';
  var PULSE_SEL = 'a,button,[role="button"],.btn-primary-custom,.btn-secondary-custom,.btn-project,[data-magnetic]';
  var DRAG_SEL  = '.gallery-stage,[data-cursor="drag"]';

  var hoverState = {
    cursorX: -1,
    cursorY: -1,
    hover: null,
    zoom: null,
    pulse: null,
    down: false,
    prevHover: null,
  };

  // Exposed for diagnostics — window.__hoverState in DevTools.
  window.__hoverState = hoverState;

  function resolveHover(x, y) {
    var hover = null, zoom = null, pulse = null;
    if (x < 0 || y < 0 || typeof document.elementsFromPoint !== 'function') {
      return { hover: hover, zoom: zoom, pulse: pulse };
    }
    var stack;
    try {
      stack = document.elementsFromPoint(x, y);
    } catch (e) {
      return { hover: hover, zoom: zoom, pulse: pulse };
    }
    // Walk from the topmost element down. The cursor overlay
    // (position:fixed, z-index 10003, pointer-events:none) sits at
    // the top of the stack at this exact point, but it has no
    // HOVER/ZOOM/PULSE ancestor — closest() returns null and we
    // skip it. The real interactive is the next element down.
    for (var i = 0; i < stack.length; i++) {
      var el = stack[i];
      if (!el || el === document.documentElement || el === document.body) break;
      if (typeof el.closest !== 'function') continue;
      if (!hover) { var h = el.closest(HOVER_SEL); if (h) hover = h; }
      if (!zoom)  { var z = el.closest(ZOOM_SEL);  if (z) zoom  = z; }
      if (!pulse) { var p = el.closest(PULSE_SEL); if (p) pulse = p; }
      if (hover && zoom && pulse) break;
    }
    return { hover: hover, zoom: zoom, pulse: pulse };
  }

  // ---- Border-trace helpers -------------------------------------
  // The trace pseudo-element is owned by CSS (_mixins.scss ::before).
  // JS only sets the entry angle and animates --trace-spread from
  // 0deg → 180deg via the Web Animations API; CSS handles the paint,
  // which is masked to the 1px border ring (no card content overpaint).
  function cancelTrace(card) {
    if (!card) return;
    if (card.__traceAnim) {
      try { card.__traceAnim.cancel(); } catch (e) {}
      card.__traceAnim = null;
    }
    // Restore defaults; pseudo's opacity transition handles the fade-out.
    card.style.removeProperty('--trace-spread');
    card.style.removeProperty('--trace-entry');
  }

  function fireTrace(card, angleDeg) {
    if (!card) return;
    card.style.setProperty('--trace-entry', angleDeg + 'deg');
    card.style.setProperty('--trace-spread', '0deg');
    // Sync reflow: paint the 0deg state before the WAAPI animation
    // interpolates, so the spread grows from a real pinpoint instead
    // of interpolating from 'unset'.
    void card.offsetWidth;
    var anim;
    try {
      anim = card.animate(
        [
          { '--trace-spread': '0deg' },
          { '--trace-spread': '180deg' }
        ],
        { duration: 850, easing: 'cubic-bezier(0.16, 1, 0.3, 1)', fill: 'forwards' }
      );
    } catch (e) {
      card.style.setProperty('--trace-spread', '180deg');
      return;
    }
    card.__traceAnim = anim;
    anim.onfinish = function () { card.__traceAnim = null; };
  }

  function computeEntryAngle(card, x, y) {
    var r = card.getBoundingClientRect();
    var cx = r.left + r.width / 2;
    var cy = r.top + r.height / 2;
    var ang = Math.atan2(y - cy, x - cx) * 180 / Math.PI;
    if (ang < 0) ang += 360;
    return ang;
  }

  function applyHoverState() {
    var s = hoverState;
    var drag = !!(s.down && s.hover && typeof s.hover.matches === 'function' && s.hover.matches(DRAG_SEL));

    // Drive the inline cursor (see _includes/head.html §5).
    if (window.__cursor && typeof window.__cursor.setStates === 'function') {
      window.__cursor.setStates({
        hover: !!s.hover,
        zoom:  !!s.zoom,
        pulse: !!s.pulse,
        drag:  drag,
        down:  s.down,
      });
    }

    // Border trace — fire on card hover-enter, cancel on leave.
    var newCard = (s.hover && typeof s.hover.closest === 'function')
      ? s.hover.closest('.project.card, .featured-item')
      : null;
    var prevCard = (s.prevHover && typeof s.prevHover.closest === 'function')
      ? s.prevHover.closest('.project.card, .featured-item')
      : null;

    if (newCard !== prevCard) {
      cancelTrace(prevCard);
      if (newCard) {
        fireTrace(newCard, computeEntryAngle(newCard, s.cursorX, s.cursorY));
      }
    }
    s.prevHover = s.hover;
  }

  // ---- THE single source of truth: one continuous rAF loop ----
  // Every frame: ask elementsFromPoint what's at (cursorX, cursorY),
  // diff against the previous result, propagate on change. The
  // browser's hit-test automatically reflects every transform /
  // scroll / route swap / animation; we don't subscribe to any of
  // them.
  (function hoverLoop() {
    requestAnimationFrame(hoverLoop);
    if (document.hidden) return;
    var cx = hoverState.cursorX, cy = hoverState.cursorY;
    if (cx < 0 || cy < 0) return;
    var r = resolveHover(cx, cy);
    if (r.hover === hoverState.hover &&
        r.zoom  === hoverState.zoom  &&
        r.pulse === hoverState.pulse) return;
    hoverState.hover = r.hover;
    hoverState.zoom  = r.zoom;
    hoverState.pulse = r.pulse;
    applyHoverState();
  })();

  // Track cursor position. The loop above already keeps hover
  // state current from these coords; no scroll/smooth-scroll
  // subscribers needed.
  window.addEventListener('mousemove', function (e) {
    hoverState.cursorX = e.clientX;
    hoverState.cursorY = e.clientY;
  }, { passive: true });
  window.addEventListener('pointermove', function (e) {
    if (e.pointerType === 'mouse') {
      hoverState.cursorX = e.clientX;
      hoverState.cursorY = e.clientY;
    }
  }, { passive: true });

  // Pointer-down / up flip the cursor's transient `is-down` state.
  function pressStart() { hoverState.down = true; applyHoverState(); }
  function pressEnd()   {
    if (!hoverState.down) return;
    hoverState.down = false;
    applyHoverState();
  }
  window.addEventListener('pointerdown', pressStart);
  window.addEventListener('pointerup', pressEnd);
  window.addEventListener('pointercancel', pressEnd);

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

  // Adds data-reveal to .project-body / .article-body > * with a staggered delay.
  // Reuses the site-wide reveal observer; no new IntersectionObserver.
  function initProjectBodyReveal(scope) {
    var body = scope.querySelector && scope.querySelector('.project-body, .article-body');
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

  // Premium re-entrance: stagger visible cards in (rise + scale + de-blur)
  // when a filter or visibility toggler is applied. Skips opacity so it
  // doesn't fight the scroll-reveal observer.
  function staggerIn(els) {
    Array.prototype.slice.call(els).forEach(function (el, i) {
      el.classList.remove('card-in');
      void el.offsetWidth; // restart the keyframe animation
      el.style.setProperty('--card-in-delay', ((i % 12) * 35) + 'ms');
      el.classList.add('card-in');
    });
  }

  // Outro: play a deactivation animation on a chip/toggler as it loses
  // .is-active. Mirrors the intro (shine + pop) so apply/un-apply feel
  // symmetric. Class is cleared after the longest keyframe finishes.
  function outro(el) {
    if (!el || el.classList.contains('is-outro')) return;
    el.classList.remove('is-outro');
    void el.offsetWidth;
    el.classList.add('is-outro');
    setTimeout(function () { el.classList.remove('is-outro'); }, 700);
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
      // Relocate the empty-state line to just above the grid (below the filter
      // divider) so it reads as a grid status, not part of the search bar.
      if (empty && empty.parentNode !== listEl.parentNode) {
        listEl.parentNode.insertBefore(empty, listEl);
      }
      var items = Array.prototype.slice.call(listEl.querySelectorAll(itemSel));

      function open() { bar.classList.add('active'); setTimeout(function () { input.focus(); }, 150); }
      function close() {
        input.value = '';
        bar.classList.remove('active');
        run();
      }
      function run() {
        var q = input.value.toLowerCase().trim();
        var cat = listEl.dataset.activeCat || 'all';
        var visible = 0, effectiveTotal = 0;
        items.forEach(function (el) {
          // Visibility gate: hidden-by-default cards (e.g. student work)
          // only count/show when a toggler has added .unhidden to them.
          var isHidden = el.getAttribute('data-visibility') === 'hidden';
          var visOk = !isHidden || el.classList.contains('unhidden');
          if (visOk) effectiveTotal++;
          var textMatch = q === '' || el.textContent.toLowerCase().indexOf(q) !== -1;
          var catMatch = cat === 'all' || el.getAttribute('data-category') === cat;
          var match = textMatch && catMatch && visOk;
          el.style.display = match ? '' : 'none';
          if (match) visible++;
        });
        if (q === '' && cat === 'all') {
          if (countEl) countEl.textContent = effectiveTotal + ' entries';
          listEl.style.display = '';
          if (empty) empty.style.display = 'none';
        } else {
          if (countEl) countEl.textContent = visible + '/' + effectiveTotal;
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
          chips.forEach(function (c) {
            if (c.classList.contains('is-active')) outro(c);
            c.classList.remove('is-active');
          });
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
          staggerIn(Array.prototype.slice.call(listEl.querySelectorAll(itemSel))
            .filter(function (el) { return el.style.display !== 'none'; }));
        });
      });
    });
  }

  // Reveals cards hidden by default, one toggler per hidden key (tag/category).
  // Togglers sharing the same grid track a space-separated list of revealed
  // keys on the grid. A hidden card flips to .unhidden when ANY of its
  // data-hidden-keys is toggled on. The terminal search re-runs afterwards so
  // counts stay accurate.
  function initVisibilityToggle(scope) {
    var groups = {};
    scope.querySelectorAll('[data-visibility-toggle]').forEach(function (btn) {
      var sel = btn.getAttribute('data-target');
      (groups[sel] = groups[sel] || []).push(btn);
    });
    Object.keys(groups).forEach(function (sel) {
      var listEl = document.querySelector(sel);
      if (!listEl) return;
      var btns = groups[sel];
      var searchInput = document.querySelector('[data-terminal-search][data-search-list="' + sel + '"] .search-input');

      function revealed() {
        return (listEl.getAttribute('data-revealed-keys') || '').split(/\s+/).filter(Boolean);
      }
      function apply() {
        var keys = revealed();
        var newlyShown = [];
        listEl.querySelectorAll('[data-visibility="hidden"]').forEach(function (el) {
          var cardKeys = (el.getAttribute('data-hidden-keys') || '').split(/\s+/).filter(Boolean);
          var on = cardKeys.length > 0 && cardKeys.some(function (k) { return keys.indexOf(k) !== -1; });
          var wasOn = el.classList.contains('unhidden');
          el.classList.toggle('unhidden', on);
          // scroll-reveal skipped these while collapsed — show them now.
          if (on) el.classList.add('visible', 'is-visible');
          if (on && !wasOn) newlyShown.push(el);
        });
        if (newlyShown.length) staggerIn(newlyShown);
        if (searchInput) searchInput.dispatchEvent(new Event('input', { bubbles: true }));
      }

      btns.forEach(function (btn) {
        var key = btn.getAttribute('data-reveal-key');
        // Chip label is static (tag name + count, set server-side); only the
        // active state flips — same paradigm as the category filter chips.
        function setActive(on) {
          btn.setAttribute('aria-pressed', on ? 'true' : 'false');
          btn.classList.toggle('is-active', on);
        }
        setActive(revealed().indexOf(key) !== -1);
        btn.addEventListener('click', function () {
          var keys = revealed();
          var i = keys.indexOf(key);
          var turningOn = i === -1;
          if (!turningOn) outro(btn);
          if (turningOn) keys.push(key); else keys.splice(i, 1);
          listEl.setAttribute('data-revealed-keys', keys.join(' '));
          setActive(turningOn);
          apply();
        });
      });
    });
  }
  // Apply a ?tag= filter on arrival: pre-fills the terminal search with the
  // tag name (grid filters by text) and, if that tag is a hidden key, flips
  // its reveal toggle so the hidden cards become searchable too.
  function initTagFilter(scope) {
    var tag;
    try { tag = new URLSearchParams(window.location.search).get('tag'); } catch (err) { return; }
    if (!tag) return;
    var searchScope = scope.querySelector('[data-terminal-search]');
    if (!searchScope) return;
    var input = searchScope.querySelector('.search-input');
    if (!input) return;
    input.value = tag;
    var bar = searchScope.querySelector('.search-bar');
    if (bar) bar.classList.add('active');
    // Reveal the matching hidden-key toggle (portfolio), if any.
    var slug = tag.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    var toggle = scope.querySelector('[data-visibility-toggle][data-reveal-key="' + slug + '"]');
    if (toggle && toggle.getAttribute('aria-pressed') !== 'true') toggle.click();
    input.dispatchEvent(new Event('input', { bubbles: true }));
    try { input.focus(); } catch (e) {}
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
    initVisibilityToggle(scope);
    initTagFilter(scope);
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