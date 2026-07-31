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

For two years my portfolio ran on [portfolYOU](https://github.com/YoussefRaafatNasry/portfolYOU), a clean Jekyll theme that did exactly what a portfolio needed: projects, blog posts, an about page, and a search box. It was fast, it worked, and I never had to think about it. Then I started thinking about it.

The honest trigger was that I found every gameplay-programmer portfolio I saw fell into one of two camps: a generic Bootstrap template that screamed "I don't care about UX", or a hand-built WebGL showcase that screamed "I have six months and a 3D-artist friend". Neither fit. I'm a programmer — I wanted the site itself to demonstrate the things I claim on the about page: craft, polish, attention to detail.

<!-- end_excerpt -->

The specific gripes with the old theme were familiar:

- **It looked like everyone else's portfolio.** The card grid, the muted palette, the typography — once you've seen one portfolYOU site, you've seen them all.
- **The architecture was theme-shaped, not mine.** Customising anything meant overriding someone else's mental model of how a portfolio should be built.

I wanted a site that felt like the kind of software I want to write: opinionated, responsive, with a clear point of view. So I threw it all out.

## The Design Language: Tactical Telemetry

This redesign idea came to me in a flash of nostalgia. I was playing a retro indie game that had an old terminal UI — phosphor green on near-black, monospace numerals, scanlines, a cursor that felt like it was _pointing_ at something rather than just hovering.

That reminds me some retro designs I've seen in the wild and from that I derived a complete token system. Every colour, every easing curve, every shadow is a named variable:

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

Jekyll is unsexy. It's a static site generator, it builds Markdown into HTML, it has no JavaScript runtime. That's exactly why I picked it. I didn't want to learn a new framework, I didn't want server-side rendering, I didn't want a deploy pipeline more complicated than `git push`. Jekyll builds, GitHub Pages hosts, done.

What I _did_ want was a richer client. So the architecture split became:

- **Jekyll** builds the HTML shell, the Markdown body, the Liquid includes.
- **Vanilla JS** (no framework, no jQuery for app code) takes over the shell on first paint and runs the show.
- **A PJAX soft router** (`assets/js/router.js`) intercepts internal link clicks, fetches the destination HTML, and swaps only `<main id="app">` into the live document.

That redesign builds some good animation, at least I am happy with it: The navbar, the custom cursor, the ambient atmosphere layer, the scroll bar — all of it lives for the lifetime of the tab. Navigation is a cross-fade, not a reload. Where supported, it's wrapped in `document.startViewTransition` so even the browser's built-in transition API gets involved.

## The fun parts

**Design tokens.** Splitting the design system into substrate / ink / accent / geometry / type / motion categories, mirroring SCSS variables into CSS custom properties so inline `<style>` blocks in the head can read the same values.

**The custom cursor.** A small inverted ring that lags the pointer by a few frames, with per-element state changes: it grows on links, zooms over gallery items, pulses on buttons, drags on scrollable surfaces.

**Redesign homepage** Completely rethought the homepage to be more engaging and interactive. Added new sections and some typoraphy ~

## The Content Layer: Write in Notion, Ship Static

A site is only worth building if writing for it is painless. The classic static-site pain is that publishing means `git push`-ing Markdown and waiting on a build. Notion is the opposite: open the app, type, and that's it. While other CMS services like PageCMS is good, but I mainly use notion and obsidian as my noting app which brings me to the idea of using notion as my CMS.

The obvious move is to build the whole site _in_ Notion — NotionNext does this, scraping your workspace and shipping it. The cost is that Notion becomes the single source of truth and you inherit its constraints. So I took the middle ground: write in Notion, build a static site, keep the site canonical.

I used the **official API** — an internal-integration with a `ntn_…` token and explicit `Read content` capability — not the `token_v2` session cookie hack. The API is a bit clunky, but it's the ez way to get the full page tree.

A Notion page is **properties** (typed columns from its database) plus **blocks** (the content). The interesting blocks are `child_page`, `child_database`, and `link_to_page` — that's how Notion expresses the page tree. To mirror a workspace into Markdown you traverse those blocks recursively, because a page can contain a database whose rows are pages that contain more databases. Notion goes arbitrarily deep, and the site should match.

The sync is a Node script that runs in two passes. **Pass one** gathers the whole tree: query every top-level database (`status = Published`), walk each page following `child_page` / `link_to_page` / `child_database`, and build a flat list plus a `pageId → URL` map. **Pass two** renders each entry to a Markdown file under `_articles/notion/` with an explicit `permalink`, then a regex pass rewrites every `notion.so/<pageId>` link to the matching `/articles/<path>/`.

Three details took iteration. First, the recursion is depth-first, so a page referenced inside another article would get claimed as a child before the top-level pass reached it — the fix is to pre-collect top-level ids into a set and skip references whose target is already top-level. Second, an inline database and a full-page database look identical in the API; the script distinguishes them via the database's `is_inline` field, with a `pages.retrieve` probe as fallback. Third, files need a stable identity that survives slug renames, so each generated file carries the Notion page UUID in its frontmatter (`notion_id:`); orphan detection and moves become ID-based, not path-based. A page whose `last_edited` hasn't changed is skipped on the next sync.

A GitHub Action runs the sync on a cron and on every push to the deploy branch, commits the generated files back, then builds. (One gotcha: `schedule` triggers fire on the default branch, so the default branch holds a thin copy of the workflow that always checks out the deploy branch to run against.)

The trade-offs are real and known. Well I mean you can use webhooks and build some automations to trigger the script when Notion content changes, but that's a bit unnesscary, its a static site and you dont write 365/247. And you can just run the script every 10 minutes or so.

## The Outcome

This is that site — [nuo27.github.io](https://nuo27.github.io/), the thing you're reading right now. Jekyll underneath, the tactical-telemetry shell on top, Notion/ md files feeding the articles.

Once it was stable I extracted it into a reusable template, **Phosphor**: the same phosphor-on-void HUD, the CRT atmosphere layer (grain, scanlines, vignette, aurora), the PJAX soft router, the two-layer token system, the hand-rolled Atom feed and SEO, and the Notion CMS bridge. Generalized so any fork becomes a `<username>.github.io` site with a few config edits — every section include is gated on a YAML key, so omitting a field removes the section with no empty markup. One template runs as a portfolio (project-heavy) or a personal site (article-heavy) by changing a few keys.

- **Project writeup:** [/portfolio/phosphor-site/](/portfolio/phosphor-site/)
- **Live demo:** [nuo27.github.io/phosphor-site](https://nuo27.github.io/phosphor-site/)
- **Source:** [github.com/Nuo27/phosphor-site](https://github.com/Nuo27/phosphor-site)

## Final Thoughts

The versions I‘ve shipped earlier and even now are wrong in a dozen small ways — the type scale, the mobile breakpoints are too aggressive, the cursor and hover states are inconsistent etc... And that's fine. The point of building it yourself is that you can keep fixing it, and every fix teaches you something about your own taste.
