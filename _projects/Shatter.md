---
layout: project
name: Shatter
tools: [UE5, C++, Blueprint]
image: /assets/image/projects/shatter.png
description: 1v1 multiplayer movement shooter (UE5/C++) — Epic Online Services, FMOD adaptive audio.
category: Game
status: "2022"
tags: [Student Work]
external_links:
  - { name: "Live Demo", url: "https://k1ngslayer.itch.io/shatter", icon: "external-link-alt" }
---

**Shatter** is a high-octane 1v1 movement shooter developed in **Unreal Engine 5** for UTS Game Design Studio II. Players wield a coin in one hand and a revolver in the other — toss the coin, shoot it mid-air. Four hot-swappable abilities combined with a knockback multiplier system create fast-paced, physics-driven combat. First to five points wins.

## Role

Gameplay Programmer

## Contributions

- Implemented online multiplayer networking via **Epic Online Services** using C++ and Blueprints
- Built ability systems, knockback mechanics, scoring, and game mode logic
- Integrated adaptive audio middleware (**FMOD**) in collaboration with UTS music students

## Technical Challenges

- The main networking hurdle with EOS was session discovery and reconnection after a peer dropped; handled it by treating matches as resilient sessions and rebuilding voice/combat state from a snapshot on reconnect.
- Split logic with C++ owning simulation, replication, and performance-sensitive systems, while Blueprints handled designer-facing tuning like ability cooldowns and FX hooks, which kept iteration fast without polluting the core codebase.
- Architected the ability system around a small set of base components that could be hot-swapped at runtime, with a shared cooldown and resource layer so the four abilities could mix without bespoke wiring per pairing.
- Implemented knockback as an impulse applied with a fixed timestep to keep it deterministic; the main edge case was stacking impulses mid-air, which was clamped to prevent players from being launched out of bounds.

## Lessons Learned

- Collaboration with non-programmer teammates (audio designers using FMOD) went much smoother once the integration points were documented upfront — would formalize that contract earlier on future projects.
- The biggest takeaway was that shipping a small, polished feature beats a large, half-finished one; the four-ability kit with tight feel shipped stronger than an eight-ability draft would have.

---

Playable demo: [itch.io](https://k1ngslayer.itch.io/shatter)

{% capture carousel_images %}
/assets/image/projects/Shatter-1.png
/assets/image/projects/Shatter-2.png
/assets/image/projects/Shatter-3.png
{% endcapture %}
{% include elements/carousel.html %}
