---
layout: project
name: Wistful
tags: [C#, Unity, UI Toolkit, Student Work]
image: /assets/image/projects/wistful.png
description: Unity UI Toolkit, HUD, and interaction systems for a 3D low-poly exploration puzzle game — selected for the 2022 UTS Tech Festival.
category: Game
status: "2022"
external_links:
  - {
      name: "Live Demo",
      url: "https://k1ngslayer.itch.io/wistful-group-6",
      icon: "external-link-alt",
    }
  - {
      name: "Source",
      url: "https://github.com/SpazyPear/Wistful",
      icon: "github",
      prefix: "fab",
    }
---

**Wistful** is a 3D low-poly exploration puzzle game set against the suffocating void of space. Players control a child astronaut navigating atmospheric sci-fi environments, solving environmental puzzles to progress through interconnected levels. My role covered the gameplay HUD, interaction prompts, and UI feedback built in Unity UI Toolkit, with reusableUI components authored.

## Role

UI & Interaction Programmer (same team and role as [Shatter](/portfolio/shatter))

## Contributions

- Built the **gameplay UI and interaction system** — HUD, menus, pause, end-of-level, and in-world interactable prompts.
- Authored the project's UI component library (panels, buttons, focus rings), reused across every screen so the visual language stayed consistent.
- Built the **interaction prompt framework** the rest of the team dropped interactables into, so adding a new object that needed a prompt was a one-component job, not a new UI hook.
- Integrated UI feedback into the puzzle-completion flow so visual confirmation fired at the same beat as the underlying state change.

## Technical Challenges

- **Reusable UI components over one-off screens.** Every screen authored against templates, with a small base class for lifecycle hooks; adding a new menu was a prefab, not a fresh design pass.
- **Interaction prompts that read across environments.** The game moves through different environment and levels; routing prompts through an event entry rather than a per-frame transform read kept legibility stable as backdrops changed.
- **Reading feedback under low-poly constraints.** With a deliberately minimal art style, the UI carried more of the atmosphere; a constrained palette and a small set of feedback motifs kept screens feeling part of the world, not bolted on.

## Lessons Learned

- Authoring UI components up front paid off the same way a design system does — once the components existed, every new screen was an assembly job and the visual language stopped drifting.
- Treating interaction as a framework event (focus / unfocus / state-change) rather than a per-object script scaled better than wiring each interactable to its own UI hook.

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
