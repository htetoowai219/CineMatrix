# CineMatrix

A multi-tenant cinema booking and management platform built with **TypeScript, Express 5, MongoDB (Mongoose) and React 19**. One REST API serves three roles — customers, cinema owners/staff, and a platform admin — through two React applications.

## System Architecture

```text
┌──────────────────────┐        ┌──────────────────────┐
│  frontend-client     │        │  frontend-admin      │
│  React · :5173       │        │  React · :5174       │
│  moviegoers          │        │  owners/staff/admin  │
└──────────┬───────────┘        └──────────┬───────────┘
           │        HTTPS / JSON + JWT       │
           └──────────────┬─────────────────┘
                          ▼
              ┌───────────────────────┐
              │  Express 5 REST API   │
              │  TypeScript · :8000   │
              │  JWT + RBAC           │
              └───┬────────┬──────┬───┘
                  │        │      │
          ┌───────▼──┐ ┌───▼────┐ └──────────────┐
          │ MongoDB  │ │ Redis  │   Cloudinary   │
          │ source   │ │ 10-min │   images +     │
          │ of truth │ │ locks  │   receipts     │
          └──────────┘ └────────┘                │
                  │                              │
                  └──── optional: TMDB, SMTP ────┘
```

- **Stateless API** — every request carries a JWT; no server-side sessions.
- **MongoDB** stores users, movies, cinemas (with embedded room layouts), templates, screenings (with embedded seat instances), and bookings.
- **Redis** holds short-lived per-seat locks during checkout. MongoDB remains the source of truth.
- **Maintenance loop** runs every 30 seconds to release expired 10-minute seat holds. Pending bookings are left for staff or the customer to resolve.

## Tech Stack

| Layer | Technology |
| :--- | :--- |
| API | Node.js, Express 5, TypeScript (strict) |
| Database | MongoDB, Mongoose 9 |
| Auth | JWT access/refresh tokens, bcryptjs |
| Concurrency | Redis key locks (`SET NX EX`) + atomic Mongo updates |
| Files | Multer (in-memory) → Cloudinary |
| Email | Nodemailer (optional SMTP) |
| Metadata | TMDB API (optional) |
| Client | React 19, Vite 8, Zustand 5, Axios, Tailwind 4 |
| Admin | React 19, Vite 8, Zustand 5, Leaflet |
| Infra | Docker Compose |

## Repository Layout

```text
CineMatrix/
├── backend/
│   └── src/
│       ├── controllers/   # Auth, users, movies, cinemas, templates, screenings, bookings
│       ├── db/            # Mongo connection
│       ├── middlewares/    # JWT verification, RBAC, multer uploads
│       ├── models/         # 6 Mongoose schemas
│       ├── routes/         # Express routers
│       ├── seed/           # Demo accounts
│       ├── types/          # Domain interfaces + Express request augmentation
│       └── utils/          # JWT/bcrypt, Redis locks, Cloudinary, mailer, TMDB
├── frontend-client/        # Public moviegoer app
├── frontend-admin/         # Owner + admin portal
└── docker-compose.yaml
```

## Domain Model

| Model | Purpose | Key relationships |
| :--- | :--- | :--- |
| `User` | Customers, owners, staff, admins | `managedByOwnerId` self-reference for staff |
| `Movie` | Global catalog | optional `createdByCinemaId` |
| `Cinema` | Venue + embedded `rooms[]` seat grids | `ownerId → User` |
| `ScreeningTemplate` | Reusable movie + room + per-row pricing | `cinemaId`, `movieId`, `createdBy` |
| `Screening` | A dated showing with its own `seats[]` instances | `templateId`, `cinemaId`, `movieId` |
| `Booking` | Pending/confirmed ticket order with seat snapshot | `userId`, `screeningId` |

**Modeling decisions**

- Room layouts are **embedded** in `Cinema` (bounded, always read together).
- Seat state is **embedded** in `Screening` so the same seat at 10:00 and 15:00 is independent and can be updated atomically.
- Bookings **snapshot** seat labels and prices so historical orders never change.
- Templates copy prices at screening creation, so editing a template does not alter existing tickets.

## Booking Lifecycle

```text
available ──lock──▶ held ──create booking──▶ booked/pending
    ▲                 │                          │
    │                 └── lock expires ──────────┘
    │                                            │
    └── reject / cancel ◀────────────────────────┘
                                   approve ──▶ confirmed (seats stay booked)
```

1. Customer locks seats → Redis `SET NX EX 600`, Mongo seats become `held`.
2. Customer uploads a payment receipt (or chooses pay-at-cinema when allowed).
3. Booking is created as `pending`; seats become `booked`.
4. Owner approves or rejects after verifying payment.
5. Rejection or cancellation releases seats back to `available`.
6. A background job reconciles stale 10-minute seat holds. Pending bookings are never auto-cancelled; staff or the customer must resolve them.

## Key Backend Features

- **JWT authentication + RBAC** — access tokens carry `{ userId, role, managedByOwnerId }`; `verifyAccessToken` and `requireRole` protect routes, and `canManageCinema` enforces per-cinema ownership.
- **Multi-tenancy** — owners and staff only see and mutate their own cinemas, screenings, templates and bookings. Admins manage the global catalog and cinema approvals but cannot read or mutate tenant bookings.
- **Dynamic seat maps** — owners paint room grids (`seat`, `double`, `walkway`, `stairs`, `empty`); each screening materializes independent seat instances, with double seats priced at 2× the row price.
- **Concurrency control** — Redis holds prevent races during checkout; conditional Mongo updates (`arrayFilters`) are the final double-booking guard; server-side pricing prevents client tampering.
- **Admin approval workflows** — cinemas start `pending` and become public only after admin approval.
- **Maintenance job** — expired Redis seat holds are reconciled. Pending bookings are never auto-cancelled; staff approval/rejection or customer cancellation releases their seats.
- **Media pipeline** — Multer memory storage with MIME/size validation, uploaded to Cloudinary, URLs stored on documents.
- **Optional integrations** — TMDB import for movie metadata/trailers; SMTP notifications on booking status changes.
- **Strict tenant booking isolation** — `GET /booking` and `PATCH /booking/:id` are limited to the owner and staff of the cinema. Super admins have no tenant-booking access, and the admin app omits the Bookings tab entirely.

## Customer Experience

- **Trailer player** — movie cards stay free of play overlays. The detail page shows a play control only when the stored `trailerUrl` resolves to a valid YouTube video ID. The modal embeds via `youtube-nocookie.com`, autoplays after the click, closes on Escape/backdrop/X, locks background scrolling, and unmounts the iframe on close.
- **Profile header** — shows the signed-in customer’s live booking count only; the old hardcoded Reviews and Watchlist totals were removed.
- **Role-aware navigation** — admin, owner, and staff accounts each get only the navigation and routes their role can actually use.

## API Reference

Base URL: `http://localhost:8000`

### Authentication & Users

| Method | Endpoint | Access | Purpose |
| :--- | :--- | :--- | :--- |
| POST | `/user/register` | Public | Create a customer account |
| POST | `/user/login` | Public | Issue access + refresh tokens |
| DELETE | `/user/logout` | Authenticated | Invalidate stored refresh token |
| GET | `/user/profile` | Authenticated | Current user profile |
| PATCH | `/user/updateProfile` | Authenticated | Update name/phone/avatar |
| PATCH | `/user/updatePassword` | Authenticated | Change password |
| GET | `/user/owners` | Admin | List cinema owners |
| POST | `/user/owners` | Admin | Create a cinema owner |
| DELETE | `/user/owners/:id` | Admin | Delete owner + cascade |
| GET | `/user/staff` | Owner | List staff linked to the owner |
| POST | `/user/staff` | Owner | Create staff account |
| DELETE | `/user/staff/:id` | Owner | Remove staff account |

### Movies

| Method | Endpoint | Access | Purpose |
| :--- | :--- | :--- | :--- |
| GET | `/movie` | Public | List movies (`status`, `genre`) |
| GET | `/movie/:id` | Public | Movie details |
| POST | `/movie` | Admin | Create movie (multipart) |
| PATCH | `/movie/:id` | Admin | Update movie |
| DELETE | `/movie/:id` | Admin | Delete movie |
| GET | `/movie/tmdb/search` | Admin | Search TMDB |
| POST | `/movie/tmdb/import` | Admin | Import from TMDB |

### Cinemas

| Method | Endpoint | Access | Purpose |
| :--- | :--- | :--- | :--- |
| GET | `/cinema` | Public / optional auth | Active cinemas; admins see all |
| GET | `/cinema/my` | Owner, staff, admin | Cinemas the caller manages |
| GET | `/cinema/:id` | Public / optional auth | Details; non-active only for managers |
| POST | `/cinema` | Owner | Submit a new cinema (pending) |
| PATCH | `/cinema/:id` | Admin, owner, staff | Update venue/rooms |
| PATCH | `/cinema/:id/approve` | Admin | Approve registration |
| PATCH | `/cinema/:id/reject` | Admin | Reject registration |
| DELETE | `/cinema/:id` | Admin, owner | Delete cinema |

### Templates, Screenings & Bookings

| Method | Endpoint | Access | Purpose |
| :--- | :--- | :--- | :--- |
| GET | `/template` | Owner, staff | List templates for managed cinemas |
| POST | `/template` | Owner, staff | Create template |
| PATCH | `/template/:id` | Owner, staff | Update template |
| DELETE | `/template/:id` | Owner, staff | Delete template |
| GET | `/screening/public` | Public | Upcoming screenings (filters, search, pagination) |
| GET | `/screening/public/:id` | Public | Screening + seat map |
| GET | `/screening` | Owner, staff | Manage screenings |
| POST | `/screening` | Owner, staff | Schedule screening from template |
| PATCH | `/screening/:id` | Owner, staff | Reschedule |
| DELETE | `/screening/:id` | Owner, staff | Delete screening |
| POST | `/booking/upload` | Customer | Upload payment receipt |
| POST | `/booking/lock` | Customer | Hold seats for 10 minutes |
| POST | `/booking/unlock` | Customer | Release held seats |
| POST | `/booking` | Customer | Create booking |
| GET | `/booking/my` | Customer | Own bookings |
| POST | `/booking/:id/cancel` | Customer | Cancel a pending booking |
| GET | `/booking` | Owner, staff | Bookings scoped to the caller's cinemas |
| PATCH | `/booking/:id` | Owner, staff | Approve or reject a booking for the caller's cinemas |

## Local Development

### Prerequisites

- Node.js 20+
- MongoDB (local or Atlas)
- Redis (required for the seat-hold flow)
- Cloudinary account (image uploads)

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env
```

`backend/.env`:

```env
PORT=8000
MONGO_URI=mongodb://localhost:27017/cinematrix
FRONTEND_CLIENT=http://localhost:5173
FRONTEND_ADMIN=http://localhost:5174

ACCESS_TOKEN_SECRET=<random-long-secret>
ACCESS_TOKEN_EXP=1d
REFRESH_TOKEN_SECRET=<random-long-secret>
REFRESH_TOKEN_EXP=7d

CLOUDINARY_URL=cloudinary://<key>:<secret>@<cloud_name>
REDIS_URL=redis://localhost:6379

# Optional: TMDB metadata + trailer import (set either credential)
TMDB_API_KEY=
TMDB_READ_ACCESS_TOKEN=

SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
EMAIL_FROM=CineMatrix <no-reply@example.com>
```

```bash
npm run dev          # nodemon + tsx
npm run seed:admin   # idempotent demo accounts
```

### 2. Frontends

```bash
cd frontend-client && npm install && npm run dev   # http://localhost:5173
cd frontend-admin  && npm install && npm run dev   # http://localhost:5174
```

Both read `VITE_API_URL` from `.env` (default: `http://localhost:8000`).

### 3. Docker

```bash
cp backend/.env.example backend/.env
docker compose up --build
```

| Service | URL |
| :--- | :--- |
| Client app | http://localhost:5173 |
| Admin portal | http://localhost:5174 |
| API | http://localhost:8000 |
| MongoDB | internal only (`mongodb:27017`) |
| Redis | internal only (`redis:6379`) |

MongoDB and Redis are intentionally **not published to host ports**, because a
locally installed `mongod`/`redis-server` commonly owns `27017`/`6379`. Use
`docker compose exec mongodb mongosh` for a shell, or add a host mapping such as
`"6380:6379"` under the service's `ports:` block if you need external access.

Inside Compose the backend uses `mongodb://mongodb:27017/cinematrix` and
`redis://redis:6379`. `backend/.env` keeps `localhost` defaults so the same
file works for non-Docker `npm run dev`; Compose overrides those two values.

Seed inside the stack:

```bash
docker compose exec backend npm run seed:admin
```

### Demo Accounts

| Role | Email | Password |
| :--- | :--- | :--- |
| Customer | `customer@gmail.com` | `Customer@1234` |
| Cinema owner | `owner@gmail.com` | `Owner@1234` |
| Cinema staff | `staff@gmail.com` | `Staff@1234` |
| Admin | `admin@gmail.com` | `Admin@1234` |

## Verification

```bash
cd backend && npx tsc --noEmit     # strict type-check
cd frontend-client && npm run build
cd frontend-admin  && npm run build
```

## Design Trade-offs & Next Steps

- **Seats are embedded in each screening** to keep availability updates atomic and simple. At very large scale, a separate `Seat` collection with `{screeningId, label}` would reduce document growth and write contention.
- **Seat locking uses Redis + Mongo**, not a distributed transaction. The next step is a replica set + Mongo sessions for atomic seat-and-booking commits, and a Lua script (or `SET` pipeline) for all-or-nothing multi-seat locks.
- **Payments are verified manually** via receipt screenshots. A real deployment should use a gateway (e.g. Stripe PaymentIntents) with signed webhooks and idempotency keys.
- **Dashboards aggregate in the browser.** Server-side aggregation pipelines and paginated admin endpoints are the scaling path.
- **Planned:** automated tests, refresh-token rotation, rate limiting, structured logging, and CI.

## License

MIT — see [LICENSE.md](./LICENSE.md).
