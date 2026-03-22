---
title: Learn TTPs
date: 2026-03-09
description: An Anki-style spaced repetition flashcard web app for mastering the MITRE ATT&CK framework (techniques, tactics, and mitigations) entirely in a static website.
tags: [Web App, MITRE ATT&CK]
links:
  - label: Repository
    url: https://github.com/0xhmza/learn-ttps
    icon: github
  - label: Live Demo
    url: https://0xhmza.github.io/Learn-TTPs
    icon: external
---

The attack surface has never been more restless. Threat vectors evolve faster than most teams can track, which means a security analyst today has to do two things at once: stay current with emerging techniques, and never forget the old ones. That dual awareness matters more than it might seem. A single uninformed decision, enabling an unsigned driver, re-activating a deprecated Windows feature, can open the door to [Living Off the Land](https://lolbas-project.github.io/) abuse that a well-prepared attacker will exploit without hesitation. Knowing the landscape, deeply and durably, is not optional.

## The idea

I'd been using [Anki](https://apps.ankiweb.net/) for years: university coursework, language learning, anything that required things to actually stick. The mechanism is almost deceptively simple: show you a card right before you'd forget it, and no sooner. It sounds underwhelming until you realise that, done consistently, it moves a piece of knowledge from *"I've read this"* to *"I know this"*, and keeps it there with surprisingly little daily effort.

**Learn TTPs** applies that same logic to the MITRE ATT&CK framework. It's an Anki-style spaced repetition flashcard app, built as a fully static website with the help of Claude Code, loading its content directly from the ATT&CK dataset.

## What it covers

Two decks:

- **Techniques**: the full enterprise ATT&CK technique and sub-technique list, grouped by tactic (Initial Access, Execution, Persistence, Privilege Escalation, and so on). Each card presents the technique name and asks you to recall what it does, how it works, and which platforms it targets.
- **Mitigations**: the countermeasures and defensive controls that map back to those techniques. Because knowing the attack is only half the picture.

The scheduler runs the SM-2 algorithm, the same one Anki uses. Cards you struggle with come back quickly. Cards you answer confidently start appearing less often. Over time, your daily queue shrinks to exactly what needs reinforcing, rather than everything at once.