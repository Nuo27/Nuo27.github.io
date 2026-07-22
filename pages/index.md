---
layout: home
permalink: /

hero:
  eyebrow: "GAMEPLAY PROGRAMMER · SYDNEY, AU"
  skills: [C#, C++, UNITY, UNREAL, PYTHON]
  cta_primary:   { label: "View Projects", url: "/portfolio/" }
  cta_secondary: { label: "About Me",      url: "/about/" }

# Unified "Selected work" stream. Each entry references a collection doc by type + slug
# (slugs match _projects/ / _articles/ filenames, case-insensitive). Order = display order.
selected_works:
  - { type: project, slug: Shatter }
  - { type: article, slug: unity-vs-unreal }
  - { type: project, slug: thetragedyofpondiberrylodge }
  - { type: project, slug: wistful }
  - { type: article, slug: leading-a-game-team }
  - { type: article, slug: design-philosophy }

stream:
  kicker: "SELECTED_WORK"
  heading: "Selected work"
  labels:
    read_project: "Read case"
    read_article: "Read article"
    all_projects: "View all projects"
    all_articles: "View all articles"

cta:
  kicker: "LET’S BUILD"
  heading: "Have a system that needs to feel <em>just right</em>?"
  primary:   { label: "View Work",    url: "/portfolio/" }
  secondary: { label: "Get in touch", url: "/about/#contact" }
---

<!-- Content-driven page. Body is intentionally empty; _layouts/home.html composes the sections. -->
