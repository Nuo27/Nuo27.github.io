---
layout: project
name: Phosphor
image: /assets/image/projects/phosphor-site.svg
description: Magazine-grade Jekyll personal-site template with a tactical-telemetry aesthetic - the open-source base behind this very portfolio.
category: Web
status: "2026"
tags: [Jekyll, Vanilla JS, Bootstrap, SCSS]
external_links:
  - { name: "Live Demo", url: "https://nuo27.github.io/phosphor-site/", icon: "external-link-alt" }
  - { name: "Source", url: "https://github.com/Nuo27/phosphor-site", icon: "github", prefix: "fab" }
---

**Phosphor** is a magazine-grade Jekyll personal-site template with a tactical-telemetry aesthetic - phosphor-green-on-void-dark HUD UI, CRT grain, scan lines, and an editorial grid. It is the open-source base this very portfolio is built on, extracted and generalized so anyone can fork it into a `<username>.github.io` site in a few config edits.

## Role

Solo Developer - design, frontend, and build pipeline

## Contributions

- Built a **PJAX soft router** that `fetch()`es the next page and uses `DOMParser` to swap only `<main>`, so the shell (custom cursor, navbar, footer, atmosphere layer) lives for the tab's lifetime instead of reloading per navigation. View Transitions API cross-fades the swap.
- Designed a **two-layer token system** - `_sass/_variables.scss` for compile-time constants and `_sass/_tokens.scss` for runtime CSS custom properties - with automatic light/dark theming driven by a `[data-theme]` attribute.
- Wrote the **custom cursor** (inverted triangle + blend-difference ring + aurora) with velocity-based tilt/scale/trail and scrollbar-drag tracking, auto-disabling on touch devices and under `prefers-reduced-motion`.
- Shipped the **animation stack**: WAAPI border-trace on cards, scroll-reveal via `IntersectionObserver`, typewriter, glitch burst, parallax, magnetic buttons, gallery/lightbox, and a random-work stream on the home page.
- Made every page **front-matter-driven**: content lives in YAML, and layouts compose sections through `{% raw %}{% if page.X %}{% endraw %}` guards - omit a key and that section simply doesn't render, so one layout serves many page shapes.
- Added the **SEO layer** (`sitemap.xml`, Atom feed at `/feed.xml`, Open Graph + Twitter cards, canonical URLs, `robots.txt`) plus an **optional Notion CMS** that syncs Notion databases to Markdown at build time.

## Technical Challenges

- **Keeping the shell alive across navigations.** A full page reload re-runs every script and annihilates cursor/atmosphere state. The PJAX router swaps only `<main>` and re-binds page-specific JS after each swap, so the cursor never flickers and transitions stay continuous. The tradeoff was re-initialization ordering - scripts that assumed a fresh DOM had to be gated on a "page changed" hook rather than a one-shot `DOMContentLoaded`.
- **Compile-time vs runtime tokens.** SASS variables can't change at runtime, and CSS custom properties can't drive `@media` logic at build time. Splitting into two layers (`_variables.scss` for the static palette/spacing math, `_tokens.scss` for theme-switchable custom properties) let the dark/light toggle flip a single `[data-theme]` attribute without a rebuild, while layout math still happened at compile time.
- **Motion that respects the user.** Every effect - the velocity-tracked cursor, the WAAPI border-trace, the scroll-reveal - checks `prefers-reduced-motion` and touch capability up front and degrades to a static page rather than animating. The cursor and parallax no-op entirely on touch, so mobile gets a clean, performant render.
- **One layout, many pages.** Driving sections from front matter via `{% raw %}{% if page.X %}{% endraw %}` guards means the same layout file powers a full about page, a sparse contact page, and everything in between - omit a YAML key and the section vanishes, with no empty markup left behind.

## Lessons Learned

- Extracting a live project into a reusable template forced me to separate *content* from *structure* far more ruthlessly than the original site ever did - the front-matter-driven layout pattern came directly from needing one template to serve many forks.
- Building the motion system behind a single `prefers-reduced-motion` gate from day one was cheaper than retrofitting it; accessibility as an exit criterion is always more expensive than as a design constraint.

---

Source: [GitHub](https://github.com/Nuo27/phosphor-site)
