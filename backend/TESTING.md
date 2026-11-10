# Testing

## Unit + E2E (Jest + Supertest)

Install once (adds jest, supertest, mongodb-memory-server):
```
npm install
```

- Run everything: `npm test`
- E2E only: `npm run test:e2e`

Unit tests (`tests/*.test.js`) need no database. **E2E tests** (`tests/e2e/*.e2e.test.js`) spin up an **in-memory MongoDB** automatically — no external DB, no config. Nothing is ever emailed, texted or uploaded: SMTP and Africa's Talking are unset, so sends are logged as `skipped`; Cloudinary's storage engine is mocked (`tests/e2e/cloudinaryMock.js`) and Google's tokeninfo endpoint is mocked with `jest.mock('axios')`. The first run downloads a MongoDB binary (cached afterwards). Hooks get a 30 s timeout (`jest.config.js`) because starting MongoDB and hashing passwords can be slow on a busy CI runner.

What the E2E suites cover:

- **Auth** — register, login, wrong password, safe forgot/reset-password; Google sign-in only links or creates accounts for a Google-verified email (`googleAuth`).
- **Admin sessions** — a removed admin's token stops working at once; user tokens are refused on admin routes (`adminSession`).
- **Group tour lifecycle** — admin create → publish → user join (pending) → admin confirm → public participants feed → unified `/api/bookings` → admin cancel (seat released).
- **Group-trip seats** — double-tapped confirm/cancel take or release exactly one seat, the capacity guard never oversells, a full trip reopens when a seat frees up, and the edit form can't cut seats below confirmed travellers (`groupBookingSeats`).
- **Admin group-trip create/update** — multipart with and without images, field-level 400s from zod, and upload failures mapped to real codes (400 too large / unexpected field / rejected format, 502 Cloudinary failure, 503 image hosting not configured).
- **Listing photos** — the kept-photos contract on update for experiences, services, properties, stays and group trips: a kept list replaces, an omitted one keeps (`listingPhotos`).
- **Listing visibility** — hidden listings never reach the public (lists or by id), admins see and can filter them, malformed ids are 404 (`listingVisibility`).
- **Trip requests (quotes)** — guest submit → admin list/search → quote → accept → unified bookings; item kinds kept; My Trips scoping; delivery hints tell the UI when nothing was emailed.
- **Admin overview, team and quick edits** — dashboard shape, add/rename/reset/remove teammates (never the last admin), whitelisted quick edits, generic cancel.

## Website unit tests (Vitest)

In `client-vite/`: `npm test` runs `src/**/*.test.{js,jsx}` — the pure libraries (`lib/trip`, `lib/vibes`, `lib/http`, dates and storage) in Node, and `components/Layout.test.jsx` in jsdom (it guards against the Chrome 155 `scrollTo()` navigation crash). Time-zone tests switch `process.env.TZ` to American zones to catch off-by-one-day bugs that don't show in East Africa.

## Load test (no dependencies)

Run against a live backend (local or staging):
```
npm run loadtest -- http://localhost:5000/api/health 200 15
#                     <url>                          <concurrency> <seconds>
```
Reports total requests, throughput (req/s), and p50/p95/p99 latency. Point it at read endpoints such as `/api/health` or `/api/group-trips`. Start modestly and raise concurrency toward your 200-user target.

## Seed load-test data
Creates N users (default 200) using your `.env` `MONGODB_URI` (use a **non-production** database):
```
npm run seed:loadtest -- 200
```
Seeded accounts are `loadtest_user_<n>@example.com` with password `password123`.
