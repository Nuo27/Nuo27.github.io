---
layout: project
name: The Tragedy of Pondiberry Lodge
tags: [C#, Unity, Student Work]
image: /assets/image/projects/pondiberry.png
description: 3D exploration detective game (Unity/C#) - lead programmer, 5-person team, five themed levels.
category: Game
status: "2022-2023"
external_links:
  - { name: "Live Demo", url: "https://nuochen.itch.io/the-tragedy-of-pondiberry-lodge", icon: "external-link-alt" }
  - { name: "Source",    url: "https://github.com/Nuo27/The-Tragedy-of-Pondiberry-lodge", icon: "github", prefix: "fab" }
---

**The Tragedy of Pondiberry Lodge** is a 3D exploration detective game developed in Unity as the final project for UTS Game Design. Players explore a mysterious house, uncovering clues and solving environmental puzzles across five themed levels to uncover its secret and escape.

## Role

Team Leader & Lead Programmer (5-person team)

## Contributions

- Architected the complete game system: core gameplay loop, interaction framework, UI, and level progression
- Designed and built the tutorial level and first main level
- Managed team coordination, task assignment, and code integration across all five levels
- Implemented all game logic as the sole programmer on the team

## Technical Challenges

- **A polymorphic interaction framework so designers never touched code.** Every interactable - doors, drawers, keys - derived from a base `Thing` class with a virtual `OnEDown()`, and the player's E-key input dispatched polymorphically to whichever `Thing` was in range. A designer added a new interactable by subclassing `Thing` and dropping it into a scene, with no core code changes.
- **Build-index-driven level progression.** `LevelManager` tracked each level's completion as a static flag and resolved the active level through `SceneManager.GetActiveScene().buildIndex`, gating the next level on the previous one's objective - a minimal, predictable unlock model across all five levels.
- **Context-sensitive prompts via trigger zones.** `PromptManager` surfaced the right TextMeshPro action hint on `OnTriggerEnter`/`Exit` for whatever `Thing` the player was facing, so the interaction target was always unambiguous.
- **Stable-ID save state to survive scene reloads.** The hardest cross-level bug was a stale Unity reference after an asset's instance ID changed between scenes; I routed inter-level state through a small manager keyed on stable string IDs instead of object references.

## Lessons Learned

- Leading a five-person team while also being the sole programmer taught me that clear, written conventions save more time than any tooling.
- Would prototype the integration guide earlier next time and circulate it before people started building, instead of mid-project.

---

Playable demo: [itch.io](https://nuochen.itch.io/the-tragedy-of-pondiberry-lodge) · Source: [GitHub](https://github.com/Nuo27/The-Tragedy-of-Pondiberry-lodge)

{% include elements/video.html id="VD-D9FGmY-k" %}

{% capture carousel_images %}
/assets/image/projects/pondiberry-1.png
/assets/image/projects/pondiberry-2.png
/assets/image/projects/pondiberry-3.png
/assets/image/projects/pondiberry-4.png
{% endcapture %}
{% include elements/carousel.html %}
