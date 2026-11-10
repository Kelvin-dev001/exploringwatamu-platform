# ExploringWatamu platform

A personalised trip-planning website for Watamu, Kilifi County, Kenya. Visitors tell us
how they like to travel, add experiences, stays, transfers, car hire and services to a
day-by-day planner, and request one quote for the whole trip. Our team prices it in the
admin portal. There are no online payments: the request-a-quote model is deliberate.

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

Email, SMS, image uploads and Google sign-in are optional and switch themselves off
when unconfigured. While email isn't configured, the admin warns that travellers were
**not** emailed, and travellers can read their quote under **My bookings**.

## Tests and checks

```bash
cd backend && npm test            # unit + E2E (in-memory MongoDB; nothing is sent externally)
cd backend && npm run test:e2e    # E2E only
cd client-vite && npm test        # Vitest
cd client-vite && npm run build
cd admin-vite && npm run build && npm run lint
```

See [`backend/TESTING.md`](backend/TESTING.md) for what each suite covers.

## Docs

- [`DEPLOYMENT.md`](DEPLOYMENT.md) — Render, Vercel and MongoDB Atlas setup, environment variables.
- [`backend/CLAUDE.md`](backend/CLAUDE.md) — backend architecture and conventions.
- [`docs/SECTION-8-INTEGRATION-AUDIT.md`](docs/SECTION-8-INTEGRATION-AUDIT.md) — end-to-end audit (November 2026): defects found, fixes, open recommendations.
