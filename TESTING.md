# Testing ExploringWatamu

Four test suites, all runnable on a laptop with no accounts, secrets or network
services: nothing is emailed, texted, uploaded or written to a real database.

| Where | Tool | Command | What it covers |
|---|---|---|---|
| `backend/` | Jest + Supertest + in-memory MongoDB | `npm test` (`test:unit`, `test:e2e`) | The API: auth and sessions, authorisation, validation, rate limits, bookings and seats, quotes, listings, uploads, notifications, logging, monitoring, health checks, indexes, demo seed. Details in [`backend/TESTING.md`](backend/TESTING.md). |
| `client-vite/` | Vitest + React Testing Library | `npm test`, `npm run lint` | The website's logic (planner, matching, catalogue, storage, retries, dates, image sizes, error monitoring), English and Italian (language URLs and memory, message parity, built SEO pages, sitemap, bot previews) and key components (sign-in session, quote form, add-to-trip, navigation, language switcher, page metadata, photos with fallbacks). |
| `admin-vite/` | Vitest + React Testing Library | `npm test`, `npm run lint` | Admin helpers, the form kit and unsaved-changes guard, list screens, quick edits, toasts, the error screen (stale builds after a deploy), session token refresh, error monitoring, Italian listing fields and WhatsApp replies. |
| `e2e/` | Playwright (Chromium) | `npx playwright test` | The main journey in a real browser on a phone viewport, with all three apps running (below). |

Use **Node 20**, as CI and Render do (the test tools are pinned to versions that support it).

## First time

```bash
cd backend && npm ci
cd ../client-vite && npm ci
cd ../admin-vite && npm ci
cd ../e2e && npm ci && npx playwright install chromium   # only for the browser smoke test
```

The backend's E2E tests download a MongoDB binary on the first run (cached in `~/.cache/mongodb-binaries`).

## Contract tests

The discovery tags (vibes, who it suits, energy) and the trip-planner item kinds are
defined by the API and repeated in the website and the admin. Tests in
`client-vite/src/lib/contracts.test.js` and `admin-vite/src/forms/discovery.contract.test.js`
read the API's own modules (`backend/src/constants/`), so changing a tag on one side
fails a test instead of silently breaking matching or quote requests.

## Browser smoke test (`e2e/`)

`npx playwright test` starts, on your machine:

- the API on a throwaway in-memory database, with test-only credentials, seeded with a
  live tour (with Italian text) and a hidden one (`e2e/scripts/smoke-api.js`) — port 5055;
- a production build of the website — port 4173;
- a production build of the admin portal — port 4174;

then, on a Pixel 7 viewport: a first-time visitor finds an experience through the menu,
adds it, sends a quote request and gets an `EW-` reference; the admin signs in, opens
that request, sends the pre-filled quote and is warned that nothing was emailed. A
second spec (`whatsapp.spec.js`) checks the WhatsApp links — menu, footer, a stay card,
an experience page, the planner's review step and the admin's "Reply on WhatsApp" —
with a placeholder business number; the links are checked, never followed. A third
(`reviews.spec.js`) follows a verified review: a traveller with a finished, accepted
trip writes one, the admin approves it, and it appears with its rating on the
experience page. A fourth (`localisation.spec.js`) checks English and Italian: the
built pages and sitemap crawlers read, switching and remembering the language, links
keeping it, and an Italian quote request reaching the team marked as Italian, with an
Italian WhatsApp reply. It never touches production data. A failing run leaves a trace in `e2e/test-results/`
(open with `npx playwright show-trace`).

If you already have something on ports 5055, 4173 or 4174, stop it first (locally,
Playwright reuses a server that is already running on those ports).

## Continuous integration

`.github/workflows/ci.yml` runs on every pull request to `main` and every push to
`main`, on Node 20 and Ubuntu 24.04:

| Job | Steps |
|---|---|
| Backend | `npm ci` → unit tests → E2E tests |
| Website | `npm ci` → lint → tests → build |
| Admin | `npm ci` → lint → tests → build |
| Browser smoke test | after the three above pass: install all four packages and Chromium → Playwright |

No secrets are needed. A failing smoke test uploads its HTML report as an artifact.

> **GitHub Actions currently does not run for this repository**: GitHub refuses to start
> jobs ("The job was not started because your account is locked due to a billing
> issue"). That is an account setting, not a failing test — see
> [Restoring CI](#restoring-ci). Until it is fixed, run the checks locally before merging.

### Restoring CI

The repository owner needs to clear the billing lock on the GitHub account:

1. Open **github.com → Settings → Billing and plans** (for the account that owns the
   repository) and resolve what is flagged there — usually a failed payment or an
   unpaid invoice; update the payment method or pay the outstanding amount.
2. If a **spending limit** for Actions is set to $0 and the account has used its free
   minutes, raise it or wait for the monthly reset.
3. Re-run the latest workflow from the **Actions** tab (or push a new commit) and check
   that all four jobs start.

Public repositories normally get GitHub-hosted minutes free; the lock is about the
account's billing status, so changing the workflow file cannot fix it.
