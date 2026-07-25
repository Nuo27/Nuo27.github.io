---
layout: project
name: Wistful
tags: [C#, Unity, Student Work]
image: /assets/image/projects/wistful.png
description: 3D exploration puzzle game (Unity/C#) - selected for the 2022 UTS Tech Festival.
category: Game
status: "2022"
external_links:
  - { name: "Live Demo", url: "https://k1ngslayer.itch.io/wistful-group-6", icon: "external-link-alt" }
  - { name: "Source",    url: "https://github.com/SpazyPear/Wistful", icon: "github", prefix: "fab" }
---

**Wistful** is a 3D low-poly exploration puzzle game set against the suffocating void of space. Players control a child astronaut navigating atmospheric sci-fi environments, solving environmental puzzles to progress through interconnected levels.

## Role

Gameplay Programmer (6-person team)

## Contributions

- Built core puzzle and interaction systems in C# within Unity
- Collaborated on player movement, camera mechanics, and level design
- Integrated environmental storytelling elements and gameplay feedback systems

## Technical Challenges

- **Hand-rolled the first-person controller.** Movement ran on a `Rigidbody` with mouse-look that clamped pitch to ±90° (`Mathf.Clamp`) so the camera couldn't flip, a `canMove` gate for cutscenes and puzzles, and a respawn check - no third-party character asset, just direct input to physics.
- **Puzzle interactables through inheritance and Unity UI Toolkit.** A base `VaultDoor` held the shared trigger and animation logic, and `PasswordedVaultDoor` subclassed it to pop a `UIDocument`-based password panel (`TextField`) on `OnTriggerEnter` - so a new puzzle was a subclass, not a rewrite.
- **Decoupled puzzle progression.** Each puzzle emitted a completion signal that other systems could subscribe to, so new content could react to solved puzzles without hardcoding cross-dependencies between scenes.
- **Cross-scene save state.** A lightweight store of solved-flags and triggered events was read on each level's load, keeping level scenes independent while preserving puzzle continuity between them.

## Lessons Learned

- Working on a six-person team taught me to over-communicate on small decisions - a quick message saved hours of re-integration later.
- Would invest earlier in shared tooling for level designers; even a small in-editor validator would have caught a few cross-level inconsistencies before playtest.

## Recognition

Selected for presentation at the **2022 UTS Tech Festival**.

---

Playable demo: [itch.io](https://k1ngslayer.itch.io/wistful-group-6) · Source: [GitHub](https://github.com/SpazyPear/Wistful)

{% capture carousel_images %}
/assets/image/projects/wistful-1.png
/assets/image/projects/wistful-2.png
/assets/image/projects/wistful-3.png
/assets/image/projects/wistful-4.png
{% endcapture %}
{% include elements/carousel.html %}
