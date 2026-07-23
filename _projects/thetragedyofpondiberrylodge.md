---
layout: project
name: The Tragedy of Pondiberry Lodge
tools: [C#, Unity]
image: /assets/image/projects/pondiberry.png
description: 3D exploration detective game (Unity/C#) — lead programmer, 5-person team, five themed levels.
category: Game
status: "2022–2023"
tags: [Student Work]
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

- Designed the interaction framework around simple component triggers that designers could drop into a scene and configure via inspector fields, so non-programmers could wire up new interactables without touching code.
- Built progression as a linear unlock list tied to completion flags per level, with the next level gated by the previous one's final event, which kept save state minimal and predictable across the five levels.
- The integration guide covered Unity workflow basics, naming conventions for scripts and prefabs, where to place new assets, and a checklist for testing a level in isolation before handing it off for integration.
- The hardest cross-level bug turned out to be a stale reference between scenes where an asset ID changed; resolved it by routing inter-level communication through a small save-state manager keyed on stable IDs.

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
