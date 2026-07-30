---
layout: project
name: Chaos Siege
subtitle: Unreal Engine 5.5 multiplayer co-op shooter that fuses wave defense, tower strategy, RPG skills and weapon builds for two players.
description: Unreal Engine 5.5 multiplayer co-op shooter that fuses wave defense, tower strategy, RPG skills and weapon builds into one two-player loop, with Blueprint-architected gameplay, Steam P2P networking and data-driven progression.
category: Game
status: "2024-2025"
tags:
  [
    Unreal Engine 5.5,
    Blueprint,
    Steam Online Subsystem,
    Enhanced Input,
    StateTree,
    BehaviorTree,
    Animation Warping,
    Lumen,
    Nanite,
    MegaLights,
  ]
---

## Overview

A two-player co-op shooter where teammates share one lane: defend against waves while slotting towers, kiting, dropping skills and rolling weapon-gem dice on the fly. Blueprint-architected UE 5.5 project on `UAdvancedFriendsGameInstance`, with a deliberately small C++ surface area and most gameplay in data tables, structs, interfaces and Blueprints.

## Role

Sole gameplay programmer alongside one designer: netcode, character/weapon/skill/talent/quest/wave/tower-defense subsystems, AI, animation wiring, UI, settings and packaging.

## Contributions

- **Steam multiplayer foundation.** C++ game instance subclass bridges a Steam friends library to Blueprint through two hook points; session create/join/invite/friend list surface to BP without leaking Steam types. Steam P2P primary with IP fallback for LAN dev; EOS prototyped and cut.
- **Data-driven gameplay architecture.** Every character, weapon, skill, talent, wave and tower stat lives in DataTables/Structs/Enums; cross-system calls route through a Blueprint interface layer so two systems collaborate without inheriting each other's concrete classes.
- **Progression: skill, talent, quest.** DataTable-driven ability sets, a full talent tree with prerequisite nodes, and a quest condition pool that procedurally composes objective boards from a small set of condition types.
- **Equipment and weapon-gem upgrade loop.** Modular equipment composes weapons, gems and upgrade interactors; gems slot into weapons at runtime and mutate firing behavior, recoil and camera shake so build crafting is data-driven.
- **Tower defense on one spline.** Single spline drives wave pathing, tower placement and enemy movement; one damage/buff/control resolver feeds towers, skills and weapon upgrades.
- **Enemy AI on two paradigms.** BehaviorTree handles targeted movement tasks, StateTree handles the multi-phase combat/chase/path-check loop, both sharing one blackboard; per-archetype paradigm choice kept glue code out.
- **Lobby and UI.** Full lobby flow (character/level select, ready area, friend list, team platform, start button) plus ~11 widgets across main menu, online session, settings, talent tree, HUD, equipment/stats, crosshair, end-game and Steam friend list.
- **Animation, audio and rendering.** Animation Warping drives hand-IK with a third-party mantle system retargeted across four skeleton families;
- **Input, collision** ~23 input actions across two IMCs (gameplay + UI), three custom trace channels aligned 1:1 with the BP interface;

## Technical Challenges

- **Multiplayer that survives a flaky session.** Steam P2P with IP LAN fallback; the match is treated as a resilient session and combat/progression state rebuilds from a snapshot on reconnect, so a brief drop doesn't end the run. Cutting EOS early let one transport get hardened instead of two.
- **Fusing shooter, tower defense and RPG skills on one lane.** Three genres share a single play space without three rule systems drifting apart — one spline for pathing/placement/movement, one damage/buff/control resolver everywhere, so a balance change in one place is felt consistently.
- **Animation, mantle and IK across four skeleton families.** Animation Warping drives the hand-IK target and the mantle component retargets its curves and notify states across all four rigs, so a single set of animation assets adapts to each skeleton without per-rig rewrites.

## Lessons Learned

- **DataTables, Structs and Enums are the actual interface contract.** Designing the tower-defense schema up front made buff/control/joint-skill composition a designer-only task; the same recipe paid off across skills, talents, quests, waves and characters.
- **Don't reach for C++ to "do it right" on a Blueprint project.** A small C++ game-instance subclass with two BP hook points saved more iteration time than any amount of C++ would have — the rest is honestly better expressed in nodes designers can read.
- **AI paradigm choice is per archetype; cut scope fast.** StateTree + BT coexisting let us pick the simpler model per enemy type, retiring either entirely would have forced awkward glue code. Prototyping EOS and removing it before it metastasized kept networking Steam-only and one transport to harden.
