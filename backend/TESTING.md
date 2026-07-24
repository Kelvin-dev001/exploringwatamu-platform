# Testing

## Unit + E2E (Jest + Supertest)

Install once (adds jest, supertest, mongodb-memory-server):
```
npm install
```

- Run everything: `npm test`
- E2E only: `npm run test:e2e`

Unit tests (`tests/*.test.js`) need no database. **E2E tests** (`tests/e2e/*.e2e.test.js`) spin up an **in-memory MongoDB** automatically — no external DB, no config. They cover:

- **Auth** — register, login, wrong password, and safe forgot/reset-password behaviour.
- **Group tour lifecycle** — admin create → publish → user join (pending) → admin confirm → public participants feed → unified `/api/bookings` → admin cancel (seat released).

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

## Note
These were authored in an environment that couldn't install the Jest/Mongo toolchain, so run them locally to watch them execute. Every flow they cover has also been smoke-tested at the HTTP level during development.
