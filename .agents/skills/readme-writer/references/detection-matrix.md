# Codebase Detection Matrix & Conditional Logic

This reference guides the silent inspection of the repository (Phase 1) and defines how detected files map directly to README sections, Quick Start steps, and configuration blocks.

---

## 1. Visual Assets Detection

Scan the following locations for project visual assets:
- `assets/`, `static/`, `public/`, `docs/images/`, `media/`, `screenshots/`, `.github/`

### Asset Types & Placement Rules
| Asset Type | Search Heuristic | README Rendering |
|---|---|---|
| **Logo / Icon** | `*logo*`, `*icon*`, `*brand*` (`.svg`, `.png`) | Render at top of Hero: `<img src="path/to/logo.svg" alt="Project Logo" height="64" />`. In centered heroes, wrap inside `<div align="center">`. |
| **Hero Screenshot / GIF** | `*hero*`, `*preview*`, `*demo*`, `*banner*`, `*screenshot*` (`.png`, `.gif`, `.webp`) | Render directly below hero description or subtitle: `<img src="path/to/preview.png" alt="Demo Preview" width="100%" />`. |
| **Feature Gallery** | Multiple numbered screenshots (e.g., `01-dashboard.png`, `02-settings.png`) | Place under `## Key Features` or inside a `<details><summary>View Screenshots</summary>...</details>` block. |

### Strict Fallback Rule
- **Never hallucinate image paths**: If no image files exist on disk, omit all `<img>` tags completely.
- If images are absent, advise the user in the Phase 5 terminal report where they can drop a logo or screenshot (e.g. `assets/logo.svg` or `docs/images/preview.png`) to enable visuals.

---

## 2. Docker & Containerization (4 Distinct Modes)

Examine `Dockerfile`, `docker-compose.yml`, `docker-compose.yaml`, `compose.yml`, `compose.yaml`:

### Mode A: Full-Stack Compose (App + Database/Services in Compose)
- **Signature:** `docker-compose.yml` exists and has a service that builds the local app (e.g., `build: .` or `build: ./server`), alongside backing services (e.g., `postgres`, `redis`).
- **README Strategy:**
  - If the user selected Docker as the primary Quick Start path in Round 1: Put the compose steps in `## Quick Start` and local non-Docker steps in `<details><summary>Run without Docker (Local Dev)</summary>`.
  - Otherwise: Keep local dev as `## Quick Start`, and add a dedicated `## Docker Setup` section.
- **Commands to render:**
  ```bash
  cp .env.example .env
  docker compose up --build
  ```
  List exact exposed ports parsed from `ports:` in the compose file (e.g., `http://localhost:3000`). Include cleanup: `docker compose down` (or `docker compose down -v` to reset data volumes).

### Mode B: Infra-Only Compose (Backing Services Only)
- **Signature:** `docker-compose.yml` contains only databases, caches, or message brokers (e.g. `postgres:16`, `redis:7`), while the app itself is run on the host via package scripts (`npm run dev`, `cargo run`).
- **README Strategy:**
  - Do **NOT** create a separate `## Docker Setup` section.
  - Embed the compose command directly into Step 1 of `## Quick Start`:
    ```bash
    # 1. Start backing services
    docker compose up -d
    ```

### Mode C: Standalone Dockerfile (No Compose)
- **Signature:** A `Dockerfile` exists, but no `docker-compose.yml` or `compose.yml` is present.
- **README Strategy:**
  - Keep host runtime instructions as primary in `## Quick Start`.
  - Add a collapsible block at the end of Quick Start:
    ```markdown
    <details>
    <summary>Run with Docker</summary>

    ```bash
    docker build -t <project-name> .
    docker run -p <HOST_PORT>:<CONTAINER_PORT> --env-file .env <project-name>
    ```
    </details>
    ```
  - Parse `<CONTAINER_PORT>` from `EXPOSE` in `Dockerfile`.

### Mode D: No Docker Files
- **Signature:** No `Dockerfile` and no `compose` files anywhere in the repo.
- **Strict Rule:** Never mention Docker, containers, or compose anywhere in the README.

---

## 3. Monorepos & Split-Repo Layouts

Detect layout by checking directory roots:

| Structure | Signatures | README Quick Start Strategy |
|---|---|---|
| **Flat Single App** | Root `package.json`, `go.mod`, `Cargo.toml`, or `pyproject.toml` | Standard 3-step Quick Start at repo root. |
| **Split Client/Server** | Root contains `client/` and `server/` (or `frontend/` and `backend/`) | Show unified setup or clear split-terminal steps. If root has parallel scripts (e.g., `npm run dev` running both), highlight the root command first. |
| **Workspace Monorepo** | `pnpm-workspace.yaml`, `lerna.json`, `turbo.json`, npm/yarn `workspaces` in root `package.json` | Mention workspace manager in prerequisites. Provide root build/dev commands (e.g., `pnpm install`, `pnpm dev --filter web`). |

---

## 4. Configuration & Secrets (.env Handling)

Check for `.env.example`, `.env.sample`, `.env.local.example`, `.env.template`:

1. **Zero-Config Repos:**
   - If no env sample files and no environment variable lookups exist in code, omit the `## Configuration` or `## Environment Variables` section entirely.
2. **Env Files Present:**
   - Always include the copy step in Quick Start:
     ```bash
     cp .env.example .env
     ```
   - In the Configuration section, categorize variables:
     - **Required Variables:** Items that must be filled before the application can start (e.g. database credentials, mandatory secret keys).
     - **Optional / Defaults:** Items with preconfigured defaults (ports, log levels, CORS origins). Place long lists inside `<details><summary>Optional environment variables</summary>...</details>` if the user chose collapsible overflow in Round 1.
   - Never display real secrets, real API keys, or live production passwords in the README.

---

## 5. Database Migrations & Seed Data

Inspect manifests and source code for database toolchains:

| Tool / ORM | Detection Clues | Quick Start Integration Step |
|---|---|---|
| **Prisma** | `prisma/schema.prisma` | `npx prisma migrate dev` (or `npx prisma db push`), plus `npx prisma db seed` if seed script is configured in `package.json`. |
| **Drizzle** | `drizzle.config.ts`, `drizzle/` | `npx drizzle-kit migrate` (or `npm run db:migrate`). |
| **Knex / TypeORM / Sequelize** | Migration directories or npm scripts | Include `npm run migrate` or equivalent. |
| **SQL Scripts** | `init.sql`, `schema.sql`, `seed.sql` | Note execution via docker volume mount or direct database client command. |

Embed the migration or seed command as a dedicated, ordered numbered step in `## Quick Start` between copying `.env` and starting the dev server.

---

## 6. Badges Construction

Respect the user's Round 1 selection (`None`, `Minimal flat-square`, or `Standard shields`). Only construct badges backed by verified facts in the repo:

### Minimal Flat-Square Style (Default)
Clean, low-contrast, neutral styling:
- **Format:** `https://img.shields.io/badge/<LABEL>-<VALUE>-<COLOR>?style=flat-square`
- **Recommended Badges (Max 3–4):**
  1. **License:** Parse from `LICENSE` or package manifest:
     `![License](https://img.shields.io/badge/license-MIT-blue?style=flat-square)`
  2. **Runtime / Language:** Parse from `package.json` `"engines"`, `.nvmrc`, `go.mod`, `rust-toolchain`:
     `![Node](https://img.shields.io/badge/node-%3E%3D20-informational?style=flat-square)`
  3. **Build / CI Status:** Only if `.github/workflows/*.yml` exists:
     `![Build Status](https://img.shields.io/badge/build-passing-brightgreen?style=flat-square)`
  4. **Release / Version:** Only if semantic versioning or tagged releases exist:
     `![Version](https://img.shields.io/badge/version-1.0.0-blue?style=flat-square)`

### Standard Shields Style
Use standard colored shields without the `?style=flat-square` query param.

### None
Omit badge markup entirely.

---

## 7. Project Archetype Swaps

Adapt the Quick Start instructions and usage section to match the project archetype:

### A. Web Applications & Full-Stack Apps
- **Prerequisites:** Runtime (Node.js, Python, etc.), package manager, DB.
- **Port Output:** Mention local URL (e.g. `http://localhost:3000`).
- **Workflow:** Install -> Config -> Migrate/Seed -> Run dev server -> Open browser.

### B. Backend APIs & Microservices
- **Prerequisites:** Runtime, DB/cache.
- **Port Output:** Base API URL (e.g. `http://localhost:8080/api/v1`).
- **Health Verification:** Include a concrete `curl` verification command in Quick Start:
  ```bash
  curl -s http://localhost:8080/health
  ```
- **Endpoints Reference:** Provide a compact route table or link to Swagger/OpenAPI docs (`/docs` or `openapi.yaml`).

### C. CLI Tools & Developer Libraries
- **No localhost URLs:** Never tell users to open a browser for a CLI or package.
- **Quick Start Structure:**
  - Global or local installation (`npm install -g <pkg>` or `cargo install --path .`).
  - Example command run with flags:
    ```bash
    my-tool analyze --path ./src --format json
    ```
  - Options/Flags table explaining common CLI arguments.

### D. Local-First, Desktop & Game Projects
- **Prerequisites:** Platform-specific toolchains (SDL, Electron, Tauri, Rust, etc.).
- **Quick Start Structure:**
  - Build command (`cargo run --release`, `npm run tauri dev`).
  - Controls / Keybindings or local data storage directory locations (e.g., `~/.config/app/`).
