---
name: notion-as-cms
title: "Notion as a CMS for a Static Site"
description: "How I wired Notion into a Jekyll site via the official API: recursive mirroring of the page tree, inline vs full-page databases, link rewriting, and CI plumbing."
tags: [Jekyll, Notion, API, Design]
category: tech
lang: en
permalink: /articles/notion-as-cms/
excerpt_separator: <!-- end_excerpt -->
---
I wanted to keep writing articles in Notion — the editor, the mobile app, the share-with-a-friend-to-edit flow — without giving up a static site. So I built a sync that mirrors a Notion workspace into a directory of Markdown files. Here is what it actually does and where the sharp edges are.

## What you give up by going static

The site you are reading is plain HTML + CSS + a tiny bit of JS. No database, no server, no admin panel. Every article is a Markdown file under `_articles/` with a YAML frontmatter block. Build it with Jekyll, push the result to a CDN, done.

The downside is that writing an article means SSH-ing into a server (or `git push`ing), editing Markdown, waiting for a build, hoping you didn't typo a tag. Notion is the opposite: open the app, type, hit publish. I wanted the second experience without giving up the first.

The obvious move is to build the whole site *in* Notion. NotionNext (the well-known one) does that: it scrapes your workspace, mounts every page as a route, ships a React app. The cost is that Notion becomes the single source of truth and you inherit its constraints — search ranking, performance, uptime, link rot when a share is revoked. I wanted something gentler: write in Notion, build a static site, keep the site canonical.

## Why the official API, not `token_v2`

Notion has two access paths:

1. **Internal integration** — a bot identity with a `ntn_…` token and explicit `Read content` capability. Calls the public REST API at `api.notion.com`. This is the supported, documented way.
2. **Session cookie (`token_v2`)** — the same one your browser sends. Powers NotionNext, lets you read any workspace the cookie can see. Not supported, can break without notice, and tying your deploy to it means your site dies when the session expires.

I went with (1). It is slower to set up — you create an integration, share each database with it, copy a token — but the surface is small and stable. Rate limits are documented (~3 req/s). Errors are typed.

The one annoyance: you must share each database explicitly with the integration. The integration can read anything you share, nothing else. For the tech blog this is one database; for a heavier workspace, every nested database needs its own share too, which is the single biggest source of "why is this not showing up" confusion. (We will come back to it.)

## The shape of a Notion page

A Notion page has two pieces:

- **Properties** — typed columns (Title, Status, Tags, Slug, Description…). These come from the database the page lives in. For a sub-page (no database), there is just a title.
- **Blocks** — the content: headings, paragraphs, images, tables, but also `child_page`, `child_database`, `link_to_page`. Those last three are the interesting ones. They are how Notion expresses the page tree.

`child_page` is a sub-page. `child_database` is a database created inline. `link_to_page` is a reference to an existing page or database (think `@mention` or drag-to-link). All three are stored the same way: as a block inside the parent's body, with a reference to the target.

To mirror a Notion workspace into a tree of Markdown files, you have to traverse those blocks. Recursively. Because a page can contain a sub-page which contains a database which contains rows which are pages which can contain sub-pages. Notion goes arbitrarily deep, and you want the site to match.

## The data flow

```
Notion DB(s)
   │  NOTION_TOKEN, NOTION_DB_<slug> per category
   ▼
scripts/notion-sync/index.js
   │  reads _data/categories.yml (single source of truth for category list)
   │  scans existing files for notion_id map
   │  two-pass: gather → render (with incremental-skip via last_edited)
   ▼
_articles/notion/<path>.md
   │  explicit permalink, notion_id + last_edited for ID tracking
   ▼
Jekyll build → static site → CDN
```

`_data/categories.yml` looks like this:

```yaml
- slug: tech
  name: Tech
  eyebrow: "// CHANNEL_TECH"
  tagline: "Engineering deep-dives, tooling, and writeups."
- slug: notes
  name: Notes
  eyebrow: "// CHANNEL_NOTES"
  tagline: "Loose notes, snippets, and reflections."
```

The script derives everything else from that file: the env-var name (`NOTION_DB_<SLUG_UPPER>`), the nav eyebrow, the listing subtitle. Add a category by appending one entry to this YAML and one secret to your repo. No code change.

## Pass one: gather the whole tree

The first pass queries every top-level database (status filter `= Published`), then walks each page recursively, following `child_page` / `link_to_page` / `child_database` blocks. The goal is a flat list of `{ page, slug, path, title, blocks }` plus a `pageIdToMeta` map that turns any page id into its URL path.

Two things matter here that are easy to get wrong.

**First**, the recursion is depth-first and queries run in series. If page A references page B, and page B is also a top-level published article, the recursion reaches B *as a child of A* before the top-level pass gets to it. B ends up nested under A and the top-level B is skipped as a duplicate. The fix is to pre-collect every top-level page id into a set, and inside the recursion skip any reference whose target is in that set. The link in A still points to the right URL — the URL comes from the global `pageIdToMeta` map, which the top-level pass filled in.

**Second**, an embedded database looks the same as a top-level one in the API. Both are `child_database` blocks. To distinguish them I check the database's own `is_inline` field (returned by `databases.retrieve`). Inline databases render as a table inside the parent body; full-page databases become their own nested page with the rows hanging off it. If the field is missing (it was for a while on some block objects), I fall back to probing with `pages.retrieve` — a full-page database is also a page, so a successful probe means full-page, a failure means inline.

**Third** — and this took a few iterations to get right — *pages need a stable identity that survives slug renames*. Tracking files by disk path is fragile: rename a Notion `Slug` property from `test` to `test-note` and you get a new file at the new path while the old file lingers. The fix is to store the Notion page UUID in the frontmatter (`notion_id:`) and treat that as the authoritative identity. Orphan detection then becomes ID-based: scan existing files, build a `notionId → filepath/path/lastEdited` map, delete any file whose `notionId` is no longer in the current Notion query. Slug renames become a stale-location check: same `notionId`, different `path` → delete old file, write new one. As a bonus, you can skip re-rendering a page whose `last_edited` hasn't changed (NotionNext uses the same trick for its cache key).

## Pass two: render and write

The second pass turns each collected entry into a Markdown file. Each file gets an explicit `permalink:` frontmatter so the URL is exactly what we want regardless of where the file lives on disk.

```
_articles/notion/notion-link-test.md                      → /articles/notion-link-test/
_articles/notion/notion-link-test/inside-page.md          → /articles/notion-link-test/inside-page/
_articles/notion/notion-link-test/3312.md                 → /articles/notion-link-test/3312/
_articles/notion/notion-link-test/page-database.md        → /articles/notion-link-test/page-database/
_articles/notion/notion-link-test/page-database/32.md      → /articles/notion-link-test/page-database/32/
_articles/notion/notion-sync-test.md                      → /articles/notion-sync-test/
```

Notice that `notion-sync-test` is a top-level article — even though `notion-link-test` links to it. The recursion skipped the link (top-level set), the top-level pass claimed it, and the parent's link resolved to `/articles/notion-sync-test/`. Same logic works at any depth.

For each block fetched during pass one, I also collect its blocks once and cache them — `notion-to-md` will re-fetch them later when converting to Markdown, and for a deep tree the duplicate API calls add up.

Notion content becomes Markdown via `notion-to-md`, a thin wrapper around the Notion API that knows how to convert each block type to its Markdown equivalent. It handles headings, paragraphs, lists, tables, code, callouts, toggles, images, etc. The custom-transformers hook lets you override specific block types — I use it for `child_database` and `link_to_page` because the defaults (database → just the title, link_to_page → ugly default text) are not what you want.

After rendering, a single regex pass replaces every `notion.so/<pageId>` markdown link with `/articles/<path>/`. That handles inline @-mentions and `link_to_page` blocks in one go.

## The listing problem

`site.articles` includes every page in the collection — top-level and nested. The listing at `/articles/` would otherwise show every sub-page and every database row alongside the real articles. A `nested: true` frontmatter flag, set automatically on any non-top-level page, lets the listing template skip them. So:

{% raw %}
```liquid
{% for article in articles %}
  {% if article.nested %}{% continue %}{% endif %}
  ...
{% endfor %}
```
{% endraw %}

Sub-pages are reachable via their parent's link, via the URL, and via search. They are deliberately absent from the listing.

## Orphans, restructuring, and "did I delete everything?"

Deletion is the hard case. If you unpublish a page in Notion, the next sync should remove its file. If you move a page (Notion allows renaming sub-pages), the next sync should rewrite the file at the new path. If you delete a database, every file under it should go.

The implementation has three pieces:

- **Identity is the Notion page UUID, not the file path.** Every generated file carries `notion_id: <page.id>` in its frontmatter. On each run, the script scans `_articles/notion/**`, reads every notion-managed file's frontmatter, and builds a map `{ notionId → { filepath, lastEdited, path } }`. "Which file is which Notion page?" is answered by this map.

- **Path changes are detected by comparing paths for the same id.** When the renderer writes a page, it looks up `existingById[id]`. If the existing entry's `path` differs from the new one, the old file is deleted before the new one is written. Slug renames in Notion become a one-shot move on disk, not a duplication.

- **Orphans are files whose notion_id is no longer in the current sync.** After rendering, the script walks `existingById` and deletes every entry whose `notionId` is not in `currentPageIds` (pages the current Notion query returned, including all recursively-discovered nested pages). This is robust to `git` restoring old files after a branch switch: the next sync finds them without a matching id and removes them. Old notion-managed files generated before this change existed (no `notion_id` in frontmatter) are skipped by the scanner; clean them up with a one-time `git rm`.

The "disk path" approach (track which paths you wrote, delete anything else) is simpler but breaks on slug renames and on `git` operations. The "Notion id" approach survives both. The cost is one extra scan at the start of every sync.

## A note on template injection

The Notion content lives inside a Jekyll-processed file. If a Notion page contains `{{ site.data.categories }}` or `&#123;% include head.html %&#125;`, Jekyll will evaluate it at build time. For a personal site where only the owner edits Notion, that is fine. For a public workspace it is a real XSS-shaped foot-gun. The fix is to wrap every generated body in `&#123;% raw %&#125;…&#123;% endraw %&#125;`, which tells Jekyll to pass the contents through unchanged. The cost is that bodies literally containing the string `&#123;% endraw %&#125;` would break the wrap; for a personal blog this is acceptable.

## The cron / branch plumbing

`schedule` triggers in GitHub Actions run the workflow file from the *default* branch. If you keep your whole site on a `deploy` branch, the schedule silently does nothing. The fix is to make the default branch minimal: a README and a copy of the workflow file. The workflow always checks out `ref: deploy` regardless of which trigger fired, runs the sync there, commits the new files to `deploy`, then builds and deploys. The thin default branch exists so the cron trigger can find something to run.

```yaml
on:
  push: { branches: [deploy] }
  schedule: [{ cron: '0 * * * *' }]
  workflow_dispatch:
jobs:
  build:
    steps:
      - uses: actions/checkout@v4
        with: { ref: deploy }
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: npm ci
        working-directory: scripts/notion-sync
      - run: node scripts/notion-sync/index.js
        env:
          NOTION_TOKEN: ${{ secrets.NOTION_TOKEN }}
          NOTION_DB_TECH: ${{ secrets.NOTION_DB_TECH }}
          NOTION_DB_NOTES: ${{ secrets.NOTION_DB_NOTES }}
      - run: |
          git config user.name "github-actions[bot]"
          git add _articles
          git diff --staged --quiet || (git commit -m "chore: sync notion articles" && git push)
      - run: bundle exec jekyll build
```

## The trade-offs you should know about

**Notion-hosted images expire.** The official API returns signed S3 URLs that live about an hour. For a daily-updated site that is fine. For a post that sits in an archive, it is not. The accepted workaround for now is to leave the URLs alone; the real fix is downloading images into `assets/articles/<slug>/` during sync, which is a one-day project I have not done yet.

**Notion blocks degrade.** A `callout` becomes a blockquote. A `column_list` flattens. An embedded database's children collapse into the database's own row listing. Embedded YouTube / Figma / tweet cards become plain links. If you design your Notion content with these constraints in mind — mostly text, occasional embeds you accept as links — the result reads fine.

**Notion's API does not expose every block property.** The `is_inline` flag on `child_database` was missing from some block responses for a while, forcing the `pages.retrieve` fallback. Some databases return zero rows even when rows clearly exist, usually because the integration was not shared with the database the row actually lives in. The diagnostic logs (`… db "<name>": db.is_inline=true` and `cols=X rows=Y`) make both kinds of problem obvious in seconds.

**Jekyll will happily evaluate template syntax in your Notion content.** Wrap the body in `&#123;% raw %&#125;` — the script does this — and this is a non-issue. Without it, a single misplaced `{{ site.something }}` in a Notion article becomes a build-time information disclosure.

**The whole thing is fragile to schema changes.** If a Notion column rename or a property-type change ripples through your database, the sync can silently produce wrong files. There is no schema versioning yet. For a personal site this is acceptable; for anything shared you would want a migration step or a "schema unchanged since" guard.

**Jekyll's auto-excerpt will warn about Liquid blocks.** The fix is `excerpt_separator: <!-- end_excerpt -->` in the generated frontmatter, telling Jekyll to use a custom string for the excerpt split so it does not complain about `\n\n` inside our `&#123;% raw %&#125;` wrapper.

## Why this, and not NotionNext

NotionNext is the right tool if you want the site to *be* Notion — every page lives in Notion, navigation, search, comments, everything. The cost is that you are betting the whole site on Notion's availability, its HTML generation, and the longevity of your `token_v2` session cookie.

Internally, NotionNext caches block fetches with a key like `page_block_<pageId>_<lastEditedDate>` — the same Notion page UUID + edit-time idea this project uses, just kept in memory + file + Redis rather than written into frontmatter. That cache key pattern is what makes the `notion_id` + `last_edited` frontmatter fields here work too: a page whose `last_edited` has not changed is skipped on the next sync, the same way NotionNext skips a cache hit. NotionNext does this at runtime in a Next.js process; this setup does it at build time against a checked-in tree of Markdown files.

This setup does the opposite: Notion is the *editor*, the static site is the *product*. Notion can be down for a day and the site still serves. You can move databases between workspaces. You can migrate off Notion entirely by exporting the database, writing a one-shot Markdown converter, and committing the result — no re-platforming of the site required.

Both are valid. I wanted the second one.