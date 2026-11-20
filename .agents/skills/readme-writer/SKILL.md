---
name: readme-writer
description: Generates or refactors clean, prototype-first README.md files in an authentic human developer voice through codebase inspection and a structured two-round interactive grill. Use when writing a new README from scratch, overhauling an existing inconsistent README, or updating documentation after major architecture, Docker, or configuration changes. Do NOT use for authoring internal docs/ deep dives, API references, changelogs, PR summaries, or AGENTS.md files.
license: MIT
compatibility: Designed for Agent Skills-compatible tools (Claude Code, Cursor, Codex, Gemini CLI, OpenCode)
metadata:
  source: custom
  author: "how"
  version: "1.0.0"
allowed-tools:
  - read_file
  - run_command
  - write_file
  - edit_file
  - ask_question
---

# README Writer

Author and overhaul project `README.md` files through silent codebase inspection, an interactive picker-first grill, and authentic human developer voice principles.

---

## Core Principles

1. **Prototype-First:** Regardless of chosen style (`Casual`, `Technical`, `Detailed`), place `## Quick Start` directly under the Hero section. Anyone cloning the repository must reach a running instance within their first scroll.
2. **Scan Before Grilling:** Audit disk files silently before asking questions. Never ask for package managers, scripts, ports, env keys, Docker containers, or licenses that already exist in code.
3. **Evidence-Only Rule:** Every command, port, env variable, file path, badge, and Docker instruction must be verified directly from disk files or confirmed in the grill. Never invent placeholders, unverified ports, or dead image links.
4. **Preserve Human Artifacts:** When rewriting an existing `README.md`, extract and preserve live demo links, real screenshots, contributor credits, and domain notes before replacing content.

---

## Execution Workflow (5 Ordered Phases)

```text
Phase 1: Silent Audit ──> Phase 2: Round 1 Grill ──> Phase 3: Round 2 Grill ──> Phase 4: Draft ──> Phase 5: Verify & Report
  (Scan files & config)     (Style, emojis, hero)     (Substance & context)      (Template & rules)    (Links, paths & audit)
```

### Phase 1 — Silent Repo Audit
Scan the codebase using [Detection Matrix](references/detection-matrix.md):
- Map archetype: Web app, backend API, CLI tool, library, desktop, or monorepo.
- Check visual assets: Scan `assets/`, `public/`, `docs/images/`, `screenshots/` for logos or UI screenshots.
- Check containerization: Classify into Mode A (Full-stack), Mode B (Infra-only), Mode C (Dockerfile), or Mode D (No Docker).
- Parse configuration: Read `.env.example` or `.env.sample` for required vs. optional variables.
- Detect databases: Check Prisma, Drizzle, Knex, or SQL migration/seed scripts.
- Check existing `README.md`: Record live URLs, demo accounts, or custom sections to preserve.

### Phase 2 — Round 1 Grill (Style, Format & Visuals)
Load [Interview & Styles](references/interview-and-styles.md). Output a concise 3-line disk summary:
```text
Inspected repository:
• Detected: [Archetype & Tech stack, e.g., TypeScript Express API + PostgreSQL]
• Existing assets: [e.g., Logo at assets/logo.svg, no screenshots found]
• Configuration: [e.g., 5 required env vars in .env.example, Prisma migrations detected]
```

**Interactive Tool First Rule:**
- **MUST call the runtime's interactive question tool** (`ask_question` in Antigravity, `question` in OpenCode, `AskUserQuestion` in Claude Code, `request_user_input` in Codex) whenever available in the active toolset.
- Present atomic single-decision questions formatted for TUI arrow-key pickers:
  - Short header (`<= 16` chars, e.g. `README Style`, `Section Emojis`, `Hero Alignment`, `Status Badges`, `Overflow Detail`).
  - 2–4 clean options per question with the repository-recommended pick first (marked `(Recommended)`).
  - Keep questions in a tight batch (3–4 per tool call) so navigation stays snappy.
- **Fallback:** If and only if no interactive tool is present in the runtime, output a plain numbered checklist with defaults and wait for user response.

### Phase 3 — Round 2 Grill (Substance & Human Context)
Using the style selected in Round 1 (`Casual`, `Technical`, or `Detailed`), ask targeted substance questions from [Interview & Styles](references/interview-and-styles.md):
- **Interactive Picker First:** Present atomic questions with `(Recommended)` options alongside `Skip / None` or freeform inputs.
- **Casual:** Backstory inclusion (`Include short backstory` vs `Skip`), usage focus, known rough edges.
- **Technical:** Spotlight balance (`Balanced` vs `Architecture deep-dive` vs `Problem focus`), live demo links, roadmap (`Skip` vs `Include 3-item Next Up`).
- **Detailed:** Primary audience, deployment target (`Docker Compose` vs `Cloud PaaS` vs `Kubernetes`), operational gotchas.
- **Pushback Rule:** If an answer is vague or marketing copy ("faster and more robust"), push back once for concrete mechanics ("Faster than what, and how? e.g., Redis caching vs. SQLite?"). Keep follow-up to one brief message.
- **Fast-Path Rule:** If the user specifies "skip questions" or "use defaults", skip Round 2 and apply sensible defaults immediately.

### Phase 4 — Draft `README.md`
Load the target skeleton and snippets from [Templates](references/templates.md):
- Apply the user's selected archetype and hero layout (Centered vs. Left-aligned).
- Enforce the selected emoji mode strictly (`None`, `Headings only`, or `Headings + features`).
- Integrate verified Docker mode instructions and database migration/seed commands into Quick Start.
- Strictly obey the Human-Written Voice Guardrails below.

### Phase 5 — Verify & Report
1. Verify all relative links, anchor tags, commands, and port numbers match repository realities.
2. Confirm zero banned AI clichés appear in the output.
3. Verify line counts meet style targets: Casual (~80–140), Technical (~120–200), Detailed (~160–260).
4. Output a concise summary in the terminal listing created/updated files, preserved artifacts, and suggested asset locations (e.g., `assets/logo.svg`, `docs/images/preview.png`) if none were found.

---

## Human-Written Voice Guardrails

Every generated README must read like a sharp software engineer explaining their project to a colleague:
- **Plain Vocabulary & Simple Grammar:** Use short sentences, everyday engineering terms, and active voice. Avoid flowery phrasing.
- **Concrete Over Abstract:** Explain what code actually does. Write *"Locks seats in Redis for 5 minutes so two users cannot book the same seat"* instead of *"Provides robust real-time concurrency management."*
- **Strictly Banned AI Clichés:** Never use: *delve, seamless, seamlessly, robust, leverage, elevate, empower, cutting-edge, blazing-fast, comprehensive, game-changing, state-of-the-art, unleash, streamline, intuitive, modern solution, crafted with, built with passion, in today's fast-paced world, this project aims to*.
- **No Three-Adjective Stacks:** Never describe software as "a fast, modern, scalable platform." State what it does plainly in under 15 words.
- **No Throat-Clearing:** Eliminate filler intros ("In this section, we discuss...") and hollow conclusions ("Happy coding! Feel free to star the repo!").
- **Strict Emoji Compliance:**
  - `None`: Exactly 0 emojis across the entire README.
  - `Headings only`: At most 1 clean emoji at the start of each H2 heading (`## `); zero emojis inside prose, tables, badges, or code blocks.
  - `Headings + features`: 1 emoji per H2 heading plus leading icon bullets on Key Features. Never scatter multiple emojis in body sentences.

---

## Reference Routing Table

| Reference | Purpose & Contents | When to Read |
|---|---|---|
| [Interview & Styles](references/interview-and-styles.md) | Pre-interview rules, Round 1 visual checklist, Round 2 style question banks, and pushback guidelines. | Read before starting Phase 2 & Phase 3. |
| [Detection Matrix](references/detection-matrix.md) | Heuristics for visual assets, 4 Docker modes, monorepo layouts, env parsing, migrations, badges, and archetype swaps. | Read during Phase 1 silent audit and Phase 4 drafting. |
| [Templates](references/templates.md) | Markdown skeletons for Casual, Technical, and Detailed styles, hero snippets, emoji tables, and CLI/API quick-start swaps. | Read during Phase 4 drafting. |
