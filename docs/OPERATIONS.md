# Operations guide

How to run, deploy, watch and look after ExploringWatamu. First-time hosting setup
is in [`DEPLOYMENT.md`](../DEPLOYMENT.md); the database runbook in
[`DATABASE.md`](DATABASE.md); account-owner tasks in
[`OWNER-ACTIONS.md`](OWNER-ACTIONS.md).

| Piece | Where | Production URL |
|---|---|---|
| API (`backend/`) | Render, free web service | `https://exploringwatamu-platform.onrender.com/api` |
| Website (`client-vite/`) | Vercel | `https://exploringwatamu-platform.vercel.app` |
| Admin (`admin-vite/`) | Vercel | `https://exploringwatamuadmin.vercel.app` |
| Database | MongoDB Atlas | — |
| Photos | Cloudinary | — |

## Development setup

Node 20 or newer (CI uses 20), and a MongoDB you can write to (a free Atlas cluster
of your own, or MongoDB locally). Never point development at the production
database.

```bash
cd backend && npm ci && cp .env.example .env      # set MONGODB_URI and JWT_SECRET
npm run seed:admin -- you@example.com 'a-long-password'
npm run seed:demo -- --confirm-db=<your database name>   # optional demo listings
npm run dev                                        # http://localhost:5000/api

cd ../client-vite && npm ci && npm run dev         # http://localhost:5173
cd ../admin-vite && npm ci && npm run dev          # next free port, e.g. :5174 (VITE_API_URL in .env.local)
```

Tests: see [`TESTING.md`](../TESTING.md).

## Environment variables

Secrets live only in the Render and Vercel dashboards (and your own `.env`, which
git ignores). `.env.example` in each app lists every name.

**API (Render)**

| Variable | Required | What |
|---|---|---|
| `MONGODB_URI` | yes | Atlas connection string |
| `JWT_SECRET` | yes | ≥ 16 characters (Render generates one). Changing it signs everyone out |
| `NODE_ENV` | yes | `production` |
| `FRONTEND_URL` | yes | Website URL used in emails and reset links |
| `FRONTEND_URLS` | — | Extra allowed origins (comma-separated), e.g. a custom domain |
| `TRUST_PROXY` | — | Proxy hops in front of the API; `1` on Render (default) |
| `LOG_LEVEL` / `LOG_FORMAT` | — | `info` / `json` in production by default |
| `SENTRY_DSN`, `SENTRY_ENVIRONMENT` | — | Error monitoring (off while `SENTRY_DSN` is empty) |
| `CLOUDINARY_CLOUD_NAME`, `_API_KEY`, `_API_SECRET` | — | Photo uploads: all three or none |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`, `MAIL_FROM` | — | Email (on when host and user are set) |
| `ADMIN_NOTIFY_EMAIL` | — | Where new-request and booking alerts go |
| `AT_USERNAME`, `AT_API_KEY`, `AT_SENDER_ID`, `AT_ENV` | — | SMS (Africa's Talking) |
| `GOOGLE_CLIENT_ID` | — | Google sign-in |
| `WHATSAPP_NUMBER` | — | Public business WhatsApp number (`+254…`) for "Chat on WhatsApp" links in quote emails and PDFs; empty = no links. See [WHATSAPP.md](WHATSAPP.md) |
| `BOOTSTRAP_ADMIN_EMAIL`, `BOOTSTRAP_ADMIN_PASSWORD` | — | First admin only — **remove once you can sign in** |
| `PAYMENTS_ENABLED` | — | Keep `false` |

**Website and admin (Vercel)** — everything here is visible in the browser; never
put a secret in a `VITE_` variable.

| Variable | What |
|---|---|
| `VITE_API_URL` | `https://exploringwatamu-platform.onrender.com/api` |
| `VITE_GOOGLE_CLIENT_ID` | Website only, for Google sign-in |
| `VITE_WHATSAPP_NUMBER` | Website only: the public business WhatsApp number (`+254…`) for the WhatsApp buttons; empty = hidden. Same number as `WHATSAPP_NUMBER`; redeploy after changing it |
| `VITE_SENTRY_DSN`, `VITE_SENTRY_ENVIRONMENT` | Browser error monitoring (a browser DSN is public by design) |
| `VITE_SITE_URL` | Website only, optional: the canonical URL if it isn't the Vercel production URL |

## Deploying

Merging a pull request into `main` deploys everything: Render rebuilds the API
(`npm ci --omit=dev`, then `npm start`) and Vercel rebuilds both web apps. There is
no manual step. Before merging, the checks in `TESTING.md` must pass (CI, or locally
while GitHub Actions is blocked).

After each deploy:

1. `GET https://exploringwatamu-platform.onrender.com/api/health` shows the new
   `release` (the commit) — the first request after a quiet spell can take 30–60 s.
2. `GET .../api/health/ready` answers `{"status":"ok","database":"up", ...}`.
3. Website: open a few pages from the menu. Admin: sign in, open the Dashboard and
   Trip requests.

**Render service created by hand?** It does not read `render.yaml`. Make sure its
settings match: Root Directory `backend`, Build `npm ci --omit=dev`, Start
`npm start`, Health Check Path `/api/health`, and the variables above.

## Rolling back

- **API (Render):** service → Deploys → pick the last good deploy → **Rollback**.
  Render redeploys that build; turn off auto-deploy until `main` is fixed, or the
  next merge will deploy again.
- **Website / admin (Vercel):** project → Deployments → the last good production
  deployment → **⋯ → Instant Rollback** (or *Promote to Production*).
- **Code:** revert the merge on GitHub (*Revert* on the pull request) and merge the
  revert; that redeploys everything from a clean `main`.
- **Database:** code rollbacks never change data. New indexes are harmless to older
  code. If data itself was damaged, see [`DATABASE.md`](DATABASE.md#restoring).

## Rotating secrets

Rotate when a secret may have leaked, when someone with access leaves, and yearly.
Change it at the provider, then in Render/Vercel (which redeploys), then check
`/api/health/ready`.

| Secret | Where to rotate | Effect |
|---|---|---|
| `JWT_SECRET` | Render → Environment (any long random string) | Everyone, admins included, is signed out |
| Atlas password | Atlas → Database Access → Edit user, then `MONGODB_URI` on Render | API restarts with it; old password stops working at once |
| Cloudinary key/secret | Cloudinary → Settings → API Keys (create new, update Render, then delete the old) | Uploads use the new key; stored photo URLs don't change |
| SMTP password | Your email provider, then `SMTP_PASS` | — |
| Africa's Talking key | AT dashboard, then `AT_API_KEY` | — |
| Google client | Google Cloud console; update both `GOOGLE_CLIENT_ID` and `VITE_GOOGLE_CLIENT_ID` | — |
| Sentry DSN | Sentry → Project → Client Keys | Old key stops accepting reports |
| An admin's password | Admin → Team → Password | That admin is signed out everywhere |
| A traveller's password | They use "Forgot password" | All their sessions end |

## Admins

- **Add:** Admin → Team → *Add a teammate* (email, name, a generated temporary
  password — share it privately and ask them to change it). Every admin has full
  access.
- **Change a password:** Team → *Password*. It signs that admin out on every device;
  changing your own keeps this session.
- **Remove safely:** Team → *Remove*. Their access ends immediately (even with a valid
  token). The last admin can never be removed — add the replacement first. If you
  remove yourself you are signed out.
- **Locked out entirely:** in Render's Shell, `npm run seed:admin -- you@example.com
  'new-long-password'`. (Or set `BOOTSTRAP_ADMIN_EMAIL`/`PASSWORD`, deploy, sign in,
  then remove both variables — while they are set, every restart resets that admin's
  password.)

## Cloudinary (photos)

1. Create a Cloudinary account; from the dashboard copy the cloud name, API key and
   API secret into the three `CLOUDINARY_*` variables on Render.
2. `/api/health` shows `"imageUploads": true`.
3. Uploads go to folders per listing type (`tours`, `hotels`, `group-trips`, ...).
   HEIC/AVIF photos are stored as JPG.
4. The website and admin ask Cloudinary for resized versions at display time
   (`f_auto,q_auto,c_limit,w_…`, e.g. a 640 px WebP for a card). Each size is made
   once and cached by Cloudinary; on the 12 photos live today a card version is ~75%
   smaller than the original. Keep **Settings → Security → Strict transformations**
   off; if it is ever turned on, the sites fall back to the full-size originals
   (slower, but nothing breaks).
5. Generated sizes count toward the plan's transformation quota (a few sizes per
   photo — tiny at today's volume). Check usage in the Cloudinary dashboard.

## Email (SMTP)

1. Pick a provider (e.g. Brevo, Mailgun, Postmark, Google Workspace SMTP relay) and
   verify the sending domain (SPF/DKIM) so mail isn't marked as spam.
2. Set on Render: `SMTP_HOST`, `SMTP_PORT` (587), `SMTP_SECURE` (`false` for 587,
   `true` for 465), `SMTP_USER`, `SMTP_PASS`, `MAIL_FROM`
   (`ExploringWatamu <bookings@your-domain>`), and `ADMIN_NOTIFY_EMAIL`.
3. Check: `/api/health/ready` → `"email": true`; use "Forgot password" on the website
   with your own account; Admin → Notifications shows the email as `sent`. Failures
   appear there as `failed` with the reason, and in the logs as `email failed`.

Until email is on, nothing is emailed (logged as `skipped`), the admin is told so
after sending a quote, and travellers read quotes under **My bookings**.

## Error monitoring (Sentry)

Optional and off until configured; the apps never depend on it.

1. Create a Sentry organisation with two projects: **Node.js** (API) and **React**
   (website and admin can share it, or use one each).
2. API: put the Node project's DSN in `SENTRY_DSN` on Render (and
   `SENTRY_ENVIRONMENT=production`). The log line `error monitoring on` confirms it;
   `/api/health/ready` shows `"errorMonitoring": true`.
3. Website/admin: put the React project's DSN in `VITE_SENTRY_DSN` on each Vercel
   project and redeploy (it is read at build time).
4. In Sentry, set an alert rule (e.g. email on every new issue).

What is reported: unhandled API errors (5xx) with the route and request id;
uncaught exceptions and unhandled rejections (API and browser); crashes caught by the
website's error boundary and the admin's error screen. Releases are tagged with the
commit. What is never sent: request bodies, headers, cookies, query strings, user
details, IP addresses, browser console messages.

Browser stack traces are minified because source maps are not uploaded. To add
them later: `@sentry/vite-plugin` with a `SENTRY_AUTH_TOKEN` on Vercel,
`build.sourcemap: 'hidden'`, and the plugin's option to delete the maps after
upload (so they are never public).

## Logs

Render → service → **Logs**. In production every line is one JSON object:

```json
{"time":"2026-11-11T05:14:44.345Z","level":"info","msg":"request","requestId":"691f…","method":"GET","route":"/api/tours/:id","status":200,"durationMs":12.4,"ipHash":"ba8673f60ddc"}
```

- Every response carries an `X-Request-Id` header, and 5xx bodies include
  `requestId`: search the logs for it to find the request and its error line.
- Search `"level":"error"` for problems; `email failed`, `SMS failed`,
  `unhandled error`, `database disconnected` are the usual ones.
- Emails/phones are masked and IPs hashed; bodies and query strings are never logged.
- More detail temporarily: `LOG_LEVEL=debug` (also logs health checks).

## Health checks and uptime monitoring

| Endpoint | Meaning | Use for |
|---|---|---|
| `GET /api/health` | The process is up (no database call). Shows `env`, `uptime`, `release`, `imageUploads`. | Render's health check (a database blip must not restart a healthy server) |
| `GET /api/health/ready` | Can serve data: pings the database (2 s limit). **503** when it is down. Lists optional services as true/false — never fails because of them. | An external uptime monitor |

**Set up an uptime monitor** (needs an account, so it is an owner task): e.g.
UptimeRobot or Better Stack (free plans), an HTTP(S) monitor on
`https://exploringwatamu-platform.onrender.com/api/health/ready`, every 5 minutes,
alert when the status is not 200 or the body lacks `"database":"up"`, notify by
email/WhatsApp. Add a second monitor on the website's home page.

Note: a monitor every 5 minutes also keeps Render's free instance from going to sleep
(it sleeps after 15 minutes without traffic). That uses the workspace's free instance
hours (750 a month — enough for one service running all month).

## Render cold starts

On the free plan the API sleeps after 15 minutes without requests; the next request
waits while it starts (typically 30–60 s; the server itself is ready in under a
second once Node is running). The website retries reads while it wakes up, and the
admin says "the API may be waking up".

- Seeing slow first loads: check Render → Events for "Service started"; that's a cold
  start, not a bug.
- To avoid them: the uptime monitor above, or a paid Render instance (always on, and
  static outbound IPs for Atlas's network access list).
- If `/api/health` never answers: Render → Logs. `failed to start server` with
  `database connection failed` means Atlas refused the connection (password, network
  access list, or Atlas down); a `[config]` message names a missing or invalid
  variable.

## Reviews

Travellers review listings after their trip; the team approves them in the admin
(**Reviews**). Details, rules and the API: [REVIEWS.md](REVIEWS.md).

```bash
cd backend
npm run reviews:migrate -- --dry-run                    # legacy stay reviews: what would be copied
npm run reviews:migrate -- --confirm-db=<database name> # copy them (never changes the originals)
npm run reviews:invite                                  # post-trip invitations: dry run
NODE_ENV=production npm run reviews:invite -- --send    # send (normally the Render Cron Job)
npm run reviews:recompute -- --confirm-db=<database name> # repair every listing's rating
```

The invitation job needs a scheduler: a daily Render Cron Job (settings in
[REVIEWS.md](REVIEWS.md#scheduling-it-on-render)). It sends nothing while SMTP is off.

## English and Italian

The website serves Italian under `/it/…` ([LOCALISATION.md](LOCALISATION.md)). Nothing to
configure. Things to know when operating it:

- **Deploy order doesn't matter.** An API without Phase 6 ignores the `locale` the website
  sends (the request still succeeds; emails are English); a website without it simply
  doesn't send one. Records without a language are treated as English.
- **After a website deploy**, `/it`, `/it/experiences` and a refresh on an
  `/it/experiences/<id>` page should all load in Italian. A blank or English shell there
  means the `/it/(.*)` rewrite in `client-vite/vercel.json` isn't applied.
- **Changing a text** means changing both languages (`client-vite/src/locales/`,
  `backend/src/i18n/`); the tests fail if one is missing.
- **Italian listing text** is edited by the team in the admin (**Italian (optional)** on each
  listing). A listing with an Italian description gets its own Italian page in search results.

## Demo content (staging and local only)

```bash
cd backend
npm run seed:demo -- --dry-run --confirm-db=<database name>   # what it would add
npm run seed:demo -- --confirm-db=<database name>
```

Adds 13 listings labelled "Demo · …" (experiences, stays, a service, a property, a
transfer, car hire, vehicles and a bookable group trip two months out), with no
photos. Running it again adds nothing; it never changes or deletes anything. It
refuses `NODE_ENV=production`, and refuses to write unless `--confirm-db` names the
database it is connected to (it tells you the name). Remove demo listings from the
admin (or hide them) when you no longer need them. Never run it against production:
demo listings must not look like partner inventory.

## Troubleshooting

| Symptom | Look at |
|---|---|
| Website/admin: "Can't reach the server" | Cold start (wait a minute); `/api/health`; Render logs |
| Image upload answers 503 | `CLOUDINARY_*` not set (`/api/health` → `imageUploads: false`) |
| Image upload 400 "not a supported image" | Only JPG, PNG, WebP, HEIC/AVIF are accepted, up to 8 MB |
| No WhatsApp buttons on the website | `VITE_WHATSAPP_NUMBER` unset or not a usable number, or the site wasn't redeployed after setting it ([WHATSAPP.md](WHATSAPP.md)) |
| No WhatsApp link in quote emails | `/api/health/ready` → `whatsappLinks`; a bad `WHATSAPP_NUMBER` is logged at startup |
| A review isn't on the website | It is still **Waiting** (Admin → Reviews) or **Hidden**; only approved reviews show |
| A traveller can't review a trip | The trip request must be **accepted** with dates in the past (or the group booking confirmed and the trip over); guest requests need the invitation link or a Google sign-in ([REVIEWS.md](REVIEWS.md)) |
| A rating looks wrong | `npm run reviews:recompute -- --confirm-db=<db>` (ratings count approved reviews only) |
| Travellers say they got no email | `/api/health/ready` → `email`; Admin → Notifications (`skipped` = SMTP not set, `failed` = provider error) |
| 429 "Too many requests" | Rate limits (see `SECURITY-REVIEW.md`); they reset after 15 min, or on deploy |
| Admin signed out unexpectedly | Their password was changed, they were removed, or `JWT_SECRET` changed |
| Browser blocks API calls (CORS) | The site's origin isn't in the allow-list: add it to `FRONTEND_URLS` |
| A 500 reported by a user | Ask for the request id (in the error body / `X-Request-Id`), search the logs |
