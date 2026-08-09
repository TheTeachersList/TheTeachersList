# The Teacher's List

A place for parents to look up their kid's teachers and school staff, see gift ideas suited to them,
claim a gift so nobody duplicates, and where teachers curate what's shown about themselves.

Next.js (App Router) + Tailwind, backed by Airtable and Resend. No Cloudflare/Netlify — every
Airtable/Resend call happens in Next.js server-side API routes (`src/app/api/**`), so no keys are
ever exposed to the browser.

## Running it locally

```bash
npm install
npm run dev
```

Then open http://localhost:3000. If you used the built-in preview (`teachers-list-web` in
`.claude/launch.json`), it's already running.

A banner at the top of every page tells you what's still missing from `.env.local`.

## First-time setup

Copy `.env.local.example` → `.env.local` if you don't already have one (one was created for you
with the base ID and a generated `SESSION_SECRET` pre-filled — you still need to add the two API
keys below).

### 1. Airtable (required — this is the database)

1. Go to [airtable.com/create/tokens](https://airtable.com/create/tokens) and create a personal
   access token.
2. Scopes: `data.records:read`, `data.records:write`, `schema.bases:read`.
3. Access: only the **"The Teacher's List"** base.
4. Paste the token into `AIRTABLE_API_KEY` in `.env.local`. `AIRTABLE_BASE_ID` is already filled in.

The base already has all six tables set up: `Schools` (seeded with 71 real Louisiana public,
charter, and private schools across 7 parishes — see "About the school list" below),
`GiftCatalog` (30 curated gift ideas used for auto-suggestions), `Profiles`, `Claims`,
`PendingVerifications`, and `Contact Messages`.

### 2. Resend (required for real verification emails)

1. Get an API key at [resend.com/api-keys](https://resend.com/api-keys). The `theteacherslist.com`
   sending domain is already verified on the account.
2. Paste it into `RESEND_API_KEY`.

**Without this set**, the app still works — the verification code is returned directly in the API
response and shown on-screen instead of emailed, so you can test the whole flow with no email
setup at all. Look for the "Resend isn't configured yet" note during Add a Profile / Manage My
Gifts.

### 3. SESSION_SECRET (already generated)

Signs the short-lived "Manage My Gifts" access token issued after a teacher re-verifies their
email. A random one was generated for local dev. Generate a fresh one before this ever leaves
your machine:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### 4. ANTHROPIC_API_KEY (optional — photo-to-form transcription)

The Add a Profile form lets a teacher upload a photo of a handwritten favorites sheet. If this key
is set, the photo is read by Claude and turned into a draft the teacher reviews and can apply to
the form before submitting — nothing is auto-filled without their review. If unset, the upload box
just tells them to fill the form in by hand. Get a key at
[console.anthropic.com/settings/keys](https://console.anthropic.com/settings/keys).

The photo itself is **not stored** anywhere (not in Airtable, not on disk) — it's sent for
transcription and then discarded. That also means there's no Airtable attachment-hosting step to
worry about, since Airtable's API only accepts attachments by public URL, which a local dev server
doesn't have.

## About the school list

The `Schools` table is seeded with 71 real schools across East Baton Rouge, Orleans, Jefferson,
Lafayette, Caddo, St. Tammany, and Calcasieu parishes, plus several Catholic/private schools —
sourced from public district and Wikipedia listings, not fabricated. Louisiana has roughly
1,300+ K-12 schools total, so this is a solid starting sample, not the full state.

Two ways the list grows from here:
- **Self-serve**: the Add a Profile form has a "Don't see your school? Add it" link that creates a
  new `Schools` record on the spot (`POST /api/schools`).
- **Bulk import**: for full statewide coverage, import a CSV (e.g. from the Louisiana Department
  of Education directory or NCES) directly into the `Schools` table in Airtable.

The `domain` field on each school (used to hint at the expected school-email format) is a **soft
hint only, not a hard gate** — verification is actually enforced by the emailed one-time code, not
by string-matching the email domain. That was a deliberate call: guessing a district's exact staff
email domain wrong could otherwise wrongly block a real teacher.

## Architecture notes

- `src/lib/airtable.ts` — thin REST wrapper (list/get/create/update/delete), used by every
  table-specific module in `src/lib/`.
- `src/lib/session.ts` — HMAC-signed, 30-minute token for the Manage My Gifts flow. No persistent
  login/accounts anywhere in the app, by design — matches the "no claim login needed" and
  "lightweight re-verification" decisions made for this project.
- Gift suggestions are matched by simple tag overlap between a profile's favorites and the
  `GiftCatalog` table (`src/lib/gifts.ts`) — no external shopping API involved. Suggestions are
  never shown to parents until the teacher approves them from Manage My Gifts
  (`giftDecisionsJson` on the `Profiles` record).
- Claiming a gift needs no parent account — just a name, stored in the `Claims` table.

## Known gaps / next steps

- There's a `Reminders` table in the Airtable base (`personId`, `phone`,
  `remindBirthday`, `remindHoliday`) left over from earlier scaffolding that this build doesn't
  use — worth a conversation about whether that's a feature to build (birthday/holiday text
  reminders for parents) or table to remove.
- No production hosting is wired up yet (by design — you're handling that separately). Before
  deploying anywhere, replace `SESSION_SECRET` with a freshly generated value and double check the
  Airtable token's scopes are still minimal.
