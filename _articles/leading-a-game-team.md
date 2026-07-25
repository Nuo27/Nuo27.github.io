---
name: leading-a-game-team
title: "What Leading a Game Team Actually Looks Like"
description: "Lessons from being team leader and sole programmer on a 5-person student project."
tags: [Leadership, GameDev, Unity]
---

On paper, being "team leader and lead programmer" sounds glamorous. In practice, it means spending half your time in standup meetings and the other half writing code at 2 AM because someone's level script broke the build.

Here's what I learned leading **The Tragedy of Pondiberry Lodge** - a 3D exploration detective game built in Unity with a 5-person team.

## You Are Not the Best Programmer in the Room

...and that's fine. My job wasn't to write the most code - it was to make sure the code we shipped worked together. When you're the only programmer, you become the integration layer. Four teammates each build a level, and your job is to make sure the interaction system, UI framework, and progression logic hold up across all of them.

**Lesson:** Architecture decisions made in week 1 determine whether week 8 is smooth or hellish. Design your interfaces early.

## Scope Will Kill You

We planned 5 levels - a tutorial plus 4 themed levels. Each team member owned one level. Sounds clean, right?

The problem: "each member does one level" means **5 people need to understand the gameplay framework**. Documentation isn't optional. I wrote integration guides, code conventions, and scene setup walkthroughs. Not because I love writing docs - because without them, I'd be debugging 5 different interpretations of "how the door system works."

**Lesson:** When you're the systems person, your most valuable output isn't code. It's clarity.

## The Work Nobody Sees

A surprising amount of leadership is invisible:

- **Merging** - Resolving conflicts when two people edit the same prefab
- **Playtesting** - Finding the bug where Level 3's key doesn't spawn because Level 1's script ran first
- **Translation** - Explaining a programmer's constraint to a designer, and a designer's vision to a programmer (even if that programmer is also you)
- **Saying no** - "We can't add a second ending, we have 3 weeks left"

## What I'd Do Differently

1. **Smaller scope.** 5 levels was too many for a student timeline. 3 polished levels beats 5 janky ones.
2. **Earlier playtesting.** We tested individually but didn't do full playthroughs until late. Integration bugs exploded.
3. **Branch discipline.** Git merge conflicts on Unity scenes are painful. I'd enforce scene-based ownership and prefab workflows from day one.

## The Payoff

Despite the chaos, we shipped. The game had a tutorial, 4 themed levels, a complete progression system, and a cohesive narrative. It was selected as our final project submission, and the experience taught me more about software architecture and team coordination than any single course could.

Leading a team is the fastest way to level up as a developer - not because you write better code, but because you learn to think about code as a **shared artifact** that has to survive contact with other humans.
