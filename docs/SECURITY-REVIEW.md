# Security review — November 2026 (Section 8, Phase 3)

A focused review of the API (`backend/`), the two web apps and their hosting
configuration. Each finding below was **reproduced on the code before the fix**
(a probe script against the previous commit on a throwaway database) and is
covered by a regression test that fails on the old code. Nothing was tested
against production data.

## Summary

| # | Sev | Area | Finding | Status |
|---|---|---|---|---|
| S1 | High | Sessions | A password reset or change did not end existing sessions: a stolen user token kept working for up to 7 days (admins: 2) after the reset. | **Fixed** — token version (`tv` claim) bumped by every password change |
| S2 | Medium | Rate limits | `GET /api/auth/me` (called on every page load) shared the 20-per-15-min sign-in limit: the 19th page load got 429, and the traveller (or everyone on the same hotel Wi-Fi) could no longer sign in. | **Fixed** — own limiter; reads and writes separated |
| S3 | Medium | Input | The original public booking forms (`/api/propertyviewings`, `/api/servicebookings`, `/api/carhire/book`) had no validation: `{"time": {"$ne": "x"}}` reached the availability query; hidden or unknown car hires could be booked; Mongoose error text was echoed. | **Fixed** — zod schemas, visibility check |
| S4 | Medium | Points | Safari Points redemption was read-check-save: 3 simultaneous redemptions of the same 10 points all succeeded. | **Fixed** — one atomic conditional `$inc` |
| S5 | Medium | CORS | `https://exploringwatamu.vercel.app` was an allowed origin (with credentials) but has no deployment — anyone could create a Vercel project with that name and become a trusted origin. | **Fixed** — removed (the website is `exploringwatamu-platform.vercel.app`) |
| S6 | Medium | Privacy | "My trips" shows guest quote requests to any account with the same email, and sign-up does not verify the email: registering with someone's address *before they do* reveals their guest requests. | **Open — needs your decision** (below) |
| S7 | Low | JWT | Tokens were verified without pinning the algorithm: an HS512 token made with the right secret was accepted. | **Fixed** — HS256 only, in one place (`services/tokens.js`) |
| S8 | Low | Reset | `/forgot-password` awaited the email only when the account existed, so the response time revealed which emails are registered. Limit was 20/15 min shared with sign-in. | **Fixed** — sent after answering; 5/hour per IP and 3/hour per address |
| S9 | Low | Search | List search boxes were used as raw regular expressions (`?name=(` → 500; patterns like `(a+)+$` run on the database); `?page=0` → 500; `?limit` unbounded. | **Fixed** — escaped literal match, bounded paging |
| S10 | Low | Errors | ~30 handlers answered `500 {"error": "Failed to ..."}` (some with `details: err.message`) and logged nothing, so production errors were invisible. | **Fixed** — central handler: logged, reported, no internals in the body |
| S11 | Low | Uploads | Any file type was streamed to Cloudinary before being refused there. | **Fixed** — image types/extensions only (400 `UPLOAD_TYPE`) |
| S12 | Low | Data | Trip-request notes: a non-string body wiped the stored notes. Quote lines unbounded. | **Fixed** — validated; max 100 lines |
| S13 | Low | Admin | Two admins removing each other at the same moment could leave no admin. Admin sign-in with a non-string password was a 500. | **Fixed** |
| S14 | Low | Hosting | The admin portal had no `X-Frame-Options` (could be framed) and no caching headers. `admin-vite/.env` was committed (only a localhost URL). | **Fixed** — headers in `vercel.json`; file untracked |
| S15 | High (advisory) | Dependencies | `cloudinary` 1.x / `multer-storage-cloudinary`: argument injection through `&` in upload parameters (GHSA-g4mf-96x5-5m2c). | **Accepted for now** — not reachable (below); upgrade planned |
| S16 | Moderate (advisory) | Dependencies | `glob` / `minimatch` via `@sentry/node` 11.9.0. | **Accepted for now** — not reachable; upgrade from 19 Nov 2026 |

## S6 — the decision needed

**What happens.** A guest's quote request is stored with their email. When anyone
signs in, "My trips" also lists guest requests whose email matches the account's
email (`tripRequestController.listMine`). Sign-up with a password does not prove the
person owns the address. So someone who knows a traveller's email, and registers it
before the traveller does, can read that traveller's guest requests (name, phone,
country, trip plan, the quote). Requests made while signed in are not affected (they
are linked by account id), nor are Google accounts (Google verifies the email).

**Why it isn't simply switched off.** While SMTP is not configured, "sign in with
the email you used and read the quote under My bookings" is how a guest sees their
quote (README, DEPLOYMENT). Linking only verified emails would end that for
travellers who sent a request as a guest and created a password account afterwards.

**Options.**
1. *Recommended, once SMTP is on:* add email verification at sign-up (a link, like
   the reset email) and link guest requests only to verified accounts (and Google
   accounts). Until a traveller verifies, they still see everything they sent while
   signed in.
2. *Now, without SMTP:* link guest requests only to Google accounts; password
   accounts see only what they sent signed in. Travellers who used the guest form get
   their quote from the team directly (WhatsApp/phone — Phase 4 adds click-to-chat).
3. Keep the current behaviour and accept the risk until 1 is possible.

Tell me which you prefer; 2 is a small change I can make in a follow-up.

## Area by area

**Authentication and JWTs.** Separate user and admin tokens with the same secret
(`JWT_SECRET`, at least 16 characters, the app refuses to boot without it). Admin
tokens carry `admin: true` and are re-checked against a live `Admin` record on every
request, so removing a teammate ends their access at once. User routes refuse admin
tokens and vice versa. New: HS256 pinned (S7), and `tokenVersion` on User and Admin
(S1): `setPassword` bumps it, tokens carry it as `tv`, and a mismatch is refused
("Your password was changed. Please sign in again."). Tokens from before this change
and accounts that never changed their password both count as version 0, so the
deploy signs nobody out. Changing your own admin password returns a fresh token.

**Password hashing.** bcryptjs, cost 12, for users and admins. Plaintext passwords are
never stored or logged (the logger also redacts any field that looks like a secret).

**Password reset.** 32 random bytes, only the SHA-256 hash stored, 60-minute expiry
(`RESET_TOKEN_TTL_MINUTES`), single use, Google-only accounts never get one, the
answer is the same for every email. New: the reset ends existing sessions (S1), the
response time no longer depends on whether the account exists, and limits per IP and
per address (S8). The reset link's token is stripped from error reports (Sentry).

**Admin route protection.** Every admin endpoint goes through `authAdmin`; the Phase 2
authorisation matrix (`tests/e2e/authorization.e2e.test.js`) checks that each one
answers 401 to the public and 403 to travellers, now including
`GET /api/group-trips/admin/:id`. All admins are full admins today (`requireRole`
exists for when a "staff" role is used). The last admin cannot be removed, even by
two simultaneous removals (S13).

**Ownership.** Travellers only ever query by their own id: group bookings
(`user: req.user._id`), trip requests (`user` or guest email — see S6), referral stats,
points, and reviews (edit/delete check the author). Changing an id in a URL cannot
reach another traveller's data: there is no traveller endpoint that takes a booking or
request id. Covered by the authorisation tests.

**CORS.** Allow-list of the two production apps plus `FRONTEND_URLS`; localhost only
outside production; unknown origins get no CORS headers (they used to get a 500). The
dead `exploringwatamu.vercel.app` was removed (S5) — if a custom domain is added, put
it in `FRONTEND_URLS`.

**Helmet.** Defaults (HSTS, nosniff, frame protection, a strict CSP — the API only
serves JSON). The web apps' headers are set in each `vercel.json`: nosniff,
referrer and permissions policies, and frame protection (admin: `DENY`; website:
`SAMEORIGIN`).

**Rate limits** (`middleware/rateLimiters.js`, per client IP, 15-minute windows unless noted):

| Limiter | Limit | Used by |
|---|---|---|
| global | 300 | everything |
| auth | 20 | sign-in, sign-up, Google sign-in, set new password, admin sign-in |
| session | 200 | `/auth/me`, "My trips" lists |
| reset request | 5 / hour | forgot password, per IP |
| reset address | 3 / hour | forgot password, per email address |
| booking | 30 | quote requests, group trip join, viewing/service/car-hire bookings |
| public read | 200 | availability checks, trip participants |
| admin | 600 | admin reads |
| admin write | 150 | every admin create/update/delete, including image uploads |

Reviews keep their own limiter (30); Phase 5 rebuilds reviews and should revisit it.

*Limitations of the in-memory store:* counts live in the API process. They reset on
every restart or deploy, and with more than one instance each keeps its own count (a
client could get N× the limit). That is fine on Render's single instance; before
scaling out, give the limiters a shared store (e.g. Redis with `rate-limit-redis`).
Counts are per `req.ip`, which depends on `TRUST_PROXY` (1 on Render: one proxy hop).
The request log's `ipHash` shows whether different visitors get different keys.

**Input validation.** zod via `validate()` on auth, trip requests (create, quote,
status, notes), group trips, group bookings, admin team, admin sign-in and, new, the
original public booking forms (S3). Admin listing forms rely on the Mongoose schemas
(admin-only, and errors now come back as 400 with field issues instead of 500).
JSON bodies are capped at 256 KB (the largest real one, a 30-day trip, is ~125 KB);
multipart text fields at 256 KB each and 100 fields.

**Uploads.** Admin-only; 8 MB per image; per-field counts (e.g. 10 gallery photos);
JPG/PNG/WebP/HEIC/AVIF only, checked by type or extension before anything is sent
(S11), and Cloudinary checks the real content against the same list; HEIC/AVIF are
stored as JPG; the folder is fixed per listing type. Failures answer 400/502/503 with
a message the admin can act on.

**Error responses.** One central handler. 4xx messages are passed through; 5xx answer
`{"error": "Internal server error", "requestId": "..."}` in production — never the
message or a stack trace — and are logged with the request id and reported to Sentry
when configured. The id is also in the `X-Request-Id` response header, so a user's
report can be matched to the log line.

**Environment variables.** Read and validated in one place (`config/env.js`); the API
refuses to boot without `MONGODB_URI` and a strong `JWT_SECRET`, or with half of the
Cloudinary variables. `render.yaml` marks every secret `sync: false`. `VITE_*`
variables end up in the browser bundle: only public values go there (API URL, Google
client id, Sentry browser DSN). `BOOTSTRAP_ADMIN_PASSWORD` resets that admin's
password on every boot while set — remove it (owner checklist).

**Logging and privacy.** Structured logs never contain request bodies, query strings,
passwords, tokens or secrets; emails and phone numbers are masked
(`a***@example.com`, `+2547******78`); IP addresses are logged as a short salted hash.
Error reports to Sentry drop bodies, headers, cookies, query strings and user data
(server and browser), and the browser sends no IP address or console messages.

**Dependencies** (`npm audit`, production dependencies):

| Package | Result |
|---|---|
| website, admin, e2e | 0 vulnerabilities |
| backend | 2 high (S15), 4 moderate (S16) |

*S15 — cloudinary 1.x.* The advisory needs attacker-controlled values in upload
*parameters*. Ours are fixed by the server (folder from a fixed list,
`allowed_formats`, `format`); only the file contents come from the admin. Fixing it
means `cloudinary` 2.x, which `multer-storage-cloudinary` doesn't support (its peer
range is `cloudinary ^1.21.0`; last release 4.0.0, June 2022): replace that package with a small storage engine using
`cloudinary.v2.uploader.upload_stream`, keep `middleware/upload.js`'s error mapping
and tests, and verify against a real Cloudinary account on staging. Not done blind in
this phase because it can't be verified without the real service.

*S16 — glob/minimatch.* Pulled in by `@sentry/bundler-plugins` (build tooling inside
`@sentry/node`); both need attacker-controlled glob patterns or calls, which nothing
here makes, and the SDK is only loaded when `SENTRY_DSN` is set. `@sentry/node` 11.11+
fixes it but was released less than two weeks ago (policy: no versions younger than
two weeks); upgrade from 19 November 2026.

## Not in scope here

- M-Pesa stays disabled (`PAYMENTS_ENABLED=false`; its routes aren't mounted). Its
  controller now logs through the logger and no longer echoes Safaricom's error to
  the client, but it was not otherwise reviewed.
- Reviews: anyone signed in can review any stay — Phase 5 (verified reviews).
- The Expo app (`client/`) is parked.
