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

- Worked within the constraints of Mirror's LAN transport, dealing with occasional packet loss and reconnect edge cases by building deterministic round boundaries so any desync resolved at the start of the next round instead of mid-turn.
- Designed turn-based state as server-authoritative snapshots; the client only rendered predicted results, then reconciled once the server confirmed the round result, which kept both clients in agreement even on laggy networks.
- Ran the three-month build solo with a lightweight weekly milestone plan, ruthless scope cuts on secondary features, and self-playtest sessions after each mechanic was wired up.

## Lessons Learned

- Scope discipline mattered more than feature breadth — cutting nice-to-have cards and modes early kept the core loop shippable inside the window.
- Would invest in a simple automated test harness for card interactions next time; manual playtesting caught most logic bugs but not deterministic edge cases.

*Status: Test build (unreleased)*

![Gameplay simulation](/assets/image/projects/Ascension-to-Immortal-1.png)
