---
layout: project
name: Ascension to Immortal
subtitle: 2D LAN-based multiplayer xianxia card game on Unity + Mirror - solo build, 3-month window after graduation.
description: 2D LAN-based multiplayer card game (Unity/C#/Mirror) - solo developer, 3-month build.
image: /assets/image/projects/Ascension-to-Immortal.png
category: Game
status: "2023"
tags: [C#, Unity, Mirror]
---

## Overview

A 2-4 player LAN card game on a xianxia / cultivation theme: each round players take three elements from a shared pool, then either spend them to buy a pill card or hold one card to bank a universal element across rounds. Built solo on Unity 2021.3 + C# with Mirror's KCP transport, all card data generated from CSV into ScriptableObjects via an editor menu.

## Role

Sole gameplay programmer alongside one designer under 3-month build: design, code, networking, UI, data authoring pipeline.

## Contributions

- **Data-driven card authoring.** ~90 normal "spirit pill" cards + 15 score "skill" cards defined in CSV, regenerated into ScriptableObjects via an editor menu item so balance changes never require a code edit.
- **Round-based core loop.** Five shared elements, take-three-each-turn economy with a held-cap, buy-vs-hold choice per round, and a 15-point win condition where special skill cards auto-purchase once the player's element-producing engine covers their cost.
- **Server-authoritative multiplayer on Mirror/KCP.** KCP transport over LAN with UDP room discovery; all game state synced through `[SyncVar]` and `SyncList<T>` with `[Command]` / `[ClientRpc]` as the only mutation surface - no client-side prediction.
- **Per-turn authority handoff.** Write authority on the gameplay managers transfers to the active player's connection each turn, so non-active players' inputs silently no-op rather than race on shared state.
- **Full UI stack.** Main menu with intro video, room creation/discovery with ping, pre-game waiting room, in-game HUD per player, element pickup panel, buy/hold confirm panel, notification feed, pause, and end-game scoreboard - UGUI + TextMeshPro + LeanTween.
- **Round-boundary state model.** Pool totals and per-player "card-provided" elements persist across rounds; only the unspent-per-round selection and the action-done flag reset, which keeps late-join and disconnect-recovery cheap.

## Technical Challenges

- **Turn-based concurrency without locks.** Multiple players on a shared board game normally need locks or per-player isolation; here the server hands client authority on the gameplay managers to exactly one connection per turn, which dissolves the race before it can form.
- **Authoritative state without prediction on a laggy LAN.** Every state change round-trips to the server with no client-side prediction, so the design has to keep the round as the only meaningful boundary - resets and re-deals happen at round start from the server's snapshot, never mid-turn.
- **One resource pool serving two roles.** Elements are simultaneously a per-turn spend (for buying cards) and a long-term stock (the held card's persistent element output); a 10-element cap and the buy-return-to-pool mechanic keep one resource from outgrowing the loop.
- **Auto-purchase as a server-only trigger.** Special skill cards buy themselves the instant the player's accumulated card-provided elements satisfy their cost, and the check has to be server-side and atomic so a client can't spoof the trigger.

## Lessons Learned

- **Persist vs reset is a design decision, not an implementation detail.** Drawing the line early (pool totals + card-provided elements + held card persist; per-round selection + action-done reset) made reconnect and late-join trivial - the server's snapshot at the next round boundary was always enough.
- **CSV to ScriptableObject is the right data pipeline at this scale.** A 100-line editor script replaced a runtime parser and let me tune cards without entering the Unity editor's inspector grind; the same recipe carried into later UE5 projects.
- **Scope cuts early keep the window.** Trimming the planned features in week one (and again whenever a new idea showed up) is what kept a 3-month solo build shippable; the parts that survived are exactly the parts that mattered to the core loop.

---

_Status: Test build (unreleased)_

![Gameplay simulation](/assets/image/projects/Ascension-to-Immortal-1.png)
