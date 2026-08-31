---
layout: project
name: Nestra
image: /assets/image/projects/nestra.svg
description: A Coding Agent Orchestrator — one place to manage providers, models, agents, and routing, with Direct/Routed modes, role-based routing policies, and automatic failover across coding agents.
category: Tool
status: "2026"
tags: [Tauri 2, Rust, React 19, TypeScript, SQLite]
external_links:
  - {
      name: "Source",
      url: "https://github.com/Nuo27/Nestra",
      icon: "github",
      prefix: "fab",
    }
  - {
      name: "Releases",
      url: "https://github.com/Nuo27/Nestra/releases",
      icon: "download",
    }
---

## Overview

I built Nestra because I was tired of manually switching between providers, models, and agent configurations. It is a **Coding Agent Orchestrator** — one place to manage providers, API keys, models, agents, skills, MCP servers, sessions, and routing. It manages coding agents and, instead of only rewriting a config file, runs a live local gateway that proxies the traffic itself — on-the-fly translation between wire protocols, per-role routing and failover handling.

## Role

Solo Developer — Rust backend, React / TypeScript frontend, design system, and build / release.

## Features

- **One control plane for five coding agents.** Claude Code, OpenCode, Pi, ZCode, and Codex are detected automatically at launch; providers, API keys, models, endpoints, skills, MCP servers, and sessions are all managed from one app.
- **Provider management.** Presets or fully custom endpoints, keys validated on save and encrypted at rest (AES-256-GCM), model selection with per-endpoint ability overrides.
- **Direct / Routed modes.** Per-agent switch: _Direct_ writes the chosen provider straight into the agent's configuration; _Routed_ points the agent at a stable local gateway endpoint (`127.0.0.1:18777`) instead.
- **Routing with failover.** In Routed mode each request is resolved through an ordered cascade — explicit pin, task affinity, role policy, fail closed. Role policies hold ordered `(endpoint, model)` chains per `(agent, role)`, so when a provider hits its quota or a model fails, Nestra moves to the next configured target instead of interrupting the task.
- **Live activity and session history.** Every routed request appears in Activity with its route, model, and token usage, linked to its task; imported session history adds context-pressure estimates and handoff artifacts.
- **Skills & MCP sync.** Per-agent skill and MCP configuration, managed and synced from Nestra.

## Technical Challenges

- **A router I deliberately didn't want to build.** The first design was a pure configurator — write a provider into each agent's config and step out of the way. That held until real usage needed _multi-model coverage_: one agent spanning providers to dodge quota windows, a sub-agent pinned to a cheaper model, a fallback when an endpoint starts 429ing. None of that is expressible in a static config file, so the local gateway stopped being optional. The decision was to make the gateway the actual product (Routed mode) and keep Direct mode as the simple, no-proxy path — rather than half-bolt routing onto the configurator and end up with two incomplete implementations.

- **Translating three wire protocols on the fly.** Once traffic flows through the gateway, forwarding stops being literal. Claude Code speaks Anthropic Messages; OpenCode and Pi speak OpenAI Chat Completions; the Responses API is a third dialect; and a dual-protocol endpoint like OpenRouter accepts more than one. The gateway converts between them per request — reshape the body across schemas, re-stream the response chunk-by-chunk so the agent's SSE parser never stalls, rewrite the resolved model id and the usage / cache accounting so each agent sees one consistent upstream, and pick the right wire per (endpoint, model) instead of forcing a single protocol. The agent never learns it isn't talking to the real provider.

- **Failover that admits when a turn was broken.** When a provider exhausts quota mid-task the router migrates to a fallback while preserving the `task_id`, but it stamps `generation_broken` honestly instead of dressing the retry up as a seamless continuation. The agent is told the truth — this turn resumed on a different provider and the prompt cache didn't carry — because routing that lies about interruptions is worse than no routing at all.

---

{% capture carousel_images %}
/assets/image/projects/nestra-1.png
/assets/image/projects/nestra-2.png
/assets/image/projects/nestra-3.png
/assets/image/projects/nestra-4.png
{% endcapture %}
{% include elements/carousel.html %}
