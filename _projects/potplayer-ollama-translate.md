---
layout: project
name: PotPlayer Ollama Translate
# image: /assets/image/projects/potplayer-ollama-translate.png   # TODO: drop a 1280×800 screenshot here, then uncomment
description: Real-time PotPlayer subtitle translation plugin (Angel Script) built around a three-slot prompt template, a rolling bilingual context history, and a provider-agnostic request pipeline for Ollama, LM Studio, and OpenAI- and Anthropic-compatible APIs.
category: Tool
status: "2025"
tags:
  [
    Angel Script,
    Ollama,
    OpenAI API,
    PotPlayer,
    Prompt Engineering,
    Context Engineering,
    Open Source,
  ]
external_links:
  - {
      name: "Source",
      url: "https://github.com/Nuo27/Potplayer-Ollama-Translate",
      icon: "github",
      prefix: "fab",
    }
  - {
      name: "Releases",
      url: "https://github.com/Nuo27/Potplayer-Ollama-Translate/releases",
      icon: "download",
    }
---

**PotPlayer Ollama Translate** is a real-time subtitle-translation plugin for PotPlayer, written in Angel Script. It sends each subtitle line to a local or cloud LLM through a custom three-slot prompt template and a rolling bilingual context history, and renders the translation alongside the original so you can watch content in any language without leaving the player. The v3 rewrite builds on v1 with a fully redesigned prompt and context system, a provider-agnostic pipeline, and supports Ollama (native and Cloud), LM Studio REST, and OpenAI- and Anthropic-compatible endpoints.

## Role

Solo Developer

## Contributions

- Built **real-time subtitle translation** inside PotPlayer's extension model — each subtitle line is sent to an LLM, translated on the fly, and rendered next to the original.
- Wrote a **multi-provider API abstraction** that feeds the same prompt + context through four protocols (Ollama native, LM Studio REST, OpenAI-compatible, Anthropic-compatible), switchable via a single `apiFormat` field rather than four parallel implementations.
- Designed a **rolling bilingual context history**: every line is stored as `source ⇒ translation` and the most recent N entries are re-injected on the next request, so the model uses its own prior output as a style and term anchor instead of translating each line in isolation.
- Built a **three-slot prompt-template system** (`systemPrompt` / `userPrompt` / `contextPrompt`) with placeholder variables for source language, target language, the current line, and the optional context block — so translation behavior is shaped by editing prompts, not translation logic.

## Technical Challenges

- **Prompt design in an embedded scripting host.** PotPlayer extensions run in Angel Script with no real client-side tooling, so almost all of the translation behavior lives in the prompt — disallowing explanations, forbidding the model from translating the context block, enforcing single-line output, and preserving names/numbers/code are rules baked into `systemPrompt` rather than enforced by the client.
- **Context as a two-axis knob.** Real-time translation is a latency-vs-quality dial, not a toggle: `contextCount` controls how many prior lines are sent per request, `contextMaxSize` controls how many the buffer keeps; the two are deliberately separate, so a user with a small local model can shrink per-request payload without losing long-window coherence.
- **Bilingual history as a style anchor.** Storing `source ⇒ translation` (rather than source only) gives the model its own previous output to mimic, which stabilizes tone, register, and term choice across a scene; the trade is a few extra tokens per request, paid back several times over in consistency.
- **Provider isolation so prompts stay single-source.** Four API formats expect four request shapes; by keeping request construction as a thin builder and prompt/context assembly above it, every new backend is a builder, not a prompt rewrite.

## Lessons Learned

- The v1→v3 rewrite's real leverage was the prompt and context system, not the API plumbing — the moment translation behavior moved into editable templates, the plugin stopped being "Ollama with extras" and became a general LLM translator.
- Bilingual rolling context was a small change with an outsized effect; exposing `contextCount` and `contextPrompt` to the user (not just `temperature`) turned the plugin from "configure the model" into "configure the translation".
- Building provider support as a single `apiFormat` switch from the start — instead of an Ollama-only plugin later retrofitted for "other APIs" — made every additional backend a config change rather than a rewrite.

---

Source: [GitHub](https://github.com/Nuo27/Potplayer-Ollama-Translate) · Releases: [latest](https://github.com/Nuo27/Potplayer-Ollama-Translate/releases)
