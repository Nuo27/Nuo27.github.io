---
layout: project
name: ForzaDrift
tags: [Next.js, TypeScript, PostgreSQL, Prisma]
image: /assets/image/projects/forzadrift.png
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

- Built the entire platform end-to-end on Next.js with PostgreSQL + Prisma — full-stack, design and DevOps solo.
- Built the **auth and anti-abuse stack** — NextAuth.js credentials, a hand-written per-action rate limiter, and dual bot protection (Cloudflare Turnstile + a self-hosted proof-of-work fallback), geo-routed at the edge.
- Designed the data model around drifters, zones, runs, community reports, tickets and an audit log, and built the dual-mode record review — a runtime publish / review toggle over a unified submission lifecycle, plus the community reporting workflow around it.
- Shipped bilingual EN / 中文 support end-to-end.
- Wrote the deployment pipeline — Docker Compose + Cloudflare Tunnel, branch-per-environment strategy, periodic database snapshots and JSON data exports with retention.

## Technical Challenges

- **Anti-abuse as a first-class concern.** Rate limiting, CAPTCHA and auth hardening shipped from day one rather than as add-ons - per-action rate limits with bucket cleanup, bcrypt-hashed credentials with on-login rehashing for legacy weak hashes, generic login errors so attackers can't probe which field collided, and a fail-closed boot guard that aborts startup if any auth secret is missing or still a placeholder.

- **CAPTCHA that works in every region.** Cloudflare Turnstile is the primary challenge, but it's unreachable from parts of the world. I added a self-hosted Altcha proof-of-work fallback that the browser solves in Web Workers and the server re-verifies, with edge middleware routing each visitor to the right provider by country, so the app works globally without depending on a third party for the fallback path.

- **Auth that can be revoked on demand.** Sessions are stateless JWTs but still revocable through a per-user version counter that invalidates every outstanding token at once, with generic login errors and a per-request nonce-based content security policy layered on top.

- **Runtime policy switches without a redeploy.** Records run in either a `publish` mode (live the moment they're submitted) or a `review` mode (hidden until an admin verifies them), and an admin flips between the two from a settings page with no rebuild. The key decision was decoupling the submission *lifecycle* (fixed) from the *visibility policy* (read from the database at query time) - so switching modes takes effect on the very next request and never touches existing rows.

- **Soft-delete that just works, including resubmits.** A Prisma client extension rewrites deletes into soft updates and auto-appends a tombstone filter to reads, with an opt-out for the trash view. Because the rewrite can't change the operation type, it routes through the base client captured by closure to dodge recursion, and a partial unique index enforces "one row per slot" while excluding tombstones so a user can delete and resubmit without races.

## Lessons Learned

- **Plan the data model for the features you might pivot to.** Records started in verify-must mode — every run gated behind admin review. The site later flipped to publish-first, then realized both modes were needed, selectable at runtime. Each pivot forced a status-enum backfill and the schema still carries legacy values kept only so old rows and audit logs keep resolving. What finally stuck: model the submission *lifecycle* (a status) separately from the visibility *policy* (a mode setting read from the DB), so the policy can change without ever touching the data.
- Building the simple rate limiter first and naming its upgrade path in code taught me to ship the boring solution and document the ceiling, rather than over-engineer for scale that hadn't arrived.

---

Live: [forzadrift.club](https://forzadrift.club)
