# ExploringWatamu platform

A personalised trip-planning website for Watamu, Kilifi County, Kenya. Visitors tell us
how they like to travel, add experiences, stays, transfers, car hire and services to a
day-by-day planner, and request one quote for the whole trip. Our team prices it in the
admin portal. There are no online payments: the request-a-quote model is deliberate.

The website is in English and Italian (`/it/…`); travellers who use the Italian site get
their emails, texts and PDFs in Italian. See [`docs/LOCALISATION.md`](docs/LOCALISATION.md).

| Folder | What | Deployed to |
|---|---|---|
| `backend/` | Node 20 · Express 5 · MongoDB (Mongoose 8) REST API | Render |
| `client-vite/` | Public website — React 19, Vite 7, Tailwind CSS 4 | Vercel |
| `admin-vite/` | Admin portal — React 19, Vite 7, Tailwind CSS 4 | Vercel |
| `client/` | Expo mobile app — parked, not deployed | — |

## Run it locally

```bash
# API (needs a MongoDB URI and a JWT secret; see backend/.env.example)
cd backend && npm install && cp .env.example .env && npm run dev     # http://localhost:5000/api

# Public website
cd client-vite && npm install && npm run dev                        # http://localhost:5173

# Admin portal (VITE_API_URL defaults to the API above)
cd admin-vite && npm install && npm run dev
```

Email, SMS, image uploads, Google sign-in, error monitoring and WhatsApp click-to-chat
are optional and switch themselves off when unconfigured. While email isn't configured, the admin warns that travellers were
**not** emailed, and travellers can read their quote under **My bookings**.

## Tests and checks

Run with Node 20, after `npm ci` in each folder:

```bash
cd backend && npm test                                   # unit + E2E (in-memory MongoDB; nothing is sent externally)
cd client-vite && npm run lint && npm test && npm run build
cd admin-vite && npm run lint && npm test && npm run build
cd e2e && npx playwright install chromium && npx playwright test   # browser smoke test of the quote journey
```

CI runs the same checks on every pull request ([`.github/workflows/ci.yml`](.github/workflows/ci.yml)). See [`TESTING.md`](TESTING.md) for what each suite covers, and for the GitHub billing lock that currently stops Actions from running.

Need listings to click through on a fresh local or staging database?
`cd backend && npm run seed:demo -- --confirm-db=<database name>` adds clearly labelled
demo content (never run it against production).

## Docs

- [`DEPLOYMENT.md`](DEPLOYMENT.md) — Render, Vercel and MongoDB Atlas setup, environment variables.
- [`docs/OPERATIONS.md`](docs/OPERATIONS.md) — running it: deploys, rollback, secrets, admins, email, photos, monitoring, logs, health checks, cold starts.
- [`docs/DATABASE.md`](docs/DATABASE.md) — indexes, backups and restores.
- [`docs/WHATSAPP.md`](docs/WHATSAPP.md) — WhatsApp click-to-chat: setup, where it appears, number rules.
- [`docs/REVIEWS.md`](docs/REVIEWS.md) — verified reviews: eligibility, data model, API, moderation, migration, invitations.
- [`docs/LOCALISATION.md`](docs/LOCALISATION.md) — English and Italian: addresses, messages, SEO, emails, Italian listing text, translation coverage.
- [`docs/SECURITY-REVIEW.md`](docs/SECURITY-REVIEW.md) — security review (November 2026): findings and fixes.
- [`docs/OWNER-ACTIONS.md`](docs/OWNER-ACTIONS.md) — tasks that need the account owner.
- [`TESTING.md`](TESTING.md) — the test suites, the browser smoke test and CI.
- [`backend/CLAUDE.md`](backend/CLAUDE.md) — backend architecture and conventions.
- [`docs/SECTION-8-INTEGRATION-AUDIT.md`](docs/SECTION-8-INTEGRATION-AUDIT.md) — end-to-end audit (November 2026): defects found, fixes, open recommendations.
