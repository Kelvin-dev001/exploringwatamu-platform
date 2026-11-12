# Database: indexes, backups and restores

Production data lives in **MongoDB Atlas** (the cluster and database named in
Render's `MONGODB_URI`). This page covers how it is indexed, how to back it up, how
to restore and check a backup, and what only the Atlas account owner can set up.

## Indexes

Mongoose builds every index declared in `backend/src/models` when the API starts
(`autoIndex`, the default). At today's size the builds take milliseconds; they run in
the background and never block requests.

| Collection | Index | Serves |
|---|---|---|
| `triprequests` | `{reference}` unique | Look-up by `EW-` reference |
| | `{status, createdAt -1}` | Admin inbox filtered by status; dashboard's oldest "new" requests |
| | `{createdAt -1}` | Admin inbox, all statuses |
| | `{user, createdAt -1}`, `{contact.email}` | "My trips" (signed-in requests, plus guest requests with the same email) |
| `groupbookings` | `{user, createdAt -1}` | A traveller's bookings |
| | `{trip, status, createdAt -1}` | A trip's confirmed participants; the trip's bookings (admin) |
| | `{status, createdAt}` | Pending bookings to approve (dashboard) |
| | `{createdAt -1}` | Admin list, newest first |
| `grouptrips` | `{slug}` unique, `{status, startDate}`, `{vibes}` | Trip pages; published trips by date; matching |
| `notifications` | `{createdAt -1}`, `{status, createdAt -1}` | Delivery log; recent failures on the dashboard |
| `propertyviewingbookings` | `{property, date, time}`, `{status, date}` | Slot check; upcoming viewings |
| `servicebookings` | `{service, date, time}` | Slot check |
| `carhirebookings` | `{carHire, status, startDate}` | Date-overlap check |
| `users` | `{email}` unique, `{googleId}` / `{referralCode}` unique sparse, `{resetTokenHash}` sparse | Sign-in; Google; referrals; every reset attempt |
| `admins` | `{email}` unique | Admin sign-in |
| `payments` | `{checkoutRequestId}` | M-Pesa callbacks (payments are off) |
| `listingreviews` | `{listingType, listingId, status, createdAt -1}` | A listing's approved reviews (website) and its rating |
| | `{user, createdAt -1}`, `{status, createdAt -1}`, `{booking.type, booking.id}` | A traveller's reviews; the moderation queue; a booking's reviews (eligibility, invitations) |
| | `{booking.type, booking.id, listingType, listingId}` **unique** (partial: with a booking) | One review per listing per booking, enforced by the database |
| | `{legacy.source, legacy.id}` **unique** (partial) | Each legacy review imported once |
| `reviewinvites` | `{bookingType, bookingId}` **unique** | One post-trip invitation per booking |
| `reviews` | (legacy, not written any more) | The old stay-only reviews, kept as they were; see [REVIEWS.md](REVIEWS.md#legacy-reviews-what-exists-and-the-migration) |
| listings (`tours`, `hotels`, ...) | `{vibes}` on tours | Small curated collections: no other index pays for itself yet |

**Measured** (`backend/tests/e2e/indexes.e2e.test.js`, 400 documents per collection):
every query above uses its index and returns the same rows as a full scan. Documents
read per query, without → with the index:

| Query | Full scan | Indexed |
|---|---|---|
| Admin inbox, by status / all (20 per page) | 400 | 20 |
| "My trips" (48 matches) | 400 | 56 |
| A trip's confirmed participants | 400 | 17 |
| Pending bookings (dashboard) | 400 | 6 |
| Recent failed notifications | 400 | 3 |
| Viewing / service slot check | 400 | 4 |
| Car hire free on the dates (nothing found) | 400 | 50 |
| Password reset token (wrong token) | every user | 0–1 |

Removed declarations: `TripRequest.reference` declared both `unique` and `index`
(one index either way) and a single `{status}` index, now the prefix of
`{status, createdAt}`. Mongoose never drops indexes on its own, so production may
still have `status_1` on `triprequests`. It is harmless; to tidy up, in Atlas →
Collections → `triprequests` → Indexes, drop `status_1` (never drop `_id_` or
`reference_1`).

When adding a query on a growing collection (bookings, requests, notifications,
users), add the index next to the model and a line to the test above.

## Languages (Phase 6)

New fields, all optional; no migration and no new indexes (nothing queries by them):

| Collection | Field | Meaning |
|---|---|---|
| `triprequests`, `groupbookings` | `locale`: `en` \| `it` (default `en`) | The language the traveller used on the website; their emails, SMS and PDFs are in it. Records from before Phase 6 have none and read as English. |
| `tours`, `services`, `propertyforsales` | `titleIt`, `descriptionIt` | Optional Italian text written by the team |
| `grouptrips` | `titleIt`, `shortDescriptionIt`, `descriptionIt` | (Italian of `title`, `shortDescription`, `fullDescription`) |
| `hotels`, `transfers`, `carhires` | `descriptionIt` | |

An empty string means "no Italian text" (the admin clears a field that way); the website
then shows the English. See [LOCALISATION.md](LOCALISATION.md).

## Backups

**What Atlas does depends on the cluster tier** — check the tier in Atlas →
Database:

| Tier | Automatic backups |
|---|---|
| Free (M0) | **None.** You must take your own (below). |
| Flex | Daily snapshots, kept for a short period (see Atlas's plan page for the current retention). |
| Dedicated (M10+) | Cloud Backup: configurable schedule and retention, point-in-time restore optional. |

**Recommended policy** for this business (bookings and quote requests are the data
that matters; listings can be re-entered):

| | |
|---|---|
| Frequency | Daily |
| Retention | 7 daily + 4 weekly + 3 monthly |
| Storage | Off Atlas: a private cloud folder or bucket owned by the business (plus Atlas snapshots if the tier has them) |
| Responsible | The owner (or a named teammate) — check weekly that the latest backup exists and opens |

### Taking a backup yourself (works on every tier)

Install the [MongoDB Database Tools](https://www.mongodb.com/docs/database-tools/)
(`mongodump`, `mongorestore`) on a trusted computer. Use a **read-only** Atlas
database user for backups (Atlas → Database Access → add user with the built-in role
`readAnyDatabase` or `read` on the app database).

```bash
# One compressed archive with every collection of the app database.
mongodump --uri "mongodb+srv://BACKUP_USER:PASSWORD@CLUSTER/DBNAME" \
  --archive="ew-$(date +%Y-%m-%d).archive.gz" --gzip
```

Keep the URI out of shell history (e.g. put it in a password manager and paste it,
or use `--config` with a file only you can read). Store the archive in the
off-Atlas location; delete archives older than the retention above.

## Restoring

Never restore straight over production. Restore into a **separate** database first,
check it, and only then decide.

```bash
# 1. Restore into a scratch database (here: ew_restore_check) on a staging cluster
#    or a local MongoDB. nsFrom/nsTo rename the database on the way in.
mongorestore --uri "mongodb+srv://ADMIN_USER:PASSWORD@STAGING_CLUSTER" \
  --archive="ew-2026-11-10.archive.gz" --gzip \
  --nsFrom="DBNAME.*" --nsTo="ew_restore_check.*"
```

**Verify the restore**

1. Document counts per collection look right (Atlas → Collections, or
   `db.getCollectionNames().forEach(c => print(c, db[c].countDocuments()))` in `mongosh`).
2. The newest trip request and group booking are from just before the backup time.
3. Point a local or staging API at it (`MONGODB_URI=.../ew_restore_check`), start it:
   `GET /api/health/ready` answers `{"database": "up"}`; sign in to the admin with a
   known admin; open Trip requests and a recent booking.
4. Record the date, archive name and result (a line in a shared note is enough).

**Restoring production** (only after a real loss, with the steps above done first):
put the site into a quiet period (tell the team; optionally pause the Render service),
then restore the checked archive into the production database with
`mongorestore ... --drop` for the affected collections only (`--nsInclude="DBNAME.triprequests"`),
restart the API, and repeat the checks. Anything written between the backup and the
restore is lost — export it first if the database is still readable.

Test a restore at least once a quarter: a backup that has never been restored is not
a backup.

## Atlas settings only the owner can change

- [ ] **Backups**: on M0, run the manual backup above on a schedule (a calendar
      reminder works). Consider Flex or a dedicated tier for automatic snapshots.
- [ ] **Rotate the database user's password** (the old `watamuser` credential leaked
      earlier): Atlas → Database Access → Edit → new password, then update
      `MONGODB_URI` on Render (the API restarts with it).
- [ ] **Separate users**: the app's user needs `readWrite` on the app database only;
      a separate read-only user for backups.
- [ ] **Network access**: Render's free plan has no fixed outbound IPs, so
      `0.0.0.0/0` is needed there; a paid Render plan with static IPs lets you list
      only those.
- [ ] **Alerts**: Atlas → Alerts — enable email alerts for "Host down",
      connections near the limit and storage near the tier's limit.
- [ ] Optionally drop the old `status_1` index on `triprequests` (above).
