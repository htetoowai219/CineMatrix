# README Markdown Templates & Variant Snippets

This reference provides three production-grade, human-voiced README templates and reusable layout snippets. Every template enforces plain vocabulary, zero AI clichés, concrete mechanics, and immediate Quick Start access.

---

## 1. Template 1 — Casual (Hobby / Personal Tool)

Use for personal utilities, scripts, side projects, and developer conveniences.  
*Target length: ~80–140 lines.*

```markdown
<div align="center">
  <img src="assets/logo.svg" alt="Project Logo" height="64" />
  <h1>project-name</h1>
  <p>A concise one-line summary in plain English without buzzwords.</p>
  <p>
    <a href="https://github.com/username/project/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue?style=flat-square" alt="License" /></a>
  </p>
</div>

## Quick Start

### Prerequisites
- Node.js 20+
- Git

### Installation & Run
```bash
# 1. Clone the repository
git clone https://github.com/username/project.git
cd project

# 2. Install dependencies
npm install

# 3. Configure environment
cp .env.example .env

# 4. Run the app
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Why I Built This
<!-- Optional: 2-3 sentences explaining the original itch or problem -->
I needed a simple way to convert local markdown notes into clean slides without launching a heavy presentation suite. Existing tools required too many config files, so I built a single-binary watcher that reloads in the browser.

## What It Does
- Converts single Markdown files into HTML slide decks on save.
- Bundles syntax highlighting locally without external CDN requests.
- Exports standalone `.html` bundles ready for hosting on GitHub Pages.

## Configuration
Copy `.env.example` to `.env` and adjust if needed:
| Variable | Default | Purpose |
|---|---|---|
| `PORT` | `3000` | Local HTTP server port |
| `WATCH_DIR` | `./notes` | Directory monitored for markdown changes |

## License
MIT. See `LICENSE` for details.
```

---

## 2. Template 2 — Technical (Hackathon / Serious Showcase)

Use for portfolio centerpieces, hackathon winners, and full-stack showcases where architectural decisions matter.  
*Target length: ~120–200 lines.*

```markdown
<div align="center">
  <img src="assets/logo.svg" alt="Project Logo" height="64" />
  <h1>project-name</h1>
  <p>Real-time collaborative whiteboard that syncs vector paths across browsers using WebSockets and CRDTs.</p>
  <p>
    <a href="https://demo.example.com"><b>Live Demo</b></a> •
    <a href="https://youtu.be/demo"><b>Video Walkthrough</b></a>
  </p>
  <p>
    <a href="https://github.com/username/project/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue?style=flat-square" alt="License" /></a>
    <img src="https://img.shields.io/badge/node-%3E%3D20-informational?style=flat-square" alt="Node" />
  </p>
  <img src="docs/images/preview.png" alt="Demo Preview" width="100%" />
</div>

## Quick Start

### Prerequisites
- Docker & Docker Compose
- Node.js 20+

### Setup
```bash
# 1. Clone and enter directory
git clone https://github.com/username/project.git
cd project

# 2. Start backing services (Redis + Postgres)
docker compose up -d

# 3. Install dependencies and set environment
npm install
cp .env.example .env

# 4. Run migrations and seed test data
npm run db:migrate
npm run db:seed

# 5. Start dev server
npm run dev
```

App runs on [http://localhost:3000](http://localhost:3000).  
Log in with the seeded reviewer account: `reviewer@example.com` / `password123`.

## Key Features
- **Concurrent Canvas Sync:** Canvas operations serialize into conflict-free replicated data types (CRDTs), resolving draw order without central locking.
- **Room Partitions:** State broadcasts only to clients sharing an active canvas room token.
- **Offline Recovery:** Mutations buffer in IndexedDB and flush automatically when the WebSocket reconnects.

## How It Works
Client canvas strokes emit binary patches over WebSockets to a Node.js gateway. The gateway validates token signatures, forwards patches to Redis Pub/Sub channels keyed by room ID, and writes snapshots every 30 seconds to PostgreSQL.

```text
[Browser Canvas] <--WebSocket--> [Node.js Gateway] <--Pub/Sub--> [Redis Cluster]
                                         |
                                (Periodic Snapshot)
                                         v
                                   [PostgreSQL]
```

### Engineering Trade-Offs
- **In-memory Room Routing:** Room membership stays in Redis memory rather than SQL tables to keep join latency under 5ms.
- **Lossy Cursor Broadcasts:** Cursor hover coordinates drop on network congestion; only stroke geometry undergoes guaranteed delivery.

## Configuration
| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `REDIS_URL` | Yes | Redis host and port for Pub/Sub |
| `PORT` | No | Server listen port (default: `3000`) |

## Common Commands
```bash
npm run test         # Run unit and integration tests
npm run lint         # Check TypeScript and style conventions
npm run build        # Build production client and server bundles
```

## License
MIT. See `LICENSE` for details.
```

---

## 3. Template 3 — Detailed (Production / Commercial System)

Use for production applications, team repositories, or client deliverables requiring unambiguous operational guidance.  
*Target length: ~160–260 lines.*

```markdown
<div align="center">
  <img src="assets/logo.svg" alt="Project Logo" height="64" />
  <h1>project-name</h1>
  <p>Order processing and invoice settlement pipeline with asynchronous reconciliation.</p>
  <p>
    <a href="https://github.com/org/project/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-Apache--2.0-blue?style=flat-square" alt="License" /></a>
    <img src="https://img.shields.io/badge/build-passing-brightgreen?style=flat-square" alt="Build" />
    <img src="https://img.shields.io/badge/node-%3E%3D20-informational?style=flat-square" alt="Node" />
  </p>
</div>

## Quick Start

### 1. Prerequisites
- Docker 24+ and Docker Compose v2+
- Node.js 20 LTS (if running outside containers)

### 2. Local Environment Setup
```bash
# Clone repository
git clone git@github.com:org/project.git
cd project

# Copy environment variables
cp .env.example .env

# Boot application and backing infrastructure
docker compose up --build -d

# Verify health
curl -s http://localhost:8080/health
```

The API will be available at [http://localhost:8080](http://localhost:8080).

<details>
<summary>Running without Docker (Local Host)</summary>

```bash
# Start database and queue services only
docker compose up -d postgres redis

# Install dependencies and migrate
npm install
npx prisma migrate dev

# Run application
npm run dev
```
</details>

## Architecture Overview

| Component | Technology | Responsibility |
|---|---|---|
| **API Gateway** | Express / TypeScript | Authentication, rate limiting, request validation |
| **Worker Queue** | BullMQ / Redis | Asynchronous payment retries and webhook dispatch |
| **Primary Store** | PostgreSQL 16 | Relational orders, ledger entries, and audit logs |

```text
[Clients] ---> [API Gateway :8080] ---> [PostgreSQL]
                      |
                 (Push Jobs)
                      v
             [BullMQ / Redis] ---> [Reconciliation Workers]
```

## Configuration

### Required Variables
| Variable | Description | Example |
|---|---|---|
| `DATABASE_URL` | Postgres connection string | `postgresql://user:pass@localhost:5432/app` |
| `REDIS_URL` | Redis instance URL | `redis://localhost:6379` |
| `JWT_SECRET` | 256-bit signing key for auth tokens | `generate-with-openssl-rand-hex-32` |

<details>
<summary>Optional Variables & Feature Flags</summary>

| Variable | Default | Description |
|---|---|---|
| `LOG_LEVEL` | `info` | Winston log output (`debug`, `info`, `warn`, `error`) |
| `PORT` | `8080` | HTTP listen port |
| `CORS_ORIGIN` | `*` | Allowed client origins |
| `RATE_LIMIT_MAX` | `100` | Max requests per IP per minute |
</details>

## Project Structure
```text
src/
├── config/       # Environment loading and typed schemas
├── modules/      # Vertical feature domains (routes, controllers, services)
├── middleware/   # Auth, error handling, rate limiting
├── workers/      # BullMQ background job processors
└── server.ts     # Process entry point and graceful shutdown
```

## Development & Testing
```bash
npm run test           # Run unit tests with Vitest
npm run test:e2e       # Run end-to-end API test suite
npm run lint           # Run ESLint and Prettier checks
```

## Operational Notes
- **Database Migrations:** Run automatically in container entrypoints during deployment. For manual migrations: `npx prisma migrate deploy`.
- **Graceful Shutdown:** SIGTERM signals wait 10 seconds for in-flight requests and background queue jobs to complete before terminating connections.
- **Health Checks:** `/health` validates database ping and Redis connectivity; `/ready` checks queue backlog depth.

## License
Apache-2.0. See `LICENSE` for details.
```

---

## 4. Formatting Variant Snippets

### A. Hero Variants

#### Centered Hero (Default)
```markdown
<div align="center">
  <img src="assets/logo.svg" alt="Project Logo" height="64" />
  <h1>project-name</h1>
  <p>One sentence explaining exactly what this software does.</p>
  <p>
    <a href="https://github.com/owner/repo/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue?style=flat-square" alt="License" /></a>
  </p>
</div>
```

#### Left-Aligned Hero
```markdown
# project-name

One sentence explaining exactly what this software does.

![License](https://img.shields.io/badge/license-MIT-blue?style=flat-square)
```

---

### B. Heading Emoji Mapping Table

Use this mapping when the user chooses `Headings only` or `Headings + features` in Round 1. If the user chooses `None`, omit all emojis.

| Section | Suggested Emoji | Rendered Heading Example |
|---|---|---|
| Quick Start | 🚀 | `## 🚀 Quick Start` |
| Key Features / What It Does | ✨ | `## ✨ Key Features` |
| How It Works / Architecture | ⚙️ | `## ⚙️ How It Works` |
| Why I Built This | 💡 | `## 💡 Why I Built This` |
| Configuration | 🔧 | `## 🔧 Configuration` |
| Docker / Deployment | 🐳 | `## 🐳 Docker Setup` |
| Common Commands / Testing | 🧪 | `## 🧪 Development & Testing` |
| Project Structure | 📁 | `## 📁 Project Structure` |
| Troubleshooting / Notes | ⚠️ | `## ⚠️ Operational Notes` |
| License | 📄 | `## 📄 License` |

*Rule:* Never place more than one emoji per heading. Never put emojis inside table headers or code blocks.

---

### C. Archetype Quick Start Swaps

#### Backend API Quick Start Block
```markdown
## Quick Start

### 1. Boot Services & Server
```bash
cp .env.example .env
npm install
npm run dev
```

### 2. Verify Health
```bash
curl -s http://localhost:8080/health
# {"status":"ok","database":"connected","uptime":14}
```

### 3. Key Endpoints
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | Service and database heartbeat |
| `POST` | `/api/v1/auth/login` | Returns session bearer token |
| `GET` | `/api/v1/items` | List records with pagination |
```

#### CLI Tool Quick Start Block
```markdown
## Quick Start

### Install
```bash
npm install -g my-cli
# or install locally from source:
git clone https://github.com/user/my-cli.git && cd my-cli && npm link
```

### Basic Usage
```bash
# Run scan on current directory
my-cli scan .

# Export report to JSON
my-cli scan ./src --output report.json --strict
```

### Common Flags
| Flag | Description | Default |
|---|---|---|
| `-p, --path` | Directory to analyze | `.` |
| `-o, --output` | Output destination file | stdout |
| `-v, --verbose` | Enable debug log output | `false` |
```
