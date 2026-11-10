# ExploringWatamu — Deployment Guide

Deploy everything straight from GitHub — no local machine required.

**What goes where**
- **Backend API** (`/backend`) → **Render** (Node web service).
- **Traveller web app** (`/client-vite`) → **Vercel**.
- **Admin portal** (`/admin-vite`) → **Vercel**.
- **Database** → **MongoDB Atlas**.
- The Expo app (`/client`) is a later, separate mobile deploy — skip it for now.

Do the steps in order; each one produces a value the next step needs.

---

## Before you start — accounts
- MongoDB Atlas (free tier) — the database
- Render (free tier) — the backend
- Vercel (free tier) — the two web apps
- Optional now, add later: an SMTP provider (email), Africa's Talking (SMS), Cloudinary (image uploads), a Google OAuth client (Google sign-in)

---

## Step 1 — Database (MongoDB Atlas)
1. Create a free cluster.
2. **Database Access → Add New Database User.** Use a **fresh, strong password** (this replaces the old leaked `watamuser` credential — do not reuse it).
3. **Network Access → Add IP Address → Allow access from anywhere** (`0.0.0.0/0`) for now (simplest for Render's dynamic IPs).
4. **Connect → Drivers** and copy the connection string. It looks like:
   `mongodb+srv://USER:PASSWORD@cluster.xxxx.mongodb.net/exploringwatamu?retryWrites=true&w=majority`
   Put your new password in it and add a database name (e.g. `/exploringwatamu`). Keep this handy — it's your `MONGODB_URI`.

## Step 2 — Backend (Render)
Easiest is the included blueprint:
1. Render → **New + → Blueprint** → connect your GitHub repo. It reads `render.yaml` and creates the `exploringwatamu-api` service (build `npm install`, start `npm start`, health check `/api/health`). `JWT_SECRET` is generated for you.
2. Open the service → **Environment** and set the secrets (marked "sync: false"):
   - `MONGODB_URI` = your Atlas string from Step 1
   - Leave `FRONTEND_URLS` / `FRONTEND_URL` blank for now — you'll fill them after Step 4.
   - Optional (can add later): `CLOUDINARY_*`, `SMTP_*`, `MAIL_FROM`, `ADMIN_NOTIFY_EMAIL`, `GOOGLE_CLIENT_ID`, `AT_*`.
3. Deploy. When it's live, note the URL, e.g. `https://exploringwatamu-api.onrender.com`. Visit `https://…/api/health` — you should see `{"status":"ok"}`.

> No blueprint? Create a **Web Service** manually: Root Directory `backend`, Build `npm install`, Start `npm start`, Health Check Path `/api/health`, and add the same env vars (plus `NODE_ENV=production`, `JWT_SECRET` = a long random string, `PAYMENTS_ENABLED=false`).

## Step 3 — Create your admin login
The admin portal signs in against an admin stored in the database. In Render, open the service's **Shell** and run:
```
npm run seed:admin -- you@example.com yourStrongPassword
```
(That's how you'll log into the admin portal.)

*Alternative (no shell needed):* set `BOOTSTRAP_ADMIN_EMAIL` and `BOOTSTRAP_ADMIN_PASSWORD` in the Render environment variables. On startup the backend auto-creates that admin (and resets its password to match the env if it ever drifts), so you can log in without running any command.

## Step 4 — Frontends (Vercel)
Deploy the two web apps as **separate Vercel projects from the same repo**:

**Traveller app**
1. Vercel → **Add New → Project** → import the repo.
2. **Root Directory:** `client-vite`. Framework preset: **Vite**.
3. **Environment Variables:** `VITE_API_URL` = `https://<your-render-url>/api` (note the `/api`).
4. Deploy → note the URL, e.g. `https://exploringwatamu.vercel.app`.

**Admin app** — repeat with **Root Directory:** `admin-vite`, same `VITE_API_URL`. Note its URL, e.g. `https://exploringwatamuadmin.vercel.app`.

(Both already include a `vercel.json` so client-side routing works.)

## Step 5 — Connect the frontends to the API (CORS)
Back in Render → the API service → **Environment**:
- `FRONTEND_URLS` = your two Vercel URLs, comma-separated, e.g.
  `https://exploringwatamu.vercel.app,https://exploringwatamuadmin.vercel.app`
- `FRONTEND_URL` = the traveller app URL (used in email/e-card links), e.g. `https://exploringwatamu.vercel.app`

Save (Render redeploys). The apps can now call the API.

## Step 6 — Turn on the optional integrations (any time)
Set these on Render and redeploy; each is a safe no-op until configured:
- **Email:** `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS`, `MAIL_FROM`, `ADMIN_NOTIFY_EMAIL`. Email only counts as configured when **both** `SMTP_HOST` and `SMTP_USER` are set. Until then nothing is emailed (the Notifications log shows `skipped`), the admin portal warns after sending a quote or confirming a booking that the traveller was **not** emailed, and travellers can read their priced quote under **My bookings** on the website (signed in with the email they used).
- **SMS:** `AT_USERNAME`, `AT_API_KEY`, `AT_SENDER_ID` (Africa's Talking).
- **Image uploads:** `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` — set all three (a partial set stops the API from booting). Until then, saving a listing *with* images answers 503 "Image hosting is not configured"; listings without images still work. `/api/health` reports `"imageUploads": true` once they're picked up.
- **Google sign-in:** `GOOGLE_CLIENT_ID` (and set `VITE_GOOGLE_CLIENT_ID` on the Vercel apps).

---

## Continuous integration
`.github/workflows/ci.yml` runs the backend test suite automatically on every push and pull request to `main` (unit + end-to-end). Watch it under the repo's **Actions** tab — keep it green before deploying. The website also has unit tests (`cd client-vite && npm test`); run them locally until CI covers the frontends.

## After each deploy — quick smoke check
1. `https://<api>/api/health` answers `{"status":"ok", ...}` (the first request after a quiet spell can take 30–60 s on Render's free plan).
2. Open the website, click a few links in the menu — pages must keep rendering.
3. Admin portal: sign in, open Trip requests and the Dashboard.

## Production readiness checklist
- [ ] Rotated the leaked Atlas DB password (Step 1) — the old `watamuser` one is compromised.
- [ ] `JWT_SECRET` is a strong value (Render generated it).
- [ ] `PAYMENTS_ENABLED=false` (M-Pesa stays off until you're ready).
- [ ] No secrets in the repo — all set in Render/Vercel dashboards.
- [ ] HTTPS everywhere (Render + Vercel do this automatically).
- [ ] Health check passing (`/api/health`).
- [ ] Atlas automated backups enabled (Atlas does daily snapshots on paid tiers; enable when you upgrade).
- [ ] Revoked the temporary GitHub push token.
- [ ] Admin account seeded (Step 3).

## Known follow-ups (not blockers)
- **Rate limiting** is in-memory (fine on Render's single free instance; add a shared store like Redis when you scale to multiple instances).
- **Error monitoring:** consider adding Sentry (or Render's log alerts) for production visibility.
- **Custom domains:** add them in Vercel/Render, then update `FRONTEND_URLS` accordingly.
