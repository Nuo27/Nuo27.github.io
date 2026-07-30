---
layout: project
name: Shatter
tags: [UE5, C++, Blueprint, Student Work]
image: /assets/image/projects/shatter.png
description: 1v1 multiplayer movement shooter (UE5/C++) - Epic Online Services, FMOD adaptive audio.
category: Game
status: "2022"
external_links:
  - {
      name: "Live Demo",
      url: "https://k1ngslayer.itch.io/shatter",
      icon: "external-link-alt",
    }
---

**Shatter** is a high-octane 1v1 movement shooter developed in **Unreal Engine 5** for UTS Game Design Studio II. Players wield a coin in one hand and a revolver in the other - toss the coin, shoot it mid-air. Four hot-swappable abilities combined with a knockback multiplier system create fast-paced, physics-driven combat. First to five points wins.

## Role

**UI & Interaction Programmer** (same team and role as [Wistful](/portfolio/wistful))

Developed gameplay UI systems, interaction frameworks, and responsive visual feedback in Unreal Engine 5.

---

## Contributions

- Implemented the gameplay UI and interaction system.
- Developed a modular UI animation framework using custom lerping for reusable transitions and feedback.
- Designed and implemented the dynamic crosshair system.
- Built reusable UI components to standardize interactions and improve iteration speed.
- Collaborated with designers to integrate gameplay feedback into the HUD.

---

## Technical Challenges

- Built a reusable UI animation system upon the Unreal's default Widget Animations, enabling procedural interpolation for consistent transitions.
- Designed gameplay feedback that remained readable during high-speed movement and combat.
- Created modular interaction components to reduce duplicated Blueprint logic and simplify future UI expansion.

---

## Lessons Learned

- Fast-paced games rely heavily on clear visual feedback. Building reusable UI systems instead of one-off implementations not only improved consistency across the project but also made iteration significantly faster as development progressed.
- Because we were doing heavy final polishing just before the deadline, major merge conflicts arose that we couldn't fix in time. The primary bottleneck was caused by inconsistent and slow synchronization across team branches. As a compromise, we rolled out only the basic UI from earlier stages along with the gameplay parts, holding off on merging the refined UI and feedback systems. This was a tough learning experience for us regarding how to manage our Git workflow better next time.

---

Playable demo: [itch.io](https://k1ngslayer.itch.io/shatter)

{% capture carousel_images %}
/assets/image/projects/Shatter-1.png
/assets/image/projects/Shatter-2.png
/assets/image/projects/Shatter-3.png
{% endcapture %}
{% include elements/carousel.html %}
