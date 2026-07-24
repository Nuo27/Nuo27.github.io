---
layout: project
name: Ascension to Immortal
tools: [C#, Unity, Mirror]
image: /assets/image/projects/Ascension-to-Immortal.png
description: 2D LAN-based multiplayer card game (Unity/C#/Mirror) — solo developer, 3-month build.
category: Game
status: "2023"
---

**Ascension to Immortal** is a 2D round-based multiplayer card game developed independently after graduation. Built on the **Mirror** networking framework for LAN multiplayer, players collect elements and strategically buy or hold cards to reach a winning score.

## Role

Solo Developer (3-month development cycle)

## Contributions

- Built the entire game system independently: game logic, UI, and multiplayer networking
- Implemented card mechanics, turn-based round logic, and LAN state synchronization via Mirror
- Designed the element collection and scoring systems from scratch

## Technical Challenges

- **Mirror LAN transport with round-boundary desync recovery.** Ran on Mirror's LAN transport over a listen server; to absorb packet loss and reconnect edge cases I made every round a deterministic boundary — any drifted state reset to the server's snapshot at the start of the next round rather than mid-turn, so a laggy frame never corrupted an in-progress play.
- **Server-authoritative turn state with client prediction.** The server owned the canonical game state; clients rendered a predicted result locally and reconciled once the server's `[ClientRpc]` confirmed the round outcome, keeping both clients in agreement even on laggy networks.
- **Card logic as pure, deterministic rules.** Element collection, scoring, and turn validation were modelled as pure functions of the shared state, and draws used a seed agreed at round start — so the same inputs produced the same outcome on both peers, which is what made round-boundary reconciliation cheap.

## Lessons Learned

- Scope discipline mattered more than feature breadth — cutting nice-to-have cards and modes early kept the core loop shippable inside the window.
- Would invest in a simple automated test harness for card interactions next time; manual playtesting caught most logic bugs but not deterministic edge cases.

*Status: Test build (unreleased)*

![Gameplay simulation](/assets/image/projects/Ascension-to-Immortal-1.png)
