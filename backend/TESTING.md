# Backend testing

The guide for the whole repository (website, admin, browser smoke test, CI) is
[`../TESTING.md`](../TESTING.md). This page covers the API.

## Unit + E2E (Jest + Supertest)

Install once (adds jest, supertest, mongodb-memory-server):
```
npm ci
```

- Everything: `npm test`
- Unit only (no database): `npm run test:unit`
- E2E only: `npm run test:e2e`

Unit tests (`tests/*.test.js`) need no database. **E2E tests** (`tests/e2e/*.e2e.test.js`) spin up an **in-memory MongoDB** automatically — no external DB, no config. Nothing is ever emailed, texted or uploaded: SMTP and Africa's Talking are unset, so sends are logged as `skipped`; Cloudinary's storage engine is mocked (`tests/e2e/cloudinaryMock.js`) and Google's tokeninfo endpoint is mocked with `jest.mock('axios')`. The first run downloads a MongoDB binary (cached afterwards). Hooks get a 30 s timeout (`jest.config.js`) because starting MongoDB and hashing passwords can be slow on a busy CI runner.

What the unit suites cover: structured logging (redaction, masking, levels, JSON lines), request ids and request log lines, caching headers, CORS, body size limit, `TRUST_PROXY`, liveness/readiness without a database (`observability`); Sentry start-up, scrubbing and failure isolation with the SDK mocked (`monitoring`); config validation, the error handler (Mongoose errors → 400/409), validators, discovery tags, listing visibility and photo-list rules, the notification channel flags, the dashboard's EAT month boundary, and **notification content** (`notifications`): who gets which email/SMS, real PDF attachments for quotes, quotations and receipts, and that anything a traveller typed is HTML-escaped.

What the E2E suites cover:

- **Security hardening (Phase 3)** — a password change or reset ends older sessions, own-password change returns a fresh admin token, HS512 tokens refused, the last admin survives a simultaneous removal, `/auth/me` doesn't use up sign-in attempts, reset emails limited per IP and per address (`sessions`); the original public booking forms refuse query operators and hidden cars, search is literal, paging is bounded but still serves the admin's 1000-row pages, notes/quote validation, Mongoose errors as 400 not 500, atomic Safari Points (`inputHardening`); upload type filter (`groupTripAdmin`).
- **Indexes** — every query on a growing collection uses an index and reads close to what it returns (`indexes`, uses `explain()`).
- **Health** — readiness with a database (`health`); admin single-trip endpoint and opt-in pagination of group bookings (`adminLists`); demo seed safeguards and idempotency (`demoSeed`).

- **Auth** — register, login, wrong password; the full **password-reset** journey (link works once, old password stops working, expired links refused, no email for unknown or Google-only accounts) (`passwordReset`); Google sign-in only links or creates accounts for a Google-verified email (`googleAuth`).
- **Authorisation** — every admin-only endpoint answers 401 to the public and 403 to travellers; traveller endpoints refuse admin tokens; travellers only see their own bookings and quote requests (`authorization`).
- **Admin sessions** — a removed admin's token stops working at once; user tokens are refused on admin routes (`adminSession`).
- **Listing CRUD** — create, read, update and delete for every listing type, as the admin forms send them (`listingCrud`).
- **Notification log** — attempts are recorded as `skipped` while email/SMS are unconfigured, and the admin can list them (`notificationLog`).
- **Group tour lifecycle** — admin create → publish → user join (pending) → admin confirm → public participants feed → unified `/api/bookings` → admin cancel (seat released).
- **Group-trip seats** — double-tapped confirm/cancel take or release exactly one seat, the capacity guard never oversells, a full trip reopens when a seat frees up, and the edit form can't cut seats below confirmed travellers (`groupBookingSeats`).
- **Admin group-trip create/update** — multipart with and without images, field-level 400s from zod, and upload failures mapped to real codes (400 too large / unexpected field / rejected format, 502 Cloudinary failure, 503 image hosting not configured).
- **Listing photos** — the kept-photos contract on update for experiences, services, properties, stays and group trips: a kept list replaces, an omitted one keeps (`listingPhotos`).
- **Listing visibility** — hidden listings never reach the public (lists or by id), admins see and can filter them, malformed ids are 404 (`listingVisibility`).
- **Trip requests (quotes)** — guest submit → admin list/search → quote → accept → unified bookings; item kinds kept; My Trips scoping; delivery hints tell the UI when nothing was emailed.
- **Admin overview, team and quick edits** — dashboard shape, add/rename/reset/remove teammates (never the last admin), whitelisted quick edits, generic cancel.

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
