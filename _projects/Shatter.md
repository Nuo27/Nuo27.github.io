---
layout: project
name: Shatter
tools: [UE5, C++, Blueprint]
image: /assets/image/projects/shatter.png
description: 1v1 multiplayer movement shooter (UE5/C++) — Epic Online Services, FMOD adaptive audio.
category: Game
status: "2022"
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

<!-- TODO: Answer these — see CONTENT-SUPPLEMENT.md §1 -->

> - What was the biggest networking issue with EOS? (NAT traversal? reconnection? latency?)
> - How did you split logic between C++ and Blueprints?
> - How was the ability system architected? (4 swappable abilities)
> - How did knockback physics work? Any edge cases?

## Lessons Learned

<!-- TODO: Reflect — see CONTENT-SUPPLEMENT.md §7 -->

> - What would you do differently?
> - What did this project teach you?

---

Playable demo: [itch.io](https://k1ngslayer.itch.io/shatter)

{% capture carousel_images %}
/assets/image/projects/Shatter-1.png
/assets/image/projects/Shatter-2.png
/assets/image/projects/Shatter-3.png
{% endcapture %}
{% include elements/carousel.html %}
