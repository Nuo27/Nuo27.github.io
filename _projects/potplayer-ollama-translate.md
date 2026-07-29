---
layout: project
name: PotPlayer Ollama Translate
# image: /assets/image/projects/potplayer-ollama-translate.png   # TODO: drop a 1280×800 screenshot here, then uncomment
description: PotPlayer real-time subtitle-translation plugin (Angel Script) supporting Ollama, LM Studio, and OpenAI- and Anthropic-compatible APIs.
category: Tool
status: "2025"
tags: [Angel Script, Ollama, OpenAI API, PotPlayer]
external_links:
  - { name: "Source",   url: "https://github.com/Nuo27/Potplayer-Ollama-Translate", icon: "github", prefix: "fab" }
  - { name: "Releases", url: "https://github.com/Nuo27/Potplayer-Ollama-Translate/releases", icon: "download" }
---

**PotPlayer Ollama Translate** is a real-time subtitle-translation plugin for PotPlayer, written in Angel Script. It sends each subtitle line to a local or cloud LLM and renders the translation alongside the original, so you can watch content in any language without leaving the player. It supports Ollama (native and Cloud), LM Studio REST, and OpenAI- and Anthropic-compatible endpoints, and builds on the v1 PotPlayer_ollama_Translate with a rewritten config and prompt system.

## Role

Solo Developer

## Contributions

- Built **real-time subtitle translation** inside PotPlayer's extension model - each subtitle line is translated on the fly and displayed alongside the original.
- Wrote a **multi-provider API abstraction** supporting four protocols from one codebase: Ollama native, LM Studio REST, OpenAI-compatible, and Anthropic-compatible, switchable via a single `apiFormat` field in the `Config` class.
- Added a **context-history** mechanism that feeds prior subtitle lines back to the model so translation stays coherent across a scene, rather than translating each line in isolation.
- Designed a **prompt-template system** with variables (`{{from}}`, `{{to}}`, `{{text_to_translate}}`, `{{optional_reference_context}}`, `{{context_prompt}}`) so users can reshape the prompt without touching translation logic.
- Exposed **model selection, inference parameters, and endpoint config** through the `Config` class, with clear split between what PotPlayer's settings UI surfaces and what's edited directly in the `.as` file.

## Technical Challenges

- **Working within Angel Script.** PotPlayer extensions run in Angel Script, a statically-typed embedded language with none of the HTTP/client ergonomics of a general-purpose runtime. The plugin hand-rolls the request/response flow against that constraint, which shaped how much logic could live client-side vs be pushed into prompt engineering.
- **Auto-completing API paths per provider.** Each protocol expects a different endpoint shape (`/api/chat` for Ollama, `/v1/chat/completions` for OpenAI-compatible, etc.). Rather than make users type full URLs, the plugin takes a bare host (e.g. `http://localhost:1234`) and completes the path from `apiFormat`, so switching providers is a one-field change. These two fields (`apiFormat`, `customEndpoint`) deliberately live outside PotPlayer's login UI - they're edited in the `.as` file and take effect on next PotPlayer restart.
- **Coherent translation under real-time constraints.** Translating each line in isolation reads like a machine; sending too much context blows latency and the context window. The context-history mechanism keeps a small rolling window of prior lines as `{{optional_reference_context}}`, trading a little latency for scene-coherent output.
- **Config split between UI and file.** PotPlayer's settings panel can surface the model name and API key, but not arbitrary endpoint/format fields. Deciding what lives in the UI (the things every user sets) vs the `.as` file (the things only advanced users touch) kept the install path simple while still allowing LM Studio, OpenAI, and Anthropic backends.

## Lessons Learned

- Building provider support as an `apiFormat` switch from the start - instead of an Ollama-only plugin later retrofitted for "other APIs" - made every additional backend a config change rather than a rewrite.
- Real-time translation is a latency-vs-quality dial, not a toggle; exposing the context window and prompt template to the user let them tune that dial per machine and per model instead of hard-coding one tradeoff.

---

Source: [GitHub](https://github.com/Nuo27/Potplayer-Ollama-Translate) · Releases: [latest](https://github.com/Nuo27/Potplayer-Ollama-Translate/releases)
