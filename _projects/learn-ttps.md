---
title: Learn TTPs
date: 2026-03-09
description: An Anki-style spaced repetition flashcard app for mastering the MITRE ATT&CK framework — techniques, tactics, and mitigations — entirely in a static website.
---

<a href="https://github.com/0xhmza/learn-ttps"
   style="font-family:'Noto Sans', system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif;
          font-weight:200; font-size:0.85rem; text-decoration:none;">
   <span style="text-decoration:underline; text-underline-offset:2px; text-decoration-color:#c9cdd3;">
    Repository: github.com/0xhmza/learn-ttps
  </span>
</a>

Somewhere between reading a threat intel report and actually *understanding* it, there's a gap. A gap filled with acronyms you half-recognise, technique IDs you've seen before but can't quite place, and mitigation names that blur together after the third one. The MITRE ATT&CK framework is one of the most valuable resources in security — and one of the most quietly overwhelming.

The problem isn't that ATT&CK is hard. It's that it's *large*, it's *alive*, and it *keeps growing*. Every six months a new version ships. Techniques get updated. New sub-techniques appear. Real-world adversary behaviour gets codified and added to the matrix. Keeping up isn't a one-time effort — it's a habit. And habits need the right tools.

---

## The idea

I'd been using [Anki](https://apps.ankiweb.net/) for a while for language learning, and the mechanism is almost deceptively simple: show you a card right before you'd forget it, and no sooner. It sounds underwhelming until you realise that, done consistently, it takes a piece of knowledge from *"I've read this"* to *"I know this"* — and keeps it there with surprisingly little daily effort.

So the question became: what if TTPs worked the same way?

What if instead of passively skimming the ATT&CK matrix with good intentions, you drilled individual techniques — their IDs, their descriptions, the tactics they belong to — until they stopped being trivia and started being instinct? Until seeing *T1059.001* in a log immediately surfaced *PowerShell execution, likely obfuscated command line*, not a vague feeling that you once read something about that?

That's what **Learn TTPs** is. An Anki-style spaced repetition flashcard app, built as a fully static website, loaded directly from the MITRE ATT&CK dataset.

---

## What it covers

Two decks:

- **Techniques** — the full enterprise ATT&CK technique and sub-technique list, grouped by tactic (Initial Access, Execution, Persistence, Privilege Escalation, and so on). Each card shows you the technique name and asks you to recall what it is, how it works, and what platforms it targets.
- **Mitigations** — the countermeasures and defensive controls that map back to those techniques. Because knowing the attack is only half the picture.

The scheduler runs the SM-2 algorithm — the same one Anki uses. Cards rated *Again* come back quickly. Cards you nail consistently start appearing less often. Your daily queue shrinks to just what needs reinforcing, not everything at once.

---

## Why a static website

No accounts. No server. No install. No data leaving your machine. Open it in a browser, study for ten minutes, close it. Progress is stored locally in IndexedDB and persists across sessions. If you want to host it somewhere, drop the folder anywhere that can serve HTML — GitHub Pages, a USB drive, a localhost. It doesn't matter.

The whole thing is one HTML file, one CSS file, one JavaScript file, and two CSV files straight from MITRE's public dataset.

---

## Why it matters

TTPs are the language of modern security work. Red team reports are written in them. Detection rules reference them. Threat intel is structured around them. When a SOC analyst and a threat hunter are talking about the same incident, ATT&CK is the shared vocabulary that makes the conversation precise rather than approximate.

Knowing it fluently — not just knowing that it exists — shortens investigation timelines, sharpens threat models, and makes you a clearer communicator with every team you work with. It's one of those things where the return on investment compounds quietly over time.

The framework is too important to only half-know, and too large to learn passively. Spaced repetition is a reasonable answer to both problems at once.
