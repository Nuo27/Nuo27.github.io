---
layout: project
name: Shatter
tags: [UE5, C++, Blueprint, Student Work]
image: /assets/image/projects/shatter.png
description: 1v1 multiplayer movement shooter (UE5/C++) - Epic Online Services, FMOD adaptive audio.
category: Game
status: "2022"
external_links:
  - { name: "Live Demo", url: "https://k1ngslayer.itch.io/shatter", icon: "external-link-alt" }
---

**Shatter** is a high-octane 1v1 movement shooter developed in **Unreal Engine 5** for UTS Game Design Studio II. Players wield a coin in one hand and a revolver in the other - toss the coin, shoot it mid-air. Four hot-swappable abilities combined with a knockback multiplier system create fast-paced, physics-driven combat. First to five points wins.

## Role

Gameplay Programmer

## Contributions

- Implemented online multiplayer networking via **Epic Online Services** using C++ and Blueprints
- Built ability systems, knockback mechanics, scoring, and game mode logic
- Integrated adaptive audio middleware (**FMOD**) in collaboration with UTS music students

## Technical Challenges

- **EOS P2P networking with resilient sessions.** Built on Epic Online Services (OnlineSubsystem EOS) as a 1v1 listen-server topology. The hard part was session discovery and recovering from a dropped peer - I treated each match as a resilient session and rebuilt voice + combat state from a snapshot on reconnect, so a brief disconnect didn't end the round.
- **C++ / Blueprint split for speed without sprawl.** Simulation, replication (`UPROPERTY(Replicated)` + `OnRep_` callbacks), and performance-critical paths lived in C++; designer-facing tuning - ability cooldowns, FX hooks, feel - stayed in Blueprints, so iteration stayed fast for designers without the core simulation leaking into asset graphs.
- **Hot-swappable ability components over a shared resource layer.** The four abilities were a small set of base component classes that could be swapped at runtime, all funnelling through one shared cooldown + resource manager, so abilities could mix without bespoke wiring per pairing.
- **Deterministic knockback via fixed-timestep impulses.** Knockback was applied as a physics impulse on a fixed timestep so both clients agreed on trajectory; the edge case was stacked mid-air impulses, which I clamped so players couldn't be launched out of bounds - keeping the knockback multiplier system fair.

## Lessons Learned

- Collaboration with non-programmer teammates (audio designers using FMOD) went much smoother once the integration points were documented upfront - would formalize that contract earlier on future projects.
- The biggest takeaway was that shipping a small, polished feature beats a large, half-finished one; the four-ability kit with tight feel shipped stronger than an eight-ability draft would have.

---

Playable demo: [itch.io](https://k1ngslayer.itch.io/shatter)

{% capture carousel_images %}
/assets/image/projects/Shatter-1.png
/assets/image/projects/Shatter-2.png
/assets/image/projects/Shatter-3.png
{% endcapture %}
{% include elements/carousel.html %}
