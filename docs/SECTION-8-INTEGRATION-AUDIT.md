# Section 8 · Phase 1 — End-to-End Integration Audit

Branch `feature/integration-audit-fixes`, from `main` at `41c800d` (merge of PR #17).
Audit date: 10 November 2026.

This report covers the end-to-end audit of the public website (`client-vite`), the
API (`backend`) and the admin portal (`admin-vite`), the defects found, how each was
fixed and tested, and what still needs attention. The parked Expo app (`client/`)
was not touched. No new features (WhatsApp, reviews, Italian) were started.

---

## 1. How the audit was done

1. **Baseline.** Installed each app from its lockfile and ran every existing check
   before changing anything (section 2).
2. **Code trace.** Read each journey end to end: page → API client → route →
   middleware → validator → controller → model, and back to the admin screen that
   shows the result. Every request/response contract between the three apps was
   compared field by field.
3. **Fix + regression test.** Each confirmed defect got a root-cause fix and a
   test. Backend regression tests were then run against the *original* source
   (fixes stashed) to prove they detect the defect: 38 of the 62 tests in the new
   or extended suites failed on the old code and all pass on the new code. The
   client navigation-crash test was checked the same way.
4. **Live walkthrough.** Ran the real backend on a throwaway in-memory MongoDB
   (test credentials only, no SMTP/SMS/Cloudinary, nothing sent externally) with
   both frontends, and drove the journeys in Chromium 155 with Playwright,
   including a phone-sized admin viewport (section 5).
5. **Production (read-only).** Opened the live website and navigated once to
   confirm the critical defect D0 affects production. Nothing was submitted.

## 2. Baseline (before any change)

| Check | Result | Notes |
|---|---|---|
| Backend `npm test` (unit + E2E) | **Pass** 63/63, 14 suites | First run failed 16 tests with *hook timeouts* while other installs were running in parallel; the same suites pass alone and the full suite passes on a quiet machine (47 s). Fragile, not broken — see D18. |
| Backend startup | Not run against a real DB | Booted later against in-memory MongoDB for the walkthrough. |
| Public website build | **Pass** | 11 SEO route pages, sitemap, robots. |
| Admin build | **Fail → Pass** | Local `node_modules` predated Tailwind v4 (`@tailwindcss/vite` missing). `npm ci` from the lockfile fixed it; not a repo defect. |
| Admin lint | **Fail — 30 errors** | Pre-existing: 24 × `react-refresh/only-export-components`, 6 × `no-unused-vars` (incl. false positives for `icon: Icon` destructuring). Unchanged by this phase; fixing lint is Phase 2. |
| Public website tests / lint | None configured | No runner, no ESLint config. |
| E2E browser tests | None | |
| GitHub Actions | Not checked | `gh` is not authenticated on this machine. Phase 2 investigates billing. |

Local Node is v24.17; the project targets Node 20 (CI, Render). All tooling added in
this phase supports Node 20 (see section 7).

## 3. Journeys audited

| Journey | Main files inspected | Outcome |
|---|---|---|
| **A** Personalised discovery | `VibeOnboarding`, `ProfilePill`, `VibeProfileContext`, `lib/vibes.js`, `lib/match.js`, `PersonalHero`, `PickedForYou`, `Experiences`, `backend/constants/discovery.js`, admin `forms/VibeFields` | Vocabulary identical in all three apps (`ocean, slow, adventure, culture, romance, social` / `solo, couple, friends, family` / `easy, moderate, active`). Ranking logic correct. Defects: D7 (stale stored profile). |
| **B** Experiences & planner | `lib/catalog.js`, `lib/trip.js`, `TripContext`, `AddToTripButton`, `Board`, `TripDrawer`, `TripPlanner`, listing pages | Add/remove, days, drag-and-drop, "Move to…", busy-day warning, "Start me off", ready-made plans all trace correctly. Defects: D0 (navigation crash), D7, D14, D16, catalogue caching. |
| **C** Request a quote | `RequestQuoteSheet`, `toRequestPayload`, `TripRequested`, `MyTrips`; `tripRequestRoutes/Controller/Validators`, `TripRequest` model, `tripRequestNotifications`, `documents.js`; admin `TripRequests`, `TripRequest` | Field names, dates, adults/children, residency, day/item structure, listed prices, quote lines/total/currency/status/history and admin notes all match end to end. Honeypot works. Defects: D5, D6, D8, D17. |
| **D** Group-trip bookings | `GroupTripDetail`, `groupBookingController`, `groupTripController`, validators, `GroupBooking`/`GroupTrip`; admin `GroupTripBookings`, `Dashboard` | Seat guard (`$inc` + `$expr`) correct and preserved. Defects: D9 (double confirm/cancel), D10 (capacity on edit), D5 (toasts), D15 (sign-in return). |
| **E** Listing create/edit | All admin forms (`ExperienceForm`, `GroupTripForm`, `StayForm`, `SimpleForms`, `ImageUploader`, `kit`), all listing controllers/routes, `middleware/upload.js` | Every form matches its controller's field names. Upload failures map to clear 400/502/503 and no listing is saved on a failed upload (existing tests). Defects: D1 (visibility), D12 (gallery wipe on omission), stays used a different kept-photo contract, hotel invalid-JSON double response, HEIC/AVIF picker mismatch. |
| **F** Authentication | `AuthContext`, `Login`, `Register`, `ForgotPassword`, `ResetPassword`, `GoogleButton`; `userAuth.js`, `authUser`, `authAdmin`, `optionalUser`; admin `AdminAuthContext`, `lib/api.js` | User and admin tokens are correctly separated; reset tokens are hashed with expiry. Defects: D2, D3, D4, D15. |
| **G** Admin management | `Dashboard`, `adminOverviewController`, `Team`, `adminTeamRoutes`, `adminQuickRoutes`, catalogue screens, `DataView`, `Bookings`, `Notifications`, `FormPage` (`useBlocker`) | Quick edits only `$set` whitelisted fields and reject others (existing tests). Last-admin protection works. Unsaved-changes guard present. Defects: D1 (admin lists), D3, D5, D16. |

## 4. Defects found and fixed

Severity: **Critical** = site unusable or data loss for many users · **High** =
broken journey, security exposure or misleading staff/travellers · **Medium** =
wrong behaviour in realistic cases · **Low** = edge cases / polish.

| ID | Sev | Defect | Root cause | Fix | Tests |
|---|---|---|---|---|---|
| **D0** | **Critical** | **The public website goes blank on the first in-app navigation in current Chrome.** Reproduced on a production build and on the live site (`/` → click "Experiences" → empty page). | Chrome 155 returns a Promise from `window.scrollTo()`. `Layout` had `useEffect(() => window.scrollTo(0, 0), [pathname])`, so the Promise became the effect's "cleanup"; React called it on the next route change, threw `destroy is not a function` and unmounted the app (no error boundary). | Block-bodied effect. New `ErrorBoundary` around the app shows "Something went wrong — Reload" instead of a blank page. | `Layout.test.jsx` (jsdom) navigates with a Promise-returning `scrollTo`; fails with the exact production error on the old code. ErrorBoundary test. |
| D1 | High | Hidden listings shown publicly (services; properties only filtered client-side); hidden transfers/car hire vanished from the admin catalogue after a reload and could not be shown again. | Each list endpoint treated `active` differently: services/properties/tours only filtered when asked; transfers/car hire forced `active:true` for everyone, including the admin. | One rule (`services/listingVisibility.js`) for tours, transfers, car hire, services, properties: public = live only (lists and by id); signed-in admin (`optionalAdmin`) = everything, narrowable with `?active=`. | `listingVisibility.test.js`, `listingVisibility.e2e.test.js` (5 types × 4 cases). |
| D2 | High | Returning travellers silently signed out whenever `/auth/me` failed transiently (Render cold start, offline). | `AuthContext` deleted the token on *any* error. | Only 401/403 clear the session; otherwise `unreachable` + `retry()`. My Trips shows "Try again" instead of redirecting to sign-in. | Verified live with the API stopped (session kept, retry shown). Component test planned for Phase 2. |
| D3 | High | A removed admin kept full access until their JWT expired (up to 2 days). | `authAdmin` trusted the token alone. | `authAdmin` also loads the Admin record; missing → 401 (the admin UI signs out). | `adminSession.e2e.test.js`. |
| D4 | High | Google sign-in could link a Google identity to an existing email/password account without Google having verified the email (account-takeover risk). | `email_verified` was not checked. | Require `email_verified === "true"`; credential sent as an encoded param; email lowercased; timeout; 503 when not configured. | `googleAuth.e2e.test.js` (tokeninfo mocked). |
| D5 | High | Staff were told "Quote sent to …", "receipt emailed", "traveller emailed" while SMTP is not configured (the current production state); travellers were told "we've emailed…". The audit log could also record `sent` for mail never sent (host set, user missing). | UI copy assumed email works; mailer chose transport on host+user but logged on host only. | `config.mail.enabled` / `config.sms.enabled` drive transport and log. Quote, status, join, confirm and cancel responses carry `delivery: { email, sms }`. Admin shows a longer-lived **warning** toast ("…was NOT emailed — contact them directly"); traveller pages only promise email when it will be sent. | `notificationChannels.test.js`; delivery asserted in `tripRequest`, `groupTour`, `groupBookingSeats` E2E; verified live in the admin on a phone viewport. |
| D6 | Medium | Stays, car hire and services in a quote request arrived as kind `other`; the admin could not tell them apart. | Client mapped only tour/group/transfer; API enum lacked the others. | Shared `constants/tripItems.js`; client sends real kinds; admin tags item types. Existing `other` records stay valid. | Validator unit test, client payload test, E2E. |
| D7 | Medium | A damaged/outdated saved trip, share link or vibe profile could crash the planner; a retired vibe id blocked quote submission (API 400) and the onboarding (counted towards the 3-vibe cap with no tile to untick); a bad stored residency also failed the request. | Storage values used without validation. | `normalizeTrip`, `readProfileRecord`/`normalizeProfile`, whitelisted `getResidency`; payload sends only known vibes. | `trip.test.js`, `vibes.test.js`, `dates-and-storage.test.js`; corrupted storage verified live. |
| D8 | Medium | My Trips showed only the quote total ("full details in your email") — with SMTP off, travellers could never see what they were quoted. | Lines/message were in the API response but not rendered. | Quote lines, message, validity and a "write to us" link in My Trips. | Verified live end to end. |
| D9 | Medium | A double-tapped Confirm took two seats for one booking; a double Cancel released two. | Status checked by a read, then changed later. | Atomic conditional status change first; seat guard unchanged; rollback to pending if the guard refuses. | `groupBookingSeats.e2e.test.js` (parallel confirms/cancels, oversell attempt); double-click verified live. |
| D10 | Medium | The full trip edit form could set seats below confirmed travellers (quick edit already blocked this). | Missing check in `updateGroupTrip`. | Same rule, as a field issue the form shows. | E2E. |
| D11 | Medium | Malformed ids, schema errors and duplicates answered 500. | Central handler didn't know Mongoose errors; some controllers catch everything as 500. | 400/409 mapping in `errorHandler`; `:id` param guard → 404 on listing and trip-request routes. | `errorHandler.test.js`, E2E. |
| D12 | Medium | Omitting the kept-photos field on an update wiped a listing's gallery. Stays used a different contract (repeated `images` text values). | `parseJSON(undefined)` → `[]` replaced the gallery. | `services/gallery.js`: omitted → keep (append uploads); explicit list (even `[]`) → replace. Applied to tours, services, properties (pictures + documents), group trips, stays. Stay form now sends `existingImages`; legacy values still accepted. | `gallery.test.js`, `listingPhotos.e2e.test.js` (Cloudinary mocked). |
| D13 | Medium | Experience and group-trip pages said "not found / finished for the season" for any failure (e.g. a cold start); no feedback during 30–60 s waits; no retry. | Errors not distinguished; no bounded retry. | Real 404 → not found; other errors → "Try again". GETs retried twice (2 s, 5 s) on network/502/503/504, never writes. "Waking up our server" note after 6 s on loading states and while sending a quote. | `http.test.js`; verified live with the API stopped. |
| D14 | Medium | Public listing pages silently capped at 10 items. | API default `limit=10`, pages sent none. | Pages request up to 100 (`LIST_PARAMS`). | — (contract covered by visibility E2E). |
| D15 | Medium | Signing in from the group-trip join dialog (or My Trips) landed on My Trips instead of returning; Register ignored the return path. | `state.from` never passed; Register hard-coded. | Pass and honour `from` through Login ↔ Register. | Verified live. |
| D16 | Low–Med | Calendar dates showed a day early for visitors west of UTC, and group trips landed on the wrong planner day; admin dates followed the device time zone, not EAT. | Dates stored as UTC midnight formatted in local time. | `formatDay()` (UTC) on the website; `dayForStartDate` uses UTC parts; admin `date()` pinned to `Africa/Nairobi`. | TZ-switching tests (`America/Los_Angeles`, `America/New_York`). |
| D17 | Low | `/trip-requests/mine` showed a request made while signed in to one account to whichever account owned the contact email. | Email match not limited to guest requests. | Email matching applies to guest requests only. | E2E. |
| D18 | Low | Backend E2E hooks could exceed Jest's 5 s default on a busy runner. | Default timeout. | `testTimeout: 30000` (no assertion changed). | Full suite run. |

Smaller fixes made alongside: hotel update no longer sends two responses on invalid
JSON; the image picker accepts HEIC files with an empty MIME type and AVIF (as the API
does); a half-loaded catalogue is no longer cached for the whole visit; trip notes are
capped at the API's 2 000 characters; the quote form fills in name/email when the
session loads late.

## 5. Live walkthrough (local stack, Chromium 155)

All on throwaway local data; nothing sent externally.

- First visit → onboarding → personalised headline, "best matches", profile pill. ✔
- In-app navigation across pages (after D0 fix). ✔
- Hidden tour and hidden service absent from the public site; both present in the admin. ✔
- Add a tour, a stay and a service; "Move to…" a day; add airport transfers; reload — trip intact with correct kinds. ✔
- Corrupted saved trip/profile/residency → site renders, valid items kept, stale vibe dropped. ✔
- Quote form validation; guest submission → reference `EW-…` on the confirmation page. ✔
- Admin on a 390 px viewport: request list → detail with item-type tags, no horizontal scroll; price and send → honest "NOT emailed" warning; status Quoted. ✔
- Traveller registers with the same email → My Trips shows every quote line, message and validity. ✔
- Signed-out "Request to join" → Sign in → back on the trip → join request sent. ✔
- Admin double-taps Confirm → exactly one seat taken; honest toast. ✔
- API stopped → My Trips keeps the session, shows the waking-up note then "Try again". ✔
- A user whose account no longer exists (401) is signed out cleanly. ✔

## 6. Not fixed in this phase (recommendations)

Confirmed but deferred because they belong to a later phase, need a product decision,
or are low risk:

| Sev | Item | Suggested phase |
|---|---|---|
| Medium | Registration does not verify email ownership, so someone can create an account with another person's address and see that person's **guest** quote requests (D17 limits the rest). Needs an email-verification decision. | 3 (security) / owner |
| Medium | Listing list endpoints don't cap `limit` and pass `name`/`search`/`location` straight into `$regex` (ReDoS / heavy queries). | 3 |
| Medium | Legacy public `POST /api/carhire/book` and `/api/servicebookings/book` have no validation or rate limit; listing create/update controllers don't use zod. | 3 |
| Medium | User tokens survive a password reset; admin tokens survive an admin password change. | 3 |
| Medium | `trust proxy` = 1 must be checked on Render (if `req.ip` is the proxy, all visitors share one rate-limit bucket). `adminLimiter` (100 / 15 min per IP) may be tight for a shared office connection. | 3 (needs production logs) |
| Low | Last-admin protection can be raced by two admins deleting each other at the same instant. | 3 |
| Low | Removing a group trip's hero photo on edit keeps the old one; removing a vehicle photo isn't possible. | 3 |
| Low | Admin list rows nest the WhatsApp/email links inside the row link (`<a>` in `<a>`, React warns); legacy avatar buttons in the join flow have no accessible names and broken images. | 2/3 (a11y) |
| Low | `GET /group-trips/admin/all` is fetched to edit one trip. | 3 (performance) |
| Low | `eCardUrl` on bookings points to `/ecard/:id`, which isn't a website route (unused by any UI or email). | 3 |
| Low | Public participants feed shows confirmed travellers' names (privacy choice). | Owner decision |
| Low | Duplicate join requests by one account are allowed (may be intentional: booking for a friend). | Owner decision |
| Low | Uploads go to Cloudinary before the controller checks the listing exists (orphaned images on a 404). | 3 |
| — | Admin lint (30 pre-existing errors), frontend lint, CI coverage. | 2 |

## 7. Tooling added

- `client-vite`: **Vitest 4.1.12** (`npm test`), **jsdom 26.1.0**, **@testing-library/react 16.3.3**, **@testing-library/dom 10.4.2** — all dev-only, pinned, Node 20 compatible (Vitest 5 and jsdom 27+ need Node 22). Phase 2 extends coverage and adds lint and CI.
- No production dependency was added or upgraded in any app.

## 8. Production checks still needed (owner / after deploy)

1. **After merge, re-check the live site in current Chrome**: open the homepage, click a nav link — the page must stay rendered (D0).
2. Admin: hide and re-show a transfer and a service; confirm the website reflects it (D1).
3. With SMTP still unconfigured, send a quote from the admin and confirm the warning toast; once SMTP is set (owner action), confirm the toast says "Quote sent" and the email + PDF arrive.
4. A real photo upload + save on the stay form and on an experience edit (Cloudinary in production was not exercised).
5. Google sign-in on production (the client ID isn't authorised for `localhost`, so it couldn't be exercised here).
6. Check a Render log line for `req.ip` / rate-limit keys (section 6).
