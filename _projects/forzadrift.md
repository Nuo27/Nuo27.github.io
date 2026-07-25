---
layout: project
name: ForzaDrift
tags: [Next.js, TypeScript, PostgreSQL, Prisma]
# image: /assets/image/projects/forzadrift.png   # TODO: drop a 1280×800 screenshot here, then uncomment
description: Community-driven Forza Horizon 6 drift leaderboards (Next.js/PostgreSQL) - submit a run with a video link, community-verifies the score.
category: Web
status: "2026"
external_links:
  - { name: "Live", url: "https://forzadrift.club", icon: "external-link-alt" }
---

**ForzaDrift** is a full-stack community leaderboard platform for Forza Horizon 6 drift zones and circuits. A run publishes to the board the moment it's submitted with a video link; the community then flags suspicious scores for admin review, and legitimate runs earn a verified badge after the fact. Built and deployed solo, live at [forzadrift.club](https://forzadrift.club).

## Role

Solo Developer - full-stack, design, DevOps

## Contributions

- Built the entire platform end-to-end on **Next.js 14** (App Router, React 18, Tailwind) with **PostgreSQL 16** + **Prisma 6**
- Built the **auth and anti-abuse stack** - NextAuth.js (credentials, JWT), a hand-written per-action rate limiter, and dual bot protection (Cloudflare Turnstile + self-hosted Altcha proof-of-work), geo-routed at the edge
- Designed the data model (Users, Drifter profiles, Zones/Records, Run reports, Tickets, Audit log) and the **dual-mode record review** - a runtime `publish` / `review` toggle over a unified submission lifecycle, plus the community reporting workflow around it
- Shipped bilingual **EN / 中文** support end-to-end via `next-intl`
- Wrote the deployment pipeline: **Docker Compose + Cloudflare Tunnel**, branch-per-environment strategy (`deploy`/`test`/`local`), pg_dump snapshots and JSON data exports with retention

## Technical Challenges

- **Anti-abuse was a first-class concern.** I wrote a small in-memory fixed-window rate limiter keyed per action and identity - `login:`, `signup:`, `changePw:`, `changePlayerId:` - each with its own ceiling, plus a GC timer so the bucket map can't leak. It's deliberately single-instance; the code names `@upstash/ratelimit + Redis` as the upgrade path the moment the app scales past one container.
- **Dual CAPTCHA for global reach.** Cloudflare Turnstile is the primary challenge, but it's unreachable from mainland China. I wired a self-hosted **Altcha proof-of-work** fallback - the browser solves a SHA-256 challenge across `navigator.hardwareConcurrency` Web Workers, the server re-verifies the HMAC signature and re-derives the key, with no third-party call. Edge middleware reads `cf-ipcountry` to route each visitor to the right provider.
- **Auth and session hardening.** Sessions are stateless JWTs but still revocable: a `tokenVersion` column lets me invalidate every outstanding token for a user instantly, and bcrypt cost-12 hashes auto-rehash on login when a legacy weaker hash is detected. A boot-time guard aborts the process if `NEXTAUTH_SECRET` is missing or still a placeholder, edge middleware issues a per-request nonce-based CSP, and login/signup errors stay deliberately generic so attackers can't tell which field collided.
- **Runtime-switchable review mode.** Records run in either `publish` mode (live the moment they're submitted) or `review` mode (hidden until an admin verifies them), and a SUPER_ADMIN flips between the two from `/admin/settings` with no redeploy. The key decision was decoupling the submission *lifecycle* - one `SUBMITTED` status - from the visibility *policy*, which is read from the database at query time. Switching modes takes effect on the very next request and never touches existing rows, so online users see no disruption.
- **Leaderboard ranking at the query layer.** Best-score dedup - one entry per drifter per zone, keeping their top run - is done in the Prisma query (`orderBy: score desc`) rather than denormalized on write, and the board exposes a `?runs=all` toggle to surface every run. Ranks are annotated server-side into a rank map, so the same record set feeds both the deduped leaderboard and a drifter's full run history.
- **Soft-delete via a Prisma client extension.** A Prisma 6 `$allOperations` extension intercepts every operation on soft-delete models: `delete` / `deleteMany` are rewritten to set `deletedAt`, and reads auto-append `where.deletedAt = null` unless a caller explicitly pins it (the trash page does, to see only tombstones). Because the intercept can't change the operation type, the rewrite routes through the *base un-extended* client captured by closure - dodging Prisma's op-type limit and recursion. The partial unique index enforcing "one run per video per zone" (excluding tombstones so resubmits-after-delete work) is one of several raw-SQL `00X_*.sql` migrations for things Prisma can't express, shipped alongside `prisma db push` as one step.
- **Integration tests for the fragile flows.** The tricky state transitions - mode flipping, status unification, real-time badge updates - are covered by dedicated scripts (`test-mode-flip.js`, `test-review-mode.js`, `test-unify-status.js`, `test-e2e.js`), not just unit tests, so regressions in the hard paths get caught before deploy.

## Lessons Learned

- **Plan the data model for the features you might pivot to.** ForzaDrift's records started in verify-must mode - every run gated behind admin review. I later flipped the whole site to publish-first, then realized I actually wanted *both*, selectable at runtime. Each pivot forced a status-enum backfill, and the schema still carries legacy `PENDING` / `APPROVED` / `PUBLISHED` values, kept only so old rows and audit logs keep resolving. What finally stuck: model the submission *lifecycle* (a status) separately from the visibility *policy* (a mode setting read from the DB), so the policy can change without ever touching the data.
- Building the simple rate limiter first and naming its upgrade path (`@upstash/ratelimit + Redis`) in a comment taught me to ship the boring solution and document the ceiling, rather than over-engineer for scale that hadn't arrived.

---

Live: [forzadrift.club](https://forzadrift.club)
