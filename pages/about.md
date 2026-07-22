---
layout: about
title: About
permalink: /about/
weight: 1

# ── 01 · Intro ──
intro:
  eyebrow: "01"
  title: About
  heading_tag: h1
  prompt: true
  paragraphs:
    - text: >-
        I’m **Nuo Chen** — a gameplay programmer who works across both major engines:
        **Unity (C#)** and **Unreal Engine 5 (C++)**. I specialize in multiplayer
        networking, combat systems, and gameplay architecture, with shipped experience
        ranging from 1v1 online shooters to LAN card games.
    - text: >-
        I’ve operated at both ends of the scale — as lead programmer coordinating five-
        and six-person teams (architecture, code integration, cross-level consistency),
        and as a solo developer building entire games end-to-end. This range is
        deliberate: I want to understand how games work at every layer, from the network
        packet to the player experience.
    - text: >-
        My Data Analytics minor shapes how I approach systems — I break down complex
        mechanics methodically, whether that’s a game economy, a networking pipeline, or
        a player behavior dataset. Outside of code, I study why great games _feel_ great
        to play, pick up new languages (human and programming), and prototype my next
        mechanic.
    # Origin story placeholder — see CONTENT-SUPPLEMENT.md §2
    - text: >-
        Origin story: How did you get into game development? First game, first line of
        code, the “aha” moment.
      placeholder: true

# ── 02 · Currently ──
currently:
  eyebrow: "02"
  title: Currently
  items:
    - { label: LEARNING, value: "e.g. UE5 Gameplay Ability System",  placeholder: true }
    - { label: BUILDING, value: "current prototype or project",      placeholder: true }
    - { label: PLAYING,  value: "game + what you're studying about it", placeholder: true }
    - { label: READING,  value: "book / article / paper",            placeholder: true }

# ── 03 · Skills ──
skills:
  eyebrow: "03"
  title: Skills
  items:
    - Gameplay Programming (C# / C++)
    - Multiplayer Networking (Mirror, EOS)
    - Unity 3D Engine Development
    - Unreal Engine 5 / Blueprints
    - Game Systems Architecture
    - UI/HUD Implementation
    - FMOD Audio Integration
    - Version Control (Git)
    - iOS Development (Swift)
    - Data Analytics (Python, SQL)

skills_detailed:
  programming:
    title: Programming Languages
    items: [C#, C++, Python, Java, Swift, SQL]
  tools:
    title: Tools & Technologies
    items: [Unity 3D, Unreal Engine 5, Git & GitHub, FMOD, iOS / Xcode, Mirror Networking]

# ── 04 · Experience ──
experience:
  eyebrow: "04"
  title: Experience
  items:
    - title: "Lead Programmer — The Tragedy of Pondiberry Lodge"
      from: 2022
      to: 2023
      description: >-
        Led programming for a 3D exploration detective game (Unity, C#) in a
        five-person team. Architected the complete game system — gameplay loop,
        interaction framework, UI, and progression across five themed levels.
        Designed and built the tutorial and first level while managing team
        coordination and code integration.
    - title: "Gameplay Programmer — Shatter (UE5 Multiplayer)"
      from: 2022
      to: 2022
      description: >-
        Built a 1v1 movement shooter in Unreal Engine 5 (C++ / Blueprints) for Game
        Design Studio II. Implemented online multiplayer via Epic Online Services,
        ability and knockback systems, and integrated adaptive FMOD audio in
        collaboration with UTS music students.
    - title: "Indie Game Developer — Solo & Collaborative Projects"
      from: 2023
      to: present
      description: >-
        Independently developing original game titles post-graduation, including a
        LAN-based multiplayer card game on the Mirror networking framework (3-month
        solo build). Currently exploring systems-driven design, engine tooling, and
        procedural generation across new prototypes.

# ── 05 · Education ──
education:
  eyebrow: "05"
  title: Education
  items:
    - qualification: "B.Sc. Game Development"
      institution: "UTS, Sydney"
      from: 2020
      to: 2023
      description: >-
        Graduated with a Bachelor of Science majoring in Game Development, minor in
        Data Analytics. Coursework included Game Design Studio I & II, iOS App
        Development, and Data Structures. Shipped four game projects across Unity
        (C#) and Unreal Engine 5 (C++). “Wistful” was selected for presentation at
        the 2022 UTS Tech Festival.

# ── 06 · Languages ──
languages:
  eyebrow: "06"
  title: Languages
  note: "// Connecting across CN/EN/JP/KR game dev communities & documentation"
  items:
    - { name: Mandarin,  level: Native }
    - { name: Cantonese, level: Native }
    - { name: English,   level: Fluent }
    - { name: Japanese,  level: Basic }
    - { name: Korean,    level: Basic }

# ── 07 · Recommendations ──
testimonials:
  eyebrow: "07"
  title: Recommendations
  items:
    # See CONTENT-SUPPLEMENT.md §8
    - quote: >-
        Recommendation quote — ask a teammate from Pondiberry Lodge or Shatter, or a
        UTS professor.
      author: "Name, Role / Relationship"
      placeholder: true

# ── 08 · Contact ──
contact:
  eyebrow: "08"
  title: Contact
  blurb: "Open to gameplay programming roles and collaboration on interesting projects."
---

<!-- Content-driven page. Body is intentionally empty; _layouts/about.html composes the sections. -->
