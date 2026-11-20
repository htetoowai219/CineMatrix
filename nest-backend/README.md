# CineMatrix NestJS backend

A NestJS port of the Express backend in `../backend`. It is a drop-in
replacement: the same MongoDB collections, JWT format, environment variables,
routes, status codes, response bodies, and error messages are preserved.

## Run

```bash
npm install
cp .env.example .env   # then edit secrets
npm run start:dev      # http://localhost:8000 (PORT from .env)
```

Other scripts:

- `npm run build` — compile to `dist/`
- `npm run start:prod` — run the compiled build
- `npm run seed:admin` — idempotent demo accounts (admin/owner/staff/customer)

## Contract fidelity notes

- **No `/api` prefix.** Routes remain `/user`, `/movie`, `/cinema`, `/template`,
  `/screening`, `/booking` because the existing frontends use `VITE_API_URL` as
  the bare server origin.
- **Auth:** Bearer tokens from `Authorization` are verified with
  `ACCESS_TOKEN_SECRET`; the decoded payload is `{ userId, role, managedByOwnerId }`
  and is attached to `req.user`. The optional guard lets anonymous callers read
  active cinemas. Cookies are not used (the original backend did not use them).
- **Errors:** every failure is `{ "message": "..." }` with the original status
  code and copy, enforced by `AllExceptionsFilter`.
- **Uploads:** the original multer middleware is reused through an interceptor,
  so field names (`profileImage`, `posterImage`, `backdropImage`, `images`,
  `gallery`, `paymentScreenshot`), MIME whitelist, 5 MB limit, and error text
  are unchanged.
- **No global `ValidationPipe`.** Adding one with `whitelist: true` would strip
  multipart fields that the original controllers read from `req.body`.
- **Data:** collection names and schema options match the Express models, so the
  same database can be used by both backends during a rollout.
- **Redis seat locks** use the same keys, 10-minute TTL, and the same 30-second
  reconciliation job (now an `OnModuleInit` interval with graceful teardown).
- **TMDB and SMTP** are optional exactly as before; booking emails stay
  best-effort and never fail a request.

## Structure

```
src/
├── main.ts, app.module.ts, seed.ts
├── common/          # decorators, guards, filter, multer interceptor, utils, types
└── modules/         # users, movies, cinemas, templates, screenings, bookings
                     # + cloudinary, redis, mailer, tmdb (shared services)
```

## Docker

A `Dockerfile` is included. To run this service from the root compose file,
point its build context at `./nest-backend` and its `env_file` at
`./nest-backend/.env` (the root `docker-compose.yaml` is intentionally left
untouched).
