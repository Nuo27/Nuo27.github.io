/**
 * smooth-scroll.js — premium inertia for the document scroll.
 *
 * Goal: remove the harsh stop-and-go of native scrolling without making
 * the page feel like it floats or lags. Linear / Vercel / Apple register:
 * ~150ms catch-up, imperceptible on small movements, just enough inertia
 * on large scrolls to feel polished.
 *
 * Architecture (4 layers, one IIFE):
 *   · INPUT     native scroll is the only source of truth. Wheel, touchpad,
 *               keyboard, anchor links, focus scrolling, history nav — all
 *               untouched. We only listen, never preventDefault, never
 *               call window.scrollTo ourselves.
 *   · STATE     targetY (driven by native scrollY), renderY (the smoothed
 *               value the user sees), velocity (EMA px/sec).
 *   · RENDERER  one rAF loop. Frame-rate-independent damping
 *               k = 1 - exp(-rate·dt). Dead-zone snap ends the asymptotic
 *               sub-pixel chase and stops the loop at rest.
 *   · LIFECYCLE ResizeObserver keeps body height === wrapper.scrollHeight
 *               (the wrapper is position:fixed, so the document scroll
 *               length has to be re-created on body). pageshow + popstate
 *               snap renderY for bfcache / history restore.
 *
 * DOM contract:
 *   · _layouts/default.html wraps navbar + <main id="app"> + footer in
 *     <div id="smooth-scroll">. assets/js/main.js mounts every fixed
 *     overlay (CRT, HUD, lightbox, hero-aurora) on document.body, so they
 *     stay siblings of the wrapper and are NOT transformed. #backToTop
 *     is rendered inside footer.html → hoisted out to body at init so its
 *     position:fixed stays viewport-fixed.
 *   · _sass/_base.scss adds html.smooth-scroll #smooth-scroll { position:fixed }
 *     only when this module activates the class. With the class absent
 *     (touch / reduced-motion), the wrapper stays in normal flow and the
 *     page scrolls 100% natively.
 *
 * Public API (always available, even when smoothing is gated off — in
 * pass-through mode renderY tracks scrollY directly so consumers see one
 * uniform contract):
 *   window.__smoothScroll.getPosition()  px, fractional render Y
 *   window.__smoothScroll.getVelocity()  px/sec, EMA-smoothed
 *   window.__smoothScroll.getTarget()    px, native scrollY (the target)
 *   window.__smoothScroll.subscribe(cb)  cb({pos, vel, target}) per frame,
 *                                        returns an unsubscribe fn
 *   window.__smoothScroll.snapTo(y)      force renderY = targetY = y
 *   window.__smoothScroll.isSmooth()     bool — gate passed & active
 */

(function () {
  'use strict';

  // ============================================================
  // CONFIG
  // ============================================================
  var cfg = {
    rate: 20,         // per-second damping k = 1 - exp(-rate·dt); 95% in ~150ms, 99% in ~230ms
    threshold: 0.25,  // px — below this gap, snap to target & stop the loop
    idleMs: 90,       // keep the loop warm between successive inputs (avoids cold-restart stutter)
    velRate: 8,       // per-second EMA on velocity (~125ms τ) — stable signal for parallax consumers
    dtMax: 0.1        // sec — clamp dt so a tab-hidden jump doesn't spike the transform
  };

  // ============================================================
  // GATE — fine pointer + motion allowed. Touch / reduced-motion
  // keep 100% native scrolling. The public API is still exposed in
  // pass-through mode so consumer code is uniform across environments.
  // ============================================================
  var smooth = !window.matchMedia('(hover: none), (pointer: coarse)').matches &&
               !window.matchMedia('(prefers-reduced-motion: reduce)').matches &&
               typeof window.requestAnimationFrame === 'function' &&
               typeof window.ResizeObserver === 'function';

  var wrapper = document.getElementById('smooth-scroll');
  if (!wrapper) smooth = false;

  // ============================================================
  // DIAGNOSTICS — gated by window.__scrollDebug. Lets us reproduce
  // the "scroll becomes impossible" freeze in a real browser and
  // tell which of the hypotheses is firing. Toggle in DevTools:
  //   window.__scrollDebug = true
  // Logs are throttled so they don't drown the console.
  // ============================================================
  var DBG = !!(typeof window !== 'undefined' && window.__scrollDebug);
  function dlog(tag, payload) {
    if (!DBG) return;
    try { console.log('[scroll]', tag, payload, 't=' + Math.round(performance.now())); }
    catch (e) {}
  }
  var lastWakeLog = 0, lastTickLog = 0, lastScrollLog = 0;
  function dbgWake() {
    var now = performance.now();
    if (now - lastWakeLog < 250) return;
    lastWakeLog = now;
    dlog('wake', {
      y: window.scrollY,
      target: targetY,
      render: renderY,
      rafId: rafId,
      active: active,
      idleMsLeft: idleTimer ? Math.max(0, cfg.idleMs - (now - (idleTimer._started || now))) : 0,
      subCount: subs.length,
      bodyH: document.body.style.height,
      wrapperH: wrapper.scrollHeight,
      innerH: window.innerHeight,
      docH: document.documentElement.scrollHeight
    });
  }
  function dbgTick() {
    var now = performance.now();
    if (now - lastTickLog < 1000) return;
    lastTickLog = now;
    dlog('tick', { render: renderY, target: targetY, rafId: rafId, subCount: subs.length });
  }

  // ============================================================
  // STATE
  // ============================================================
  var targetY = window.scrollY || 0;
  var renderY = targetY;            // start at target — no first-frame jump
  var prevRenderY = renderY;
  var velocity = 0;                 // px/sec, EMA-smoothed
  var lastTs = 0;
  var rafId = null;
  var active = false;               // true within idleMs of last input
  var idleTimer = null;
  var subs = [];

  // ============================================================
  // LIFECYCLE — height sync, mount, bfcache
  // ============================================================

  // body has no flow content once the wrapper goes position:fixed
  // (every fixed overlay contributes 0 to flow height). We rebuild
  // the document scroll length by setting body.height to match the
  // wrapper's natural content height. ResizeObserver catches router
  // swaps, image loads, font swap, accordion expand.
  function syncHeight() {
    if (!smooth) return;
    var h = wrapper.scrollHeight;
    // Floor: if the wrapper's content is shorter than the viewport (a
    // short page after router swap, or content still loading), keep
    // body at viewport height so maxScroll never collapses to 0. The
    // wrapper itself stays at its natural height — we just preserve
    // the document scroll range so the user can always scroll.
    var floor = window.innerHeight;
    var out = h;
    if (h <= 0 || h < floor) out = floor;
    document.body.style.setProperty('height', out + 'px', 'important');
    dlog('syncHeight', { wrapperH: h, bodyH: out, innerH: floor, docH: document.documentElement.scrollHeight });
  }

  // Hoist #backToTop (and any other viewport-fixed descendants of the
  // wrapper) to body so a transformed ancestor doesn't drag them.
  // CRT / HUD / lightbox / hero-aurora are already body children.
  function hoistFixed() {
    if (!wrapper) return;
    var fixed = wrapper.querySelectorAll('#backToTop');
    for (var i = 0; i < fixed.length; i++) {
      document.body.appendChild(fixed[i]);
    }
  }

  function activate() {
    if (!smooth) return;
    hoistFixed();
    syncHeight();
    // Adding the class last means the CSS rule (position:fixed) only
    // applies once body has its height — no flash of "fixed wrapper,
    // zero-height body, can't scroll".
    document.documentElement.classList.add('smooth-scroll');
  }

  // ============================================================
  // RENDERER — pure state → transform. Knows nothing about page content.
  // ============================================================
  function apply() {
    // H4 guard: clamp renderY to the current document scroll range so
    // the wrapper can never translate past the end of the page (which
    // would leave the viewport showing a blank band and break the
    // perceived link between wheel input and visible motion). Recompute
    // maxScroll every frame — body.height changes on router swap.
    var maxScroll = Math.max(0, (document.documentElement.scrollHeight || 0) - window.innerHeight);
    var clamped = renderY;
    if (clamped < 0) clamped = 0;
    else if (clamped > maxScroll) clamped = maxScroll;
    if (clamped !== renderY) renderY = clamped;
    wrapper.style.transform = 'translate3d(0,' + (-renderY) + 'px,0)';
  }

  function tick(now) {
    dbgTick();
    // dt in seconds, clamped so a long pause (tab hidden) doesn't
    // produce one enormous k that snaps us past the target.
    var dt = lastTs ? (now - lastTs) / 1000 : 0;
    if (dt > cfg.dtMax) dt = cfg.dtMax;
    lastTs = now;

    var diff = targetY - renderY;

    // Decide continuation and update rafId BEFORE the risky render /
    // subscriber fan-out. If apply() or notify() throws, the chain is
    // already either re-queued or correctly null — wake() can always
    // restart it, so the loop can never strand a stale id and lock.
    if (Math.abs(diff) < cfg.threshold && !active) {
      // Settled: gap below threshold AND no recent input. Snap to exact
      // target (stable transform string, ends the sub-pixel chase) and
      // stop the loop. wake() restarts on the next input.
      renderY = targetY;
      velocity = 0;
      prevRenderY = renderY;
      rafId = null;
    } else {
      // Frame-rate-independent critically-damped smoothing. Identical
      // feel at 60Hz and 120Hz — the exponential doesn't care about
      // refresh rate, only elapsed time.
      var k = 1 - Math.exp(-cfg.rate * dt);
      renderY += diff * k;

      // EMA-smoothed velocity so consumers (parallax, hero scale) read
      // a stable signal instead of raw per-frame deltas.
      var inst = dt > 0 ? (renderY - prevRenderY) / dt : 0;
      var vk = 1 - Math.exp(-cfg.velRate * dt);
      velocity = velocity + (inst - velocity) * vk;
      prevRenderY = renderY;

      rafId = window.requestAnimationFrame(tick);
    }

    apply();
    notify();
  }

  function notify() {
    if (!subs.length) return;
    for (var i = 0; i < subs.length; i++) {
      // Isolate subscribers: one throwing callback must not abort the
      // others or kill the rAF render loop.
      try { subs[i]({ pos: renderY, vel: velocity, target: targetY }); }
      catch (e) {}
    }
  }

  // ============================================================
  // INPUT — wake the loop on any user-driven scroll. Passive only.
  // ============================================================
  function wake() {
    targetY = window.scrollY || 0;
    active = true;
    if (idleTimer) clearTimeout(idleTimer);
    idleTimer = setTimeout(function () { active = false; }, cfg.idleMs);
    dbgWake();
    if (rafId === null) {
      lastTs = 0;       // let tick re-base dt on its first frame
      rafId = window.requestAnimationFrame(tick);
    }
  }

  // In pass-through mode (smoothing gated off), still keep targetY
  // tracking native scroll and notify subscribers so consumer code
  // sees the same API contract (renderY === targetY === scrollY).
  function passthroughNotify() {
    targetY = window.scrollY || 0;
    renderY = targetY;
    velocity = 0;
    notify();
  }

  // ============================================================
  // PUBLIC API
  // ============================================================
  var api = {
    getPosition: function () { return renderY; },
    getVelocity: function () { return velocity; },
    getTarget:   function () { return targetY; },
    isSmooth:    function () { return smooth; },
    snapTo: function (y) {
      targetY = (typeof y === 'number') ? y : (window.scrollY || 0);
      renderY = targetY;
      prevRenderY = renderY;
      velocity = 0;
      if (smooth) apply();
      notify();
    },
    subscribe: function (cb) {
      if (typeof cb !== 'function') return function () {};
      subs.push(cb);
      // Seed the subscriber with the current state immediately so
      // consumers don't read stale values on their first paint.
      cb({ pos: renderY, vel: velocity, target: targetY });
      return function () {
        var i = subs.indexOf(cb);
        if (i >= 0) subs.splice(i, 1);
      };
    }
  };

  window.__smoothScroll = api;

  // Diagnostics: native scroll event sampler + uncaught error capture.
  // Both gated by window.__scrollDebug; passive so we never block.
  if (DBG) {
    window.addEventListener('scroll', function () {
      var now = performance.now();
      if (now - lastScrollLog < 250) return;
      lastScrollLog = now;
      dlog('nativeScroll', {
        y: window.scrollY,
        docH: document.documentElement.scrollHeight,
        innerH: window.innerHeight,
        maxScroll: document.documentElement.scrollHeight - window.innerHeight
      });
    }, { passive: true });
    window.addEventListener('error', function (e) {
      dlog('error', { msg: e.message, src: e.filename + ':' + e.lineno });
    });
    window.addEventListener('unhandledrejection', function (e) {
      dlog('unhandledrejection', { reason: String(e.reason && e.reason.message || e.reason) });
    });
  }

  // ============================================================
  // WIRE UP
  // ============================================================
  if (smooth) {
    activate();

    // Input — passive, never intercept.
    window.addEventListener('scroll', wake, { passive: true });
    window.addEventListener('wheel', wake, { passive: true });
    window.addEventListener('touchmove', wake, { passive: true });
    window.addEventListener('keydown', function (e) {
      // Movement keys only. Let everything else (forms, shortcuts) bubble.
      switch (e.keyCode) {
        case 32: case 33: case 34: case 35: case 36:
        case 37: case 38: case 39: case 40: wake(); break;
      }
    }, { passive: true });

    // Lifecycle — keep body height synced to the wrapper's content.
    // Catches router swaps, image loads, font swap, accordions.
    if (window.ResizeObserver) {
      var ro = new ResizeObserver(function () { syncHeight(); });
      ro.observe(wrapper);
      // Also watch html font-size / scrollbar-gutter changes that
      // shift the viewport without resizing the wrapper itself.
      window.addEventListener('resize', syncHeight, { passive: true });
    }

    // bfcache restore — Firefox/Safari restore the old render tree
    // on back/forward. Snap renderY to current scrollY so the wrapper
    // doesn't carry a stale transform into the restored page.
    window.addEventListener('pageshow', function (e) {
      if (e.persisted) api.snapTo(window.scrollY || 0);
    });

    // Start at rest, but apply once so the initial transform matches
    // any non-zero scrollY (e.g. refresh mid-page).
    apply();
  } else {
    // Pass-through: still track scroll so the public API works on
    // touch / reduced-motion. rAF-throttled to one notify per frame.
    var ptScheduled = false;
    window.addEventListener('scroll', function () {
      if (ptScheduled) return;
      ptScheduled = true;
      window.requestAnimationFrame(function () { ptScheduled = false; passthroughNotify(); });
    }, { passive: true });
    window.addEventListener('pageshow', function (e) {
      if (e.persisted) passthroughNotify();
    });
  }
})();
