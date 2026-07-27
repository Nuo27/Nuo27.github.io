# notion-sync

Syncs published pages from Notion databases into `_articles/notion/<path>.md`,
ready for the Jekyll build. See `notion-as-cms.md` in `_articles/` for the
design rationale.

## Quick start (local)

```powershell
cd scripts/notion-sync
npm install
# Copy .env.example (repo root) to .env and fill in real values.
cd ../..
node --env-file=.env scripts/notion-sync/index.js
```

You should see categories queried, pages walked recursively, and `.md` files
written under `_articles/notion/`. Run `bundle exec jekyll serve` to preview.

## Prerequisites: Notion setup

1. **Create an internal integration** at https://www.notion.so/profile/integrations.
   - Capabilities: Read content + Read user info without user identity.
   - Copy the token (`ntn_…`) → this is `NOTION_TOKEN`.
2. **Create one database per category** (e.g. *Tech*, *Notes*, *Games*).
   Each database row becomes a top-level article. Required columns:
   - `Title` (Title)
   - `Slug` (Rich text, optional — falls back to slugified title)
   - `Status` (Select with options `Published`, `Draft`)
   - `Description`, `Tags`, `Language` — optional, used for frontmatter
3. **Share each top-level database** with the integration (database → ⋯ menu
   → Connections → add your integration).
4. **Share every embedded child database** too — child blocks of type
   `child_database` and linked `link_to_page → database_id` each need their own
   share, otherwise the sync will skip them ("unreachable").
5. Copy each database's 32-char ID from its URL (the part before `?v=…`).

## Environment variables

Loaded from `.env` at repo root (local) or GitHub Secrets (CI).

| Variable | Required | Example | Notes |
|---|---|---|---|
| `NOTION_TOKEN` | yes | `ntn_…` | Integration secret. Hard error if missing. |
| `NOTION_DB_<CATEGORY>` | per category | `3aa94892d49f…` | One per category in `_data/categories.yml`. The suffix is the CATEGORY slug in UPPER_SNAKE. Env-var unset → category is skipped (warned). |

`categories.yml` is the single source of truth for category slugs. The script
derives the env-var name from each slug automatically.

### Adding a new category

1. **Append** an entry to `_data/categories.yml`:
   ```yaml
   - slug: ai
     name: AI
     eyebrow: "// CHANNEL_AI"
     tagline: "AI writeups and experiments."
   ```
2. **Create** the Notion database with the standard columns (Title/Slug/Status/Description/Tags/Language).
3. **Share** the database with the integration.
4. **Add a GitHub Secret** named `NOTION_DB_AI` whose value is the database ID.
5. **Add `NOTION_DB_AI=<id>` to your local `.env`**.
6. Push the yml change → CI picks up the new category next run.

## Output structure

```
_articles/notion/
  <slug>.md                          ← top-level article (Status=Published)
  <slug>/<child-slug>.md             ← child_page nested page
  <slug>/<child-slug>/<row>.md      ← database row
  <slug>/<db-slug>/<row>.md         ← full-page database row
```

Every file has explicit `permalink: /articles/<path>/`. Sub-pages carry
`nested: true` and are excluded from the `/articles/` listing.

## Diagnostics

The script prints a compact diagnostic per interesting page:

```
… notion-link-test: child_page×1, link_to_page×1, child_database×2
… db "inline database" …: db.is_inline=true
… db "page database"   …: db.is_inline=false
○ skip (already synced, link will point to first path): <id>
○ top-level page, skip recurse: <id>
✗ skip db "x" <id>: unreachable (<err>)
```

If you see `✗ skip db … unreachable`, the integration can't see that database
— go to Notion → ⋯ → Connections and add it.

## Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| `✗ NOTION_TOKEN missing` | `.env` not set or wrong path | `cp .env.example .env` and fill. Run from **repo root** with `--env-file=.env`. |
| `○ skip category "tech" (NOTION_DB_TECH not set)` | env-var name mismatch | Env-var name is `NOTION_DB_<SLUG_UPPER>`. Check `_data/categories.yml` slug matches. |
| `✗ child_page recurse failed … validation_error` | API called with bare id instead of `{page_id: …}` | Bug — report it. The script uses object args. |
| `✗ skip db … unreachable` | DB not shared with integration | Share the DB → ⋯ → Connections. Works recursively for nested DBs. |
| `✗ … path.page_id should be a valid uuid, instead was "undefined"` | Bare id passed to SDK | Bug — report. Should not happen after rate-limit rewrite. |
| Cron doesn't fire | Workflow file not on default branch (`main`) | This repo keeps `main` minimal (README + workflow). Mirror `.github/workflows/jekyll.yml` to `main`. |
| Images broken after an hour | Notion S3 URLs expire | Known accepted trade-off. Future: download to `assets/articles/<slug>/` (not implemented). |
| `dirs N > 0` in stats | Orphan cleanup removed empty directories after deletes | Normal. |

## Implementation notes

- **Two-pass**: `collectTree` pre-registers all top-level pages in `topLevelIds`
  so nested `link_to_page` references to them resolve to the top-level path
  (no duplicate nested copies).
- **Recursive walk** with `visited` set for cycle detection, `seenPaths` for
  duplicate-slug detection, `RESERVED_SLUGS` (category slugs) to prevent URL
  collisions.
- **Inline vs full-page databases** distinguished via `db.is_inline` from
  `databases.retrieve`. Fallback: `pages.retrieve` probe (full-page DBs are
  themselves pages). Unreachable DBs (unshared, throw on both) are skipped.
- **Internal link rewriting**: `pageIdToMeta` (built during walk) maps every
  page id → its path. A post-process regex replaces `notion.so/<id>` markdown
  links with `/articles/<path>/` and fills empty/ugly text with the title.
- **Orphan cleanup**: tracks the set of disk paths written this run (`currentFiles`);
  scans all of `_articles/`, deletes notion-managed `.md` files not in
  `currentFiles` (handles restructure / deletion automatically).
- **Rate limiting**: `p-limit` caps concurrency at 3 (matches Notion's ~3 req/s
  budget). Retries on 429 / 5xx with exponential backoff, honouring `Retry-After`.