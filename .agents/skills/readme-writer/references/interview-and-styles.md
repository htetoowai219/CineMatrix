# Interview Script, Formatting Options & Style Specifications

This guide governs the two-round interactive grill between the agent and the user. It defines what to audit silently before speaking, how to ask formatting choices in Round 1, how to interview for substance in Round 2 based on the selected style, and how to push back against vague or marketing copy.

---

## 1. Pre-Interview Rules: What NOT to Ask

Never ask the user for information already visible in repository files:
- **Language, runtime & package manager:** Detected from `package.json`, `pnpm-lock.yaml`, `bun.lockb`, `go.mod`, `Cargo.toml`, `pyproject.toml`, `requirements.txt`, `Gemfile`, etc.
- **Commands & Scripts:** Detected from `package.json` `"scripts"`, `Makefile`, `Taskfile.yml`, `justfile`.
- **Ports & Environment Variables:** Detected from `.env.example`, `.env.sample`, `docker-compose.yml`, or config modules.
- **Docker Services & Images:** Detected from `Dockerfile` and `docker-compose.yml`.
- **Existing Images & Screenshots:** Detected by scanning `assets/`, `public/`, `docs/images/`, `.github/`, `screenshots/`.
- **License:** Detected from `LICENSE`, `LICENSE.md`, or package manifests.

---

## 2. Round 1 — Style, Structure & Visual Formatting Grill

### Interactive Tool First Rule
1. **Always print the 3-line disk summary first** to contextualize choices:
```text
Inspected repository:
• Detected: [Archetype & Tech, e.g. Node.js + Express + TypeScript, Docker Compose (Postgres, Redis)]
• Existing assets: [e.g. Logo found at assets/logo.svg, no screenshots found]
• Configuration: [e.g. 6 required env vars in .env.example, Prisma migration script found]
```
2. **MUST call the runtime's interactive question tool** (`ask_question` in Antigravity, `question` in OpenCode, `AskUserQuestion` in Claude Code, `request_user_input` in Codex) whenever available.
3. Pass questions in tight batches (3–4 atomic questions max per tool call) with short headers (`<= 16` chars) and the repo-recommended option listed first (marked `(Recommended)`).
4. **Fallback:** If no interactive tool is available in the runtime, output the questions as a numbered text checklist and await user reply.

### Batch 1: Core Style & Visuals (Atomic TUI Questions)

#### 1. Header: `README Style`
- `(Recommended) Technical: Focus on architecture, engineering trade-offs, and design (~120–200 lines)` *(or infer Casual/Detailed)*
- `Casual: Relaxed personal tool with quick setup and backstory (~80–140 lines)`
- `Detailed: Production system with architecture, full config, and ops notes (~160–260 lines)`

#### 2. Header: `Section Emojis`
- `(Recommended) None: Clean plain-text headings (0 emojis)`
- `Headings only: Exactly 1 tasteful emoji at the start of each ## heading`
- `Headings + features: Heading emojis plus clean icon bullets on key features`

#### 3. Header: `Hero Alignment`
- `(Recommended) Centered: Centered title, subtitle, badges, and logo`
- `Left-aligned: Standard markdown left-aligned header`

#### 4. Header: `Status Badges`
- `(Recommended) Minimal flat-square: 3–4 neutral verified badges (license, runtime, build)`
- `Standard shields: Colored shields.io badges`
- `None: No badges at all`

### Batch 2: Secondary Strategy & Setup (Atomic TUI Questions)

#### 5. Header: `Overflow Detail`
- `(Recommended) Collapsible <details>: Fold long tables, layouts, or alt commands`
- `Inline: Show all tables, trees, and commands directly in the body`
- `Link to docs/: Keep README lean and link out to separate docs/ files`

#### 6. Header: `Docker Setup` *(Only ask if Docker Compose is detected)*
- `(Recommended) Local first: Quick Start runs on host; Docker in ## Docker Setup section`
- `Docker first: Docker Compose is the primary Quick Start step`
- `Exclude Docker: Omit container instructions from README`

---

## 3. Round 2 — Style-Specific Substance Grill

After Round 1 is locked, invoke the interactive question tool with 2 to 3 atomic substance questions tailored to the chosen style. Include a `Skip / None` option on non-mandatory questions.

### Style A: `Casual` (Hobby / Personal Tool)
*Tone: Relaxed, authentic first-person developer voice.*

1. **Header: `Origin Story`**
   - `(Recommended) Include backstory: Add a 2–3 sentence ## Why I Built This section`
   - `Skip backstory: Jump straight from Quick Start to features`
2. **Header: `Usage Focus`**
   - `(Recommended) Core workflow: Highlight primary CLI command or UI interaction`
   - `All features: Even bullet points of what it does`

### Style B: `Technical` (Hackathon / Serious Showcase)
*Tone: Engineer-to-engineer; precise, direct, zero buzzwords.*

1. **Header: `Spotlight Focus`**
   - `(Recommended) Balanced: Both the problem solved and the technical architecture`
   - `Architecture first: Deep dive into internal mechanics and data flow`
   - `Problem first: Focus on why the tool was needed and user outcomes`
2. **Header: `Reviewer Demo`**
   - `(Recommended) None / Local only: Reviewers run the app locally`
   - `Include demo link: Prompt developer for live URL or video walkthrough`
3. **Header: `Roadmap Section`**
   - `(Recommended) Skip roadmap: Keep README strictly to what is built today`
   - `Include Next Up: Add a tight 3-item roadmap section`

### Style C: `Detailed` (Commercial / Production System)
*Tone: Authoritative, neutral technical documentation.*

1. **Header: `Target Audience`**
   - `(Recommended) Onboarding engineers: Focus on local dev setup and codebase structure`
   - `DevOps & SRE: Focus on container deployment, ports, and environment configs`
   - `Client / Evaluators: Balanced overview with architecture diagram`
2. **Header: `Deploy Target`**
   - `(Recommended) Docker Compose: Multi-container local/VPS deployment`
   - `Cloud PaaS: Render, Railway, Fly.io, or Heroku`
   - `Kubernetes / Cloud: Helm, AWS ECS/EKS, or GCP`

---

## 4. Pushback & Anti-Fluff Rules

1. **The Vague Answer Pushback:** If the user responds with an abstract or marketing-style answer (e.g., *"It makes data processing faster and more reliable"*), do not write buzzwords into the README. Push back once politely with a concrete prompt:  
   > *"To make that compelling to technical readers: faster than what, and how? (e.g., batch SQL queries instead of N+1 fetches, or streaming worker threads?)"*
2. **One-Round Pushback Limit:** If the user remains brief or declines deeper detail, accept their answer immediately. Never trap the user in multiple clarification turns.
3. **The Skip/Defaults Fast-Path:** If the user inputs *"skip questions"*, *"use defaults"*, or *"just generate it"*, skip Round 2 immediately and draft using sensible defaults:
   - Style: inferred from codebase archetype.
   - Emojis: `None`.
   - Hero: `Centered`.
   - Badges: `Minimal flat-square`.
   - Details: `<details>` for secondary tables.
