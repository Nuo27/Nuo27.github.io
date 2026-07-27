---
name: rebuilding-the-portfolio
permalink: /articles/rebuilding-the-portfolio/
title: "Rebuilding the Portfolio: From Theme to Toolkit"
description: "Why I threw out a working Jekyll theme and built my own — the tactical telemetry aesthetic, the architecture, and the details that took the longest."
tags: [Design, Jekyll, Frontend, Portfolio]
category: tech
lang: en
---

For two years my portfolio ran on [portfolYOU](https://github.com/YoussefRaafatNasry/portfolYOU), a clean Jekyll theme that did exactly what a new-grad portfolio needed: projects, blog posts, an about page, and a search box. It was fast, it worked, and I never had to think about it. Then I started thinking about it.

This is the story of throwing it all out and building something custom — why I did it, the design language I landed on, and the architecture that holds it together.

## Why Redesign

The honest trigger was a job hunt. Every gameplay programmer portfolio I saw fell into one of two camps: a generic Bootstrap template that screamed "I don't care about UX", or a hand-built WebGL showcase that screamed "I have six months and a 3D artist friend". Neither fit. I'm a programmer — I wanted the site itself to demonstrate the things I claim on the about page: craft, polish, attention to detail.

The specific gripes with the old theme were familiar:

- **It looked like everyone else's portfolio.** The card grid, the muted palette, the typography — once you've seen one portfolYOU site, you've seen them all.
- **The motion was nonexistent.** Page transitions were full browser reloads. Links were links. Hover states were CSS `:hover` and nothing else.
- **The architecture was theme-shaped, not mine.** Customising anything meant overriding someone else's mental model of how a portfolio should be built.

I wanted a site that felt like the kind of software I want to write: opinionated, responsive, with a clear point of view.

## The Design Language: Tactical Telemetry

Every meaningful redesign starts with one strong image. Mine was an aviation HUD at three in the morning — phosphor green on near-black, monospace numerals, scanlines, a cursor that felt like it was _pointing_ at something rather than just hovering. Tactical telemetry. CRT. The aesthetic of people who take their interfaces seriously.

From that image I derived a complete token system. Every colour, every easing curve, every shadow is a named variable in `_sass/_tokens.scss`:

| Token             | Value     | Role                                                                   |
| ----------------- | --------- | ---------------------------------------------------------------------- |
| `--bg-void`       | `#0B0D14` | Page substrate — lifted off pure black so the cursor doesn't disappear |
| `--phosphor`      | `#00FF9C` | Signature electric green — interactive, active, glow                   |
| `--phosphor-soft` | `#1FB886` | Editorial green — borders, sustained surfaces                          |
| `--ink`           | `#ECEEF5` | Soft off-white text — never pure white                                 |
| `--cyan`          | `#2BE4FF` | HUD cyan — links and secondary data                                    |
| `--hazard`        | `#FF2E4C` | Aviation red — alerts only                                             |

A light theme was non-negotiable — the site needed to work on paper, on a projector, in a brightly-lit interview room. So every token has a `[data-theme="light"]` counterpart: paper substrate (`#E8E5DC`, unbleached documentation paper), carbon ink, forest-green phosphor. The same layout, the same components, two completely different moods.

## Architecture: Stay Boring Where It Matters

I made one big architectural decision early, and it shaped everything else: **keep Jekyll, ditch the theme**.

Jekyll is unsexy. It's a static site generator from 2008, it builds Markdown into HTML, it has no JavaScript runtime. That's exactly why I picked it. I didn't want to learn a new framework, I didn't want server-side rendering, I didn't want a deploy pipeline more complicated than `git push`. Jekyll builds, GitHub Pages hosts, done.

What I _did_ want was a richer client. So the architecture split became:

- **Jekyll** builds the HTML shell, the Markdown body, the Liquid includes.
- **Vanilla JS** (no framework, no jQuery for app code) takes over the shell on first paint and runs the show.
- **A PJAX soft router** (`assets/js/router.js`) intercepts internal link clicks, fetches the destination HTML, and swaps only `<main id="app">` into the live document.

That last decision is what makes the site feel like an application instead of a stack of pages. The navbar, the custom cursor, the ambient atmosphere layer, the scroll bar — all of it lives for the lifetime of the tab. Navigation is a cross-fade, not a reload. Where supported, it's wrapped in `document.startViewTransition` so even browsers' built-in transition API gets involved.

## The Details That Took the Longest

The interesting work is never the layout. The interesting work is the invisible stuff.

**The custom cursor.** A small inverted ring that lags the pointer by a few frames, with per-element state changes: it grows on links, zooms over gallery items, pulses on buttons, drags on scrollable surfaces. The hard part wasn't the rendering — it was keeping hover state correct when the page isn't actually scrolling (smooth-scroll translates a wrapper via CSS transform, so `window.scrollY` never changes). I ended up with one rAF loop running `elementsFromPoint` every frame against the cursor's last-known viewport coordinates. One source of truth, no event-listener sprawl.

**Card tracing.** On the portfolio grid, a phosphor arc lights up the border of whatever card the cursor entered from. The angle is computed from the entry point, animated via a `--trace-spread` custom property registered with `@property` so the Web Animations API can interpolate it. Sounds simple. Took three days.

**Design tokens.** Splitting the design system into substrate / ink / accent / geometry / type / motion categories, mirroring SCSS variables into CSS custom properties so inline `<style>` blocks in the head can read the same values. Boring. Critical. Every later component took a quarter of the time it would have without it.

**Editorial link underlines.** Links don't get `text-decoration: underline`. They get a phosphor-tinted swipe that animates from left to right on hover, controlled by `background-size` transition. One mixin, used everywhere.

## What I'd Change

The custom cursor is the highest-risk component on the site. It's the thing most likely to break on a new browser, the thing that disables itself on touch devices, the thing that has to fall back gracefully when `prefers-reduced-motion` is set. It's also the thing visitors mention first. I'd build it again, but I'd budget twice the time for edge cases.

The PJAX router is the second-highest-risk component. Every soft navigation has to perfectly preserve scroll position, focus state, and event listener cleanup across the swap. Browsers' `startViewTransition` API is still new enough that its behaviour shifts between releases. I'd keep it, but I'd write more tests.

What I wouldn't change: Jekyll, the token system, the tactical telemetry aesthetic. Those are the load-bearing decisions, and a year in they still feel right.

## The Lesson

A portfolio isn't a deliverable. It's a running statement about what you care about. The version I shipped last week is already wrong in a dozen small ways — the type scale needs work, the mobile breakpoints are too aggressive, the cursor needs to respect `pointer: coarse` more carefully. That's fine. The point of building it yourself is that you can keep fixing it, and every fix teaches you something about your own taste.

Pick a strong image. Build boring where it matters. Spend your novelty budget on the things visitors will actually notice. Ship it, then keep editing.
