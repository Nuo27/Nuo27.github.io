---
layout: project
name: Wistful
tools: [C#, Unity]
image: /assets/image/projects/wistful.png
description: 3D exploration puzzle game (Unity/C#) — selected for the 2022 UTS Tech Festival.
category: Game
status: "2022"
tags: [Student Work]
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

- Modeled puzzle progression as an event-bus chain, where each puzzle emitted a completion signal that other systems could subscribe to, so any future content could react to existing puzzles without hardcoding dependencies.
- Handled interconnected level data flow by keeping a lightweight save state of solved flags and triggered events that each level reads on load, which decoupled level scenes from each other while preserving continuity.
- Coordinated with the team using feature branches per mechanic with short-lived merges into a shared main line, plus a brief written convention for script naming and prefab structure so code reviews stayed fast.

## Lessons Learned

- Working on a six-person team taught me to over-communicate on small decisions — a quick message saved hours of re-integration later.
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
