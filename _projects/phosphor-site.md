---
layout: project
name: Phosphor
image: /assets/image/projects/phosphor-site.svg
description: Magazine-grade Jekyll personal-site template with a tactical-telemetry aesthetic - extracted from the personal site that runs on it.
category: Web
status: "2026"
tags: [Jekyll, Vanilla JS, Bootstrap, SCSS, Open Source]
external_links:
  - { name: "Live Demo", url: "https://nuo27.github.io/phosphor-site/", icon: "external-link-alt" }
  - { name: "Source", url: "https://github.com/Nuo27/phosphor-site", icon: "github", prefix: "fab" }
---

## Overview

A Jekyll personal-site template extracted from the personal site that runs on it and generalized so any fork becomes a `<username>.github.io` site with a few config edits. The aesthetic is phosphor-green on void-dark HUD with a CRT atmosphere layer (grain, scan lines, vignette, aurora), editorial typography, and a PJAX soft router so the shell outlives each navigation. Ships with built-in SEO, a hand-rolled Atom feed, and an optional Notion-to-Markdown CMS bridge.

## Role

Solo Developer — design, frontend, and build pipeline.

## Contributions

- **HUD aesthetic and atmosphere layer.** Replaced a generic template look with a phosphor-on-void palette, CRT grain / scan lines / vignette / aurora overlays, a four-font editorial stack, and a custom inverted-triangle cursor with blend-difference ring and aurora trail.
- **Two-layer design tokens.** Sass compile-time constants for layout math, CSS custom properties for runtime theming; a single `data-theme` attribute flips dark / light without rebuilding.
- **PJAX soft router with View Transitions.** Fetches the next page, swaps only `<main>`, and cross-fades the swap; the shell (cursor, navbar, atmosphere, theme) survives the navigation instead of reloading. Prefetch on hover/focus/touch so the swap feels instant.
- **Animation system as a module, not a bundle.** Cursor renderer, interaction resolver, router, and pre-paint theme bootstrap live in separate files; reduced-motion and touch capability are checked once at startup and every effect degrades to a static state when either gate fires. The centerpiece card hover is a typed-property + WAAPI + conic-gradient border trace; the rest is CSS keyframes for ambient motion.
- **Front-matter as the actual API.** Every section include is gated on a YAML key, so omitting a field removes the section with no empty markup. One about layout serves everything from a sparse contact page to a full bio, which is what makes a single fork template viable.
- **Portfolio-to-personal-site pivot.** The home stream's random-work selector can mix projects and articles or show articles only; sections without content silently disappear. The same template runs as a portfolio (project-heavy) or a personal site (article-heavy) by changing a few keys.
- **SEO and feed without plugin sprawl.** `jekyll-sitemap` for the sitemap, a hand-rolled Atom feed (Notion child pages excluded by an explicit marker), Open Graph / Twitter / canonical / `robots.txt`, and a small Ruby plugin that fails the build if any hand-written markdown contains a bare Liquid output tag.
- **Notion CMS bridge.** A Node sync script reads configured Notion databases, walks `child_page` / `child_database` / `link_to_page` recursively, renders to Markdown, and writes into `_articles/notion/`. A GitHub Action runs the sync on a cron and a manual gate, then commits the generated files back before the Jekyll build; incremental sync keeps edits cheap and an internal-link rewrite keeps cross-references intact.

## Technical Challenges

- **A shell that outlives navigations.** Swapping only `<main>` means page-specific scripts can no longer rely on a one-shot init; every per-page initializer has to be re-bound on each route change and torn down before the next swap, while the cursor and atmosphere state stay continuous.
- **Animation as an accessibility constraint, not an afterthought.** Every effect — velocity-tracked cursor, border trace, scroll reveal — checks reduced-motion preference and touch capability up front and degrades to a static render. Shipping that gate on day one is what keeps the mobile experience clean.
- **Hand-rolled SEO instead of plugin stacks.** A thirty-line Atom feed and a few lines of OG meta cover what `jekyll-feed` + `jekyll-seo-tag` would, with full control over what appears in the feed, the cache headers, and the meta shape — and zero plugin surface to maintain.
- **Notion content inside Liquid.** Notion-sourced Markdown is third-party text that has to survive Jekyll's Liquid parser without accidentally executing, while still letting internal links resolve to the site's article paths.

## Lessons Learned

- **Extracting a live project into a reusable template is its own product work.** Forking, renaming, swapping keys, and deleting sections repeatedly exposes which hooks are load-bearing and which are decoration; a template that's truly forkable is harder to write than a one-off site.
- **Accessibility as a design constraint, not an exit criterion.** Routing every animation through a single reduced-motion and touch gate from day one is far cheaper than retrofitting it later — the same pattern showed up in every project that shipped motion.
- **Hand-rolled beats plugin sprawl.** One short feed script + a handful of meta tags beat pulling in SEO plugins, and the same instinct — write the small thing, name the upgrade path — showed up in the Notion bridge. The plugin surface stays small on purpose.