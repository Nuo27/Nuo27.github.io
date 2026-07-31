---
name: building-phosphor
permalink: /articles/building-phosphor/
title: "Building Phosphor: From a Jekyll Theme to a Reusable Template"
description: "Why I threw out a working Jekyll theme, built a tactical-telemetry personal site with a PJAX shell, wired Notion in as a CMS, and extracted it into a fork-ready template."
tags: [Design, Jekyll, Frontend, Portfolio, Notion, API]
category: tech
lang: en
excerpt_separator: <!-- end_excerpt -->
---

For two years my portfolio ran on [portfolYOU](https://github.com/YoussefRaafatNasry/portfolYOU), a clean Jekyll theme that did exactly what a new-grad portfolio needed: projects, blog posts, an about page, and a search box. It was fast, it worked, and I never had to think about it. Then I started thinking about it.

The honest trigger was a job hunt. Every gameplay-programmer portfolio I saw fell into one of two camps: a generic Bootstrap template that screamed "I don't care about UX", or a hand-built WebGL showcase that screamed "I have six months and a 3D-artist friend". Neither fit. I'm a programmer — I wanted the site itself to demonstrate the things I claim on the about page: craft, polish, attention to detail.
<!-- end_excerpt -->

The specific gripes with the old theme were familiar:

- **It looked like everyone else's portfolio.** The card grid, the muted palette, the typography — once you've seen one portfolYOU site, you've seen them all.
- **The motion was nonexistent.** Page transitions were full browser reloads. Links were links. Hover states were CSS `:hover` and nothing else.
- **The architecture was theme-shaped, not mine.** Customising anything meant overriding someone else's mental model of how a portfolio should be built.

I wanted a site that felt like the kind of software I want to write: opinionated, responsive, with a clear point of view. So I threw it all out.

## The Design Language: Tactical Telemetry

Every meaningful redesign starts with one strong image. Mine was an aviation HUD at three in the morning — phosphor green on near-black, monospace numerals, scanlines, a cursor that felt like it was _pointing_ at something rather than just hovering. Tactical telemetry. CRT. The aesthetic of people who take their interfaces seriously.

From that image I derived a complete token system. Every colour, every easing curve, every shadow is a named variable:

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

That last decision is what makes the site feel like an application instead of a stack of pages. The navbar, the custom cursor, the ambient atmosphere layer, the scroll bar — all of it lives for the lifetime of the tab. Navigation is a cross-fade, not a reload. Where supported, it's wrapped in `document.startViewTransition` so even the browser's built-in transition API gets involved.

## The Details That Took the Longest

The interesting work is never the layout. The interesting work is the invisible stuff.

**The custom cursor.** A small inverted ring that lags the pointer by a few frames, with per-element state changes: it grows on links, zooms over gallery items, pulses on buttons, drags on scrollable surfaces. The hard part wasn't the rendering — it was keeping hover state correct when the page isn't actually scrolling (smooth-scroll translates a wrapper via CSS transform, so `window.scrollY` never changes). I ended up with one rAF loop running `elementsFromPoint` every frame against the cursor's last-known viewport coordinates. One source of truth, no event-listener sprawl.

**Card tracing.** On the portfolio grid, a phosphor arc lights up the border of whatever card the cursor entered from. The angle is computed from the entry point, animated via a `--trace-spread` custom property registered with `@property` so the Web Animations API can interpolate it. Sounds simple. Took three days.

**Design tokens.** Splitting the design system into substrate / ink / accent / geometry / type / motion categories, mirroring SCSS variables into CSS custom properties so inline `<style>` blocks in the head can read the same values. Boring. Critical. Every later component took a quarter of the time it would have without it.

**Editorial link underlines.** Links don't get `text-decoration: underline`. They get a phosphor-tinted swipe that animates from left to right on hover, controlled by `background-size` transition. One mixin, used everywhere.

## The Content Layer: Write in Notion, Ship Static

A site is only worth building if writing for it is painless. The classic static-site pain is that publishing means `git push`-ing Markdown and waiting on a build. Notion is the opposite: open the app, type, hit publish. I wanted the second experience without giving up the first.

The obvious move is to build the whole site _in_ Notion — NotionNext does this, scraping your workspace and shipping a React app. The cost is that Notion becomes the single source of truth and you inherit its constraints: search ranking, performance, uptime, link rot when a share is revoked. So I took the middle ground: write in Notion, build a static site, keep the site canonical.

I used the **official API** — an internal-integration bot with a `ntn_…` token and explicit `Read content` capability — not the `token_v2` session cookie that powers NotionNext. The official path is slower to set up (create the integration, share each database with it) but the surface is small, stable, and rate-limited in a documented way (~3 req/s). The one annoyance: every nested database must be shared explicitly, which is the single biggest source of "why isn't this showing up".

A Notion page is **properties** (typed columns from its database) plus **blocks** (the content). The interesting blocks are `child_page`, `child_database`, and `link_to_page` — that's how Notion expresses the page tree. To mirror a workspace into Markdown you traverse those blocks recursively, because a page can contain a database whose rows are pages that contain more databases. Notion goes arbitrarily deep, and the site should match.

The sync is a Node script that runs in two passes. **Pass one** gathers the whole tree: query every top-level database (`status = Published`), walk each page following `child_page` / `link_to_page` / `child_database`, and build a flat list plus a `pageId → URL` map. **Pass two** renders each entry to a Markdown file under `_articles/notion/` with an explicit `permalink`, then a regex pass rewrites every `notion.so/<pageId>` link to the matching `/articles/<path>/`.

Three details took iteration. First, the recursion is depth-first, so a page referenced inside another article would get claimed as a child before the top-level pass reached it — the fix is to pre-collect top-level ids into a set and skip references whose target is already top-level. Second, an inline database and a full-page database look identical in the API; the script distinguishes them via the database's `is_inline` field, with a `pages.retrieve` probe as fallback. Third, files need a stable identity that survives slug renames, so each generated file carries the Notion page UUID in its frontmatter (`notion_id:`); orphan detection and moves become ID-based, not path-based. A page whose `last_edited` hasn't changed is skipped on the next sync — the same UUID-plus-edit-time trick NotionNext uses for its cache key, just written into frontmatter instead of memory.

A GitHub Action runs the sync on a cron and on every push to the deploy branch, commits the generated files back, then builds. (One gotcha: `schedule` triggers fire on the default branch, so the default branch holds a thin copy of the workflow that always checks out the deploy branch to run against.)

The trade-offs are real and known. Notion's signed image URLs expire in about an hour — fine for a frequently-updated site, not fine for an archive; the real fix is downloading images during sync, not yet implemented. Notion blocks degrade: a callout becomes a blockquote, a column list flattens, embeds become plain links. And because Notion content lives inside a Jekyll-processed file, every generated body is wrapped in `&#123;% raw %&#125;` so a stray `&#123;&#123; site.something &#125;&#125;` can't execute at build time.

Notion is the editor; the static site is the product. Notion can be down for a day and the site still serves.

## The Outcome

This is that site — [nuo27.github.io](https://nuo27.github.io/), the thing you're reading right now. Jekyll underneath, the tactical-telemetry shell on top, Notion feeding the articles.

Once it was stable I extracted it into a reusable template, **Phosphor**: the same phosphor-on-void HUD, the CRT atmosphere layer (grain, scanlines, vignette, aurora), the PJAX soft router, the two-layer token system, the hand-rolled Atom feed and SEO, and the Notion CMS bridge. Generalized so any fork becomes a `<username>.github.io` site with a few config edits — every section include is gated on a YAML key, so omitting a field removes the section with no empty markup. One template runs as a portfolio (project-heavy) or a personal site (article-heavy) by changing a few keys.

- **Project writeup:** [/portfolio/phosphor-site/](/portfolio/phosphor-site/)
- **Live demo:** [nuo27.github.io/phosphor-site](https://nuo27.github.io/phosphor-site/)
- **Source:** [github.com/Nuo27/phosphor-site](https://github.com/Nuo27/phosphor-site)

## What I'd Change

The custom cursor is the highest-risk component on the site. It's the thing most likely to break on a new browser, the thing that disables itself on touch devices, the thing that has to fall back gracefully when `prefers-reduced-motion` is set. It's also the thing visitors mention first. I'd build it again, but I'd budget twice the time for edge cases.

The PJAX router is the second-highest-risk component. Every soft navigation has to perfectly preserve scroll position, focus state, and event listener cleanup across the swap. The `startViewTransition` API is still new enough that its behaviour shifts between releases. I'd keep it, but I'd write more tests.

What I wouldn't change: Jekyll, the token system, the tactical-telemetry aesthetic. Those are the load-bearing decisions, and a year in they still feel right.

## The Lesson

A portfolio isn't a deliverable. It's a running statement about what you care about. The version I shipped is already wrong in a dozen small ways — the type scale needs work, the mobile breakpoints are too aggressive, the cursor needs to respect `pointer: coarse` more carefully. That's fine. The point of building it yourself is that you can keep fixing it, and every fix teaches you something about your own taste.

Pick a strong image. Build boring where it matters. Spend your novelty budget on the things visitors will actually notice. Ship it, then keep editing.
