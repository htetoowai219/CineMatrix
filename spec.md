# CineMatrix — Project Spec & Progress Tracker

> Living document that tracks the project's context, structure, and implementation progress.
> Keep this file up to date whenever a feature is added, changed, or completed.

---

## 1. Overview

**CineMatrix** is an end-to-end multi-tenant cinema booking and management platform built on the
MERN stack (MongoDB, Express, React, Node.js). It connects moviegoers with registered independent
cinemas: users can discover movies, inspect dynamic seat layouts, and reserve tickets, while cinema
owners manage rooms, schedule screenings, and manually verify payment receipts.

---

## 2. Tech Stack

| Layer         | Technology                                                   |
| :------------ | :----------------------------------------------------------- |
| Backend       | Node.js, Express (v5), TypeScript, Mongoose (MongoDB)        |
| Auth          | JWT (access + refresh), Role-Based Access Control (RBAC)     |
| Client Web    | React 19, TypeScript, Vite, Tailwind CSS v4, Zustand, Axios  |
| Admin Web     | React 19, TypeScript, Vite (scaffolded — dashboard TBD)      |
| Media storage | Cloudinary (all image assets) + Multer (in-memory file uploads) |
| Infra         | Docker Compose (MongoDB, backend, both frontends)            |

---

## 3. Repository Structure

```text
cinema-platform/
├── backend/             # Express REST API & Mongoose schemas
│   └── src/
│       ├── controllers/ # Route handlers (auth, movie, cinema)
│       ├── db/          # MongoDB connection
│       ├── middlewares/ # JWT access-token verification, multer image uploads
│       ├── models/      # Mongoose models (User, Movie, Cinema)
│       ├── routes/      # Express routers
│       ├── types/       # TS interfaces & shared types
│       └── utils/       # Password hashing, token generation, Cloudinary uploads
├── frontend-client/     # Public moviegoer web app
│   └── src/
│       ├── components/  # Layout, movie cards, auth guards
│       ├── pages/       # Home, Movies, Cinemas, Auth, Profile
│       ├── services/    # Axios instance (auth header interceptor)
│       ├── stores/      # Zustand stores (user, movie, cinema)
│       ├── styles/      # Tailwind/theme CSS
│       └── types/       # Shared frontend types
├── frontend-admin/      # Super-admin dashboard (sidebar layout)
│   └── src/
│       ├── components/  # Auth guard, admin layout/sidebar, UI (modal, badges, form)
│       ├── pages/       # Login, Dashboard, Manage Movies, Manage Cinemas
│       ├── services/    # Axios instance (auth header + 401 logout interceptor)
│       ├── stores/      # Zustand stores (user, movie, cinema) with CRUD actions
│       ├── styles/      # Tailwind/theme CSS (mirrors frontend-client)
│       ├── types/       # Shared frontend types (+ create/update payloads)
│       └── utils/       # JWT payload decoder (role gating)
└── docker-compose.yaml  # Local containerized dev environment
```

---

## 4. Domain Models (backend)

### User (`backend/src/models/user.model.ts`)
- `name`, `email` (unique), `phone`, `password` (bcrypt-hashed)
- `profileImageUrl` (Cloudinary URL, optional)
- `role`: `customer` | `cinema_owner` | `admin` (default `customer`)
- `refreshToken` stored for session invalidation

### Movie (`backend/src/models/movie.model.ts`)
- Metadata: `title`, `tagline`, `synopsis`, `durationMinutes`, `releaseDate`,
  `originalLanguage`, `contentRating`, `averageScore`, `director`, `castMembers`, `genres`
- Media: `posterUrl`, `backdropUrl`, `trailerUrl`
- `status`: `UPCOMING` | `NOW_SHOWING` | `ARCHIVED` | `PENDING_APPROVAL`
- `createdByCinemaId` (optional ref to Cinema)

### Cinema (`backend/src/models/cinema.model.ts`)
- Nested schemas: `address` (city indexed), `location` (2dsphere geo point),
  `socials` (website/facebook/instagram/twitter)
- `ownerId` (ref User), `rating`, `reviewsCount`, `amenities`, `images`, `gallery`
- `totalScreens`, `openingHours`, `isActive` (default `true`)

---

## 5. API Surface (Express)

All endpoints under the following prefixes (`backend/src/index.ts`):

| Prefix   | Routes                                                                                      |
| :------- | :------------------------------------------------------------------------------------------ |
| `/user`  | POST `/register`, POST `/login`, DELETE `/logout` (auth), PATCH `/updateProfile`, PATCH `/updatePassword`, GET `/profile` |
| `/movie` | GET `/` (filters: `status`, `genre`), GET `/:id` (public); POST `/`, PATCH `/:id`, DELETE `/:id` (admin-only) |
| `/cinema`| GET `/` (filters: `city`, `amenity`), GET `/:id` (public); POST `/`, PATCH `/:id`, DELETE `/:id` (admin-only) |

- Auth middleware (`auth.middleware.ts`) parses `Authorization: Bearer <token>` and attaches `req.user = { id, role }`.
- RBAC is enforced **inline** inside controllers (e.g., `req.user?.role !== "admin"` → 403).
- **Image uploads:** mutation endpoints accept `multipart/form-data` and read image files via the
  `uploadImages` multer middleware (in-memory). Uploaded files are pushed to Cloudinary and the
  returned URL(s) are stored on the document. Recognized file fields:
  - User: `profileImage`
  - Movie: `posterImage`, `backdropImage`
  - Cinema: `images` (single), `gallery` (single; multi-file pending)
  - Both file-based and plain-JSON (URL-only) payloads are supported and validated by Joi.

---

## 6. Frontend Client (moviegoer app)

State management via **Zustand** stores; API calls through a shared Axios instance
(`services/api.ts`) that injects the stored access token on every request.

| Store (`stores/`) | Actions |
| :---------------- | :------ |
| `user.store`      | `registerAction`, `loginAction`, `logoutAction`, `getProfileAction`, `updateProfileAction`, `updatePasswordAction` (persisted to localStorage) |
| `movie.store`     | `getAllMoviesAction` (filters), `getMovieByIdAction`, `clearSelectedMovie` |
| `cinema.store`    | `getAllCinemasAction` (filters), `getCinemaByIdAction`, `clearSelectedCinema` |

Pages (`pages/`):
- `/` HomePage — hero featured movie, now-showing + coming-soon grids w/ genre filter, cinema cards (cinemas still **mock data**)
- `/movies`, `/movies/:id` — browse & movie detail
- `/cinemas`, `/cinemas/:id` — browse & cinema detail (API-backed)
- `/login`, `/register` — auth pages
- `/profile` — profile fetch/update + password change

Components: `MainLayout`, `Navbar`, `Footer`, `SectionLabel`, `MovieCard`, `auth/ProtectedRoute` (reads `localStorage` token — note: key mismatch, see Known Issues).

---

## 7. Frontend Admin (owner & super-admin)

**Status: Super-admin dashboard implemented** — movie & cinema management only.

- **Auth flow:** dedicated login page (`/login`). `user.store.loginAction` calls the backend
  `/user/login`, decodes the JWT payload client-side (`utils/jwt.ts`) to read the `role` claim,
  and **rejects any non-admin session** (it revokes the token server-side via `/user/logout`
  before failing). Role gating is also enforced by the backend on every write request.
- **Route guard:** `components/auth/ProtectedRoute.tsx` redirects unauthenticated/non-admin users
  to `/login`. The Axios instance (`services/api.ts`) attaches the stored Bearer token and, on a
  401, clears auth state so the guard redirects back to login.
- **Layout:** `AdminLayout` with a fixed collapsible `Sidebar` (Dashboard / Movies / Cinemas),
  top bar, and user card with logout.
- **Pages:**
  - `/` Dashboard — stat cards + recent movies/cinemas
  - `/movies` Manage Movies — table w/ search & status filter; create/edit/delete via modal forms
  - `/cinemas` Manage Cinemas — table w/ search & status filter; create/edit/delete via modal forms
- **Backend integration:** create/update/delete map exactly to `POST/PATCH/DELETE /movie` and
  `/cinema` (admin-required). Movie and cinema forms cover all fields accepted by the backend.
- **Admin provisioning:** no API exists to create admin accounts (registration is customer-only),
  so a dev seed script was added — see `backend/src/seed/seedAdmin.ts` (`npm run seed:admin`).

---

## 8. Environment & Setup

Backend `.env` (`backend/.env`):
```env
PORT=8000
FRONTEND_CLIENT=http://localhost:5173/
FRONTEND_ADMIN=http://localhost:5174/
MONGO_URI=...
ACCESS_TOKEN_SECRET=...
ACCESS_TOKEN_EXP=1d
REFRESH_TOKEN_SECRET=...
REFRESH_TOKEN_EXP=7d
CLOUDINARY_URL=cloudinary://<key>:<secret>@<cloud_name>   # used by utils/cloudinary.ts
REDIS_URL=redis://localhost:6379      # Phase 3 seat locking (defaults to redis://redis:6379)
PENDING_BOOKING_TTL_MINUTES=30        # how long a pending booking survives before the TTL job frees its seats
TMDB_API_KEY=...                      # The Movie Database API key (TMDB endpoints 503 without it)
SMTP_HOST=...                         # email notifications (booking confirmed/rejected); SMTP_PORT / SMTP_USER / SMTP_PASS / EMAIL_FROM
```

Client frontend uses `VITE_API_URL` (base URL for Axios).

Docker: `docker compose up --build`
- MongoDB `:27017`, Backend API `:8000`, Client `:5173`, Admin `:5174`.
- Both frontends set `VITE_API_URL=http://localhost:8000` so the browser talks to the host-mapped API.
- Seed admin/owner inside the stack: `docker compose exec backend npm run seed:admin`

> **Note:** the seed script now syncs passwords on re-run, so the documented
> `admin@cinematrix.com / Admin@1234` credentials always work against an existing DB volume.

---

## 9. Progress Status

### ✅ Completed
- [x] Backend scaffolding: Express + TS + Mongoose + DB connection (`connectDb.ts`)
- [x] User auth: register / login / logout / profile / update profile / update password
- [x] JWT auth middleware + RBAC-ready payload (`{ id, role }`)
- [x] Movie model, controller, routes (public read, admin write)
- [x] Cinema model, controller, routes (public read, admin write)
- [x] Frontend client: routing, layout, homepage, movie/cinema pages
- [x] Client Zustand stores + Axios auth interceptor + persistence
- [x] Auth pages (login/register) and profile page wired to API
- [x] Docker Compose local dev environment
- [x] Cinema API integration in frontend pages
- [x] Super-admin frontend: login, dashboard, movie & cinema CRUD (sidebar UI)
- [x] Dev seed script for demo admin + cinema owner (`npm run seed:admin`)
- [x] Cloudinary + Multer image uploads across all mutation endpoints (profile, movie, cinema);
      file-based and URL-based payloads both supported; non-image files rejected (400)
- [x] Admin auth bootstrap: session validated against backend (`GET /user/profile`) before any route
      renders (loader gate), so stale/expired tokens can never flash the dashboard; `ProtectedRoute`
      also checks JWT `exp` and always redirects unauthenticated users to `/login`
- [x] Admin profile page (`/profile`): editable personal info, password change, and avatar upload;
      the sidebar profile card is clickable and navigates to it (like the client frontend)
- [x] Movie create/edit form: removed the "Created By Cinema ID" field (relation only needed for
      listing which cinemas show a movie, not for creation)
- [x] Docker Compose: fixed `VITE_API_URL` → port 8000; full stack tested end-to-end (auth gate, movie/cinema CRUD, 401/403 enforcement)
- [x] **Phase 3 — Seat locking:** Redis-based temporary seat locks (10-minute countdown) with atomic
      `acquire`/`release`/`extend`/`reconcile` Lua scripts; locked seats are excluded from any booking
      attempt, locks auto-release on expiry, and conflict errors are scoped by screening
- [x] **Phase 3 — Bookings:** create (auto-cancels past bookings + confirms the paid lock), reject,
      cancel, TTL-expire (10s polling job re-freeing seats of abandoned pending bookings),
      payment-receipt upload (Cloudinary), and a public booking lookup endpoint (`GET /bookings/public/:code`)
- [x] **Phase 3 — Client booking flow:** `/book/:screeningId` seat grid (rows/cols + unavailable seats),
      live countdown timer with lock auto-extend, booking code + receipt upload, and a
      "My Bookings" view tracking pending/confirmed/rejected status
- [x] **Phase 3 — TMDB:** search (`GET /tmdb/search`) and import (`POST /tmdb/import`) endpoints plus an
      admin "Import from TMDB" modal (poster/backdrop/trailer/genres/overview); importing sets the movie
      to `UPCOMING` and re-uses a normalized poster, so existing seeded art isn't clobbered
- [x] **Phase 3 — Email:** SMTP notifications on booking confirm/reject (skipped with a log warning when
      SMTP is unconfigured)

### 🔜 In Progress / Upcoming
- [ ] Multi-file upload support for cinema `images` / `gallery` (schema already supports arrays)
- [ ] Owner-scoped cinema permissions (backend currently grants create/update/delete to `admin` only)

### 🗺️ Roadmap (from README)
- [x] Redis-based temporary seat locking (10-minute payment timeout)
- [x] Mongo TTL index for expired pending bookings
- [x] TMDB integration for auto-fetching movie metadata & trailers
- [x] Email notifications on booking confirm/reject

---

## 10. Known Issues & Notes

- `ProtectedRoute.tsx` checks `localStorage.getItem("accessToken")`, but the token is persisted by
  Zustand under the key `cinematrix-user-storage`. The guard will never find a token — must be
  rewired to read from `useUserStore` (and the route is not mounted in `App.tsx` either).
- Homepage "Nearby Cinemas" section still uses hard-coded mock data; not yet wired to `cinema.store`.
- `profile` route in `App.tsx` is not wrapped in `ProtectedRoute`.
- No `refresh-token` flow implemented on the client (tokens are just stored/cleared).
- RBAC checks exist only for `admin`; `cinema_owner` permissions are not yet enforced anywhere.
- Cinema `deleteCinemaController`/`updateCinemaController` require `admin`; ownership-scoped
  access for owners is not implemented.
- No automated tests exist for any service (backend `test` script is a placeholder).
- Backend lacks a refresh-token verification/rotation endpoint (`/user` has logout only).
- Admin role is determined client-side from the (unverified) JWT payload for UI gating only; the
  backend is the source of truth for authorization on write requests.
- Cinema creation requires an `ownerId` (a `cinema_owner` user ObjectId) since no endpoint lists
  users. Use the ID printed by `npm run seed:admin`.
- `cinema_owner` has no dedicated dashboard or backend permissions yet (backend only grants
  create/update/delete to `admin`).
- Admin movie/cinema forms no longer accept poster/backdrop/gallery/image **URL** inputs (URLs are
  backend-only / Cloudinary-returned); the frontends must be updated to file pickers + previews.
- Cinema `images` and `gallery` file fields currently accept a single file each; multi-file support
  is planned (schema already supports arrays).

---

## 11. Conventions & Commands

- Backend dev: `cd backend && npm run dev` (nodemon + tsx)
- Seed admin/owner accounts: `cd backend && npm run seed:admin`
- Client dev: `cd frontend-client && npm run dev`
- Admin dev: `cd frontend-admin && npm run dev`
- Lint: `npm run lint` (eslint) inside each frontend
- Build/typecheck: `npm run build` (tsc -b && vite build) inside each frontend
- Branch naming convention: `feat/<feature-name>`
- Commit style: conventional, e.g. `feat: implement cinema model, controller, route on backend`
