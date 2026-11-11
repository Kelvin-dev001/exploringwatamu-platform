# ExploringWatamu Backend — Agent & Contributor Guide

## What this is
Node/Express 5 + MongoDB (Mongoose) REST API for the ExploringWatamu tourism platform.
Monorepo siblings: `admin-vite` (admin web), `client-vite` (MVP client web — **canonical**),
`client` (Expo mobile — a later phase).

## MVP focus
Open Group Tours + the vibe + referral/e-card loop. Watamu only. Admin-managed but built
vendor-ready. Payments (M-Pesa) are **disabled** until `PAYMENTS_ENABLED=true`; bookings are
confirmed by **admin approval**, not automated payment.

## Commands (run inside /backend)
- Install: `npm install`
- Dev: `npm run dev` (nodemon)
- Start: `npm start`
- Test: `npm test` (Jest + Supertest)
- Seed an admin: `npm run seed:admin -- <email> <password>`
- Demo listings (staging/local only): `npm run seed:demo -- --confirm-db=<database name>` (refuses production)

## Environment
Copy `.env.example` to `.env`. Required: `MONGODB_URI`, `JWT_SECRET` (>= 16 chars). The app
**fails fast** if these are missing or insecure. Never commit real secrets.
`CLOUDINARY_*` is optional but all-or-nothing: a partial set fails boot; none makes image
uploads answer 503. Upload routes use `uploadFields`/`uploadArray`/`uploadSingle` from
`middleware/upload.js`, never raw multer, so failures map to 400/502/503 instead of a 500.

## Architecture
- `src/config/env.js` — validated config; the single source for secrets and feature flags.
- `src/app.js` — Express app factory (helmet, CORS, rate limiting, routes, error handler).
  Exported so tests can import the app without a DB or a live port.
- `src/server.js` — starts error monitoring (if configured), connects the DB, then listens; logs and reports unhandled rejections and uncaught exceptions.
- Health: `/api/health` is liveness (no DB; Render's health check), `/api/health/ready` pings the DB (503 when down) and lists optional services.
- `src/routes/*` — thin routers. `src/controllers/*` — handlers. `src/models/*` — Mongoose schemas.
- `src/middleware/*` — `authUser`, `authAdmin`, `requireRole`, `validate` (zod), `rateLimiters`, `errorHandler`, `requestLogger` (request ids + one log line per request).
- `src/services/logger.js` — structured logs (JSON in production). `src/services/monitoring.js` — optional Sentry. `src/services/tokens.js` — every JWT is signed and verified here. `src/services/listQuery.js` — safe search (`contains`) and bounded paging (`pageParams`).
- `src/validators/*` — zod schemas.
- `src/services/*` — `mailer` (nodemailer; a safe no-op until SMTP is set), `documents` (pdfkit quotation/receipt PDFs), `bookingNotifications`. Mail/PDF libs are lazy-loaded so the app boots without them.
- `src/services/notifications/*` — `emailLayout` (branded email shell), `sms` (Africa's Talking via axios; no-op until configured), `authNotifications` (password reset), `log` (records every send to the `Notification` model). Email/SMS/reset all fill in here.
- `src/services/bookingRegistry.js` + `bookingService.js` — the unified booking engine. Every booking type (tour, carhire, service, propertyviewing, grouptour) has one registry entry; controllers share `paginate`/`cancelById`; `GET /api/bookings` gives admins one view across all types. Add a new booking type by adding a registry entry.

## Conventions
- Validate request input with zod via `validate(schema)` at the route — public routes always.
- Log with `services/logger`, never `console.*`: pass `requestId: req.id`, use `logger.errorFields(err)`, mask people with `logger.maskEmail` / `maskPhone`, never log bodies, query strings, tokens or passwords.
- Sign/verify JWTs only through `services/tokens` (HS256 pinned). `setPassword` bumps `tokenVersion`, which ends older sessions — keep using it for every password change.
- Search boxes: `contains(value)` (escaped, literal). Paging: `pageParams(req.query)` (bounded). Never put raw query values in a `$regex`.
- Rate limiters by purpose (`middleware/rateLimiters.js`): `bookingLimiter` for public writes, `sessionLimiter` for a traveller's own reads, `adminLimiter` / `adminWriteLimiter` for admin reads / writes. Don't share a limiter between page loads and form submits.
- Queries on growing collections need an index (declared on the model) and a line in `tests/e2e/indexes.e2e.test.js`.
- Never leak internal errors: `next(err)` and let the central handler format the response (it logs, reports and adds the request id). Don't answer `res.status(500)` yourself.
- Admin identities live in the `Admin` collection (hashed). Seed via the script — no env or
  plaintext admin passwords.
- Money and capacity changes must be atomic (see `confirmBooking` / `cancelBookingAdmin`).
- Emails are sent fire-and-forget (see `sendAsync`): a mail failure must never break a booking.
- Every listing carries an `owner` ref (null = platform-managed) so vendor self-service needs no migration later. Set `owner` on create.
- Listing visibility: use `activeFilter(req)` / `canSee(req, doc)` from `services/listingVisibility.js` with `optionalAdmin` on public reads — the public only ever sees `active !== false`; admins see everything.
- Photo lists on update: use `nextGallery()` from `services/gallery.js` — an omitted kept-photos field keeps the stored photos; a sent list (even `[]`) replaces them.
- Anything that notifies a traveller returns `delivery: deliveryFor(...)` so the UIs only say "emailed" when `config.mail.enabled`.
- WhatsApp is click-to-chat links only (`services/whatsapp.js`: `emailBlock`, `pdfLine`, prefilled `text`). Never hard-code the number — it's `config.whatsapp.number` (`WHATSAPP_NUMBER`, normalised by `utils/whatsappNumber.js`, the same rules as the website's and admin's copies). Links only for travellers, never in team emails.

## Working rules
- Plan first; no production code until the plan is approved.
- Feature branches + PRs; keep commits clean; don't break `main`.
- Run a security review before each deploy.
- Keep modules loosely coupled: Marketplace, Open Group Tours (MVP), Custom Trip Builder (future),
  Hosted Experiences (future).
