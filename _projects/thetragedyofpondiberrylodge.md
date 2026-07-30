---
layout: project
name: The Tragedy of Pondiberry Lodge
tags: [C#, Unity, Student Work]
image: /assets/image/projects/pondiberry.png
description: 3D exploration detective game (Unity/C#) - lead programmer, 5-person team, five themed levels.
category: Game
status: "2022-2023"
external_links:
  - {
      name: "Live Demo",
      url: "https://nuochen.itch.io/the-tragedy-of-pondiberry-lodge",
      icon: "external-link-alt",
    }
  - {
      name: "Source",
      url: "https://github.com/Nuo27/The-Tragedy-of-Pondiberry-lodge",
      icon: "github",
      prefix: "fab",
    }
---

**The Tragedy of Pondiberry Lodge** is a 3D exploration detective game developed in Unity as the final project for UTS Game Design. Players explore a mysterious house, uncovering clues and solving environmental puzzles across five themed levels to uncover its secret and escape.

## Role

Team Leader & Lead Programmer (5-person team)

## Contributions

- Architected the complete game system: core gameplay loop, interaction framework, UI, and level progression
- Designed and built the tutorial level and first main level / level template
- Managed team coordination, task assignment, and code integration across all five levels
- Implemented all game logic as the sole programmer on the team

## Technical Challenges

- **Polymorphic interaction framework for designer extensibility.** Every interactable (doors, drawers, keys) derived from a shared base with virtual hooks; player input dispatched polymorphically to whichever was in range. A new interactable was a subclass dropped into a scene, with no core code changes.
- **Build-order level progression.** Each level's completion tracked as a static flag and the active level resolved by scene build index; the next level gated on the previous one's objective — a minimal, predictable unlock model across all five levels.
- **Context-sensitive prompts in trigger zones.** A prompt manager surfaced the right action hint on trigger enter/exit for whichever interactable the player was facing, so the interaction target was always unambiguous.
- **Cross-scene state on stable IDs.** The hardest bug was a stale Unity reference after an asset's instance ID changed between scenes; inter-level state routed through a small manager keyed on stable string IDs instead of object references.

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
