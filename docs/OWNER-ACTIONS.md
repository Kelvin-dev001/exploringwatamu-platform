# Owner actions

Things only the account owner can do (they need logins to Render, Vercel, Atlas,
GitHub, Cloudinary or an email provider). Nothing here was done on your behalf. In
rough order of importance; tick them off as you go.

## Security

- [ ] **Remove `BOOTSTRAP_ADMIN_EMAIL` and `BOOTSTRAP_ADMIN_PASSWORD` from Render.**
  *Why:* while set, every restart resets that admin's password to the Render value
  (the API now logs a warning each time), and the password sits in the dashboard.
  *How:* first sign in to the admin and check the account works; Render → service →
  Environment → delete both → Save. *Check:* the next deploy's logs no longer show
  `bootstrap admin password reset from env`.
- [ ] **Rotate the MongoDB Atlas database password** (the old `watamuser` credential
  leaked earlier). Atlas → Database Access → Edit → new password; update
  `MONGODB_URI` on Render. *Check:* `/api/health/ready` → `"database":"up"`.
- [ ] **Revoke old GitHub personal access tokens.** GitHub → Settings → Developer
  settings → Personal access tokens: delete every token you don't recognise or no
  longer use (including any created for earlier automated work). Use fine-grained
  tokens with an expiry for anything new.
- [ ] **Decide on guest quote requests and unverified sign-ups** (finding S6 in
  [`SECURITY-REVIEW.md`](SECURITY-REVIEW.md#s6--the-decision-needed)) and tell the
  team which option to implement.
- [ ] **Check Render's build command** if the service was created by hand: Settings →
  Build Command `npm ci --omit=dev`. (`render.yaml` only applies to Blueprint
  services; the live service name `exploringwatamu-platform` differs from the
  Blueprint's `exploringwatamu-api`.)

## Email and notifications

- [ ] **Configure SMTP on Render** (`SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`,
  `SMTP_USER`, `SMTP_PASS`, `MAIL_FROM`) with a verified sending domain — steps in
  [`OPERATIONS.md`](OPERATIONS.md#email-smtp). Until then travellers get no emails.
- [ ] **Set `ADMIN_NOTIFY_EMAIL`** to the inbox the team watches for new quote
  requests and bookings.
- *Check:* `/api/health/ready` → `"email": true`; request a password reset for your
  own account; Admin → Notifications shows it as `sent`.

## Monitoring

- [ ] **Uptime monitor** on `https://exploringwatamu-platform.onrender.com/api/health/ready`
  (UptimeRobot / Better Stack, every 5 min, alert by email/WhatsApp) — see
  [`OPERATIONS.md`](OPERATIONS.md#health-checks-and-uptime-monitoring).
- [ ] **Sentry (optional):** create a Node and a React project; set `SENTRY_DSN` on
  Render and `VITE_SENTRY_DSN` on both Vercel projects; add an alert rule.
- [ ] **Atlas alerts:** host down, connections, storage.

## Data

- [ ] **Backups.** The free Atlas tier has no automatic backups. Either run the
  `mongodump` backup in [`DATABASE.md`](DATABASE.md#backups) on a schedule (daily,
  stored off Atlas), or move to a tier with snapshots. Name who checks it weekly.
- [ ] **Test a restore** into a scratch database once (and then quarterly).

## Accounts and plans

- [ ] **Resolve the GitHub billing lock.** Actions can't run ("account is locked due
  to a billing issue"), so pull requests have no automatic checks — see
  [`TESTING.md`](../TESTING.md#restoring-ci).
- [ ] **Consider a paid Render instance.** The free one sleeps after 15 minutes
  (30–60 s first load for the next visitor), has no fixed outbound IP (so Atlas must
  allow `0.0.0.0/0`) and shares 750 free hours a month. A paid instance stays awake
  and has static IPs.
- [ ] **Node.js version:** Node 20 reached end of life on 30 April 2026. Plan the
  move to Node 22 LTS (Render setting / `NODE_VERSION`, and the CI workflow) in a
  dedicated change, with the full test suite run on 22.

## Content

- [ ] **Add genuine partner listings** (experiences, stays, transfers, car hire) with
  real photos and prices. Demo content (`npm run seed:demo`) is for staging only and
  must never be run against production.
- [ ] Ask partners for permission to use their photos and confirm prices regularly.

## Follow-ups for the team (no account needed)

- [ ] After **19 November 2026**: upgrade `@sentry/node` and `@sentry/react` to
  11.11 or later (clears the glob/minimatch advisories; releases are adopted once
  they are two weeks old).
- [ ] Replace `multer-storage-cloudinary` and move to `cloudinary` 2.x, verified on
  staging against a real Cloudinary account (finding S15).
- [ ] Before running more than one API instance: a shared rate-limit store.
