# Process overview

## What I built

An end-to-end ANU Sport badminton court booking flow — date/time/hall
selection, a clickable eight-court schematic sourced from SQLite,
server-enforced double-booking prevention, a server-enforced Free Student
Hour benefit, and a My Bookings page with cancellation. `README.md` has the
full account of what the app is and what good means here.

## Why badminton court booking

`CLAUDE.md` scopes this Crit to one slice of ANU Sport's facility booking:
badminton courts, one fixed demo student, no login. The two problems it
names in the current (real, walk-in-oriented) flow are that a student can't
see *which exact court* they're getting before they commit, and that the
Free Student Hour benefit isn't something a student can claim online at
all. Both are addressed directly: a visual, clickable court map replaces an
implicit "some court in some hall" booking, and the Free Student Hour is
redesigned (documented as a deliberate redesign, not a claim that ANU Sport
already works this way) into something the booking flow checks and applies
automatically.

## How I got here

I started by reading `CLAUDE.md` in full and inspecting the existing
COMP4020 scaffold — `package.json`, `astro.config.ts`, `drizzle.config.ts`,
`src/lib/db.ts`, `fly.toml`, `Dockerfile` — before writing any code, to
confirm the scaffold's Astro/Drizzle/better-sqlite3/Fly.io pipeline (server
output, migrations auto-applied at boot, single Fly machine with a
persistent `/data` volume) could be reused as-is. It could: no dependency,
config, or deployment change was needed anywhere in this project.

I presented that analysis — proposed `courts`/`bookings` schemas,
double-booking design, Free Student Hour design, where the visual selector
would live, and a staged plan — and waited for confirmation before touching
any file, per the brief's explicit instruction. Given the go-ahead ("1.移除
2.直接加 做得精细一点" — remove the existing guestbook demo, add the
court-map progressive-enhancement JS directly, and make it polished), I
implemented the whole slice in one working pass and verified it afterwards,
rather than building and testing stage-by-stage with the agent. The commit
history below is organised into `CLAUDE.md`'s suggested stages after the
fact, grouping by real file dependency (a page and the components/library
code it imports land together, since splitting them would leave an
intermediate commit that doesn't build) rather than replaying a fictional
incremental order.

- [`4d77741`](https://github.com/comp4020-agentic-coding-studio/comp4020-crit7-zdy-forever/commit/4d77741) —
  the Crit 07 brief itself, written into `CLAUDE.md` before this session.
- [`6297ad8`](https://github.com/comp4020-agentic-coding-studio/comp4020-crit7-zdy-forever/commit/6297ad8) —
  removed the scaffold's guestbook demo (unrelated to badminton booking).
- [`b6a5a46`](https://github.com/comp4020-agentic-coding-studio/comp4020-crit7-zdy-forever/commit/b6a5a46) —
  `courts`/`bookings` schema. `bookings` has a unique index on
  `courtId + bookingDate + startTime`, which is the real backstop against
  double booking — the application checks availability first, but the
  index is what makes a race between two near-simultaneous requests safe.
- [`f7cb130`](https://github.com/comp4020-agentic-coding-studio/comp4020-crit7-zdy-forever/commit/f7cb130) —
  idempotent seeding of the 16 fixed courts on first boot.
- [`07dfea1`](https://github.com/comp4020-agentic-coding-studio/comp4020-crit7-zdy-forever/commit/07dfea1) —
  the booking-selection UI and the visual court map together, since
  `pages/index.astro` composes both and neither half builds without the
  other. The court map's tiles are real submit buttons in a plain GET
  form — availability is correct on a full page reload with JavaScript off
  — and an inline script layers instant tile-selection feedback and a
  live booking-summary panel on top, without becoming the only way the
  page works.
- [`50401af`](https://github.com/comp4020-agentic-coding-studio/comp4020-crit7-zdy-forever/commit/50401af) —
  booking creation. This is where Free Student Hour eligibility and the
  conflict check are actually enforced: `POST /api/bookings` recomputes
  both from the database at write time, never from what the client already
  displayed.
- [`91fc64a`](https://github.com/comp4020-agentic-coding-studio/comp4020-crit7-zdy-forever/commit/91fc64a) —
  My Bookings and cancellation.
- [`849389d`](https://github.com/comp4020-agentic-coding-studio/comp4020-crit7-zdy-forever/commit/849389d) —
  `spec/booking.test.ts`, driving the built app through booking, conflict
  rejection, the weekly Free Student Hour limit, and cancellation. I also
  manually exercised the invalid-input paths (unparseable date, nonexistent
  `courtId`, nonexistent `bookingId`) against the dev server at this point;
  each degrades to a redirect or fallback rather than a crash.
- [`6bb8457`](https://github.com/comp4020-agentic-coding-studio/comp4020-crit7-zdy-forever/commit/6bb8457) —
  `README.md`.

No Fly.io configuration changed, so there is no corresponding commit for
Stage 11: `fly.toml`, the `Dockerfile`, and the `/data` volume mount were
already correct for a Drizzle/better-sqlite3 app and needed no edits.

## Database architecture decisions

`courts` and `bookings` are the only two tables added, matching
`CLAUDE.md`'s "keep the data model small" instruction — no user table,
since there's a single fixed demo student and no authentication. The
unique index on `bookings(courtId, bookingDate, startTime)` is the single
source of truth for "is this slot taken": both the court map's
Available/Booked read and the write-time conflict check query the same
table, so there's no separate cache or derived state that could drift from
it.

## Booking conflict handling

`createBooking` (`src/lib/booking.ts`) checks for an existing booking on
the same court/date/time before inserting, then relies on the unique index
as a second, unconditional guard: if the pre-check and the insert ever race,
`better-sqlite3` throws a `SQLITE_CONSTRAINT_UNIQUE` error (confirmed by a
quick standalone script against an in-memory database before writing the
catch clause, since `better-sqlite3`'s error shape isn't obvious from its
types alone) that's caught and reported as a conflict instead of crashing
the request.

## Free Student Hour implementation decisions

Eligibility is recomputed on every request that needs it — the preview on
the booking page and the authoritative check inside `createBooking` — from
three facts already in the database or request: is the booking date a
weekday, does it start before `14:00`, and does the student already have a
booking with `isFreeStudentHour = 1` in the same ISO (Monday-Sunday)
calendar week. Week boundaries are computed with `Date.UTC` arithmetic
specifically to avoid a timezone-dependent off-by-one at the week edges.

## Instructions and context given to the coding agent

I gave the agent the full `CLAUDE.md` brief and explicit constraints
(schematic labelled as not-to-scale, no login/SSO/payments/other
sports/admin dashboard, reuse the existing scaffold, no code changes until
the plan was confirmed) before any implementation, and required an upfront
analysis and staged plan rather than immediate coding.

## Mistakes made and corrections

`drizzle-kit generate` failed non-interactively (`Error: Interactive
prompts require a TTY terminal`) the first time schema.ts both added
`courts`/`bookings` and removed the old `messages` table in the same diff —
drizzle-kit couldn't tell whether that was a rename and tried to ask
interactively. Faking a TTY (`script -q /dev/null pnpm db:generate`) just
hung waiting for a selection UI rather than a line-based prompt. The fix
was to split the schema change into two unambiguous diffs instead: add the
new tables first (a pure addition, migration `0001`), then remove
`messages` in a second run (a pure drop, migration `0002`).

## Deployment

Fly.io deployment was not re-run in this session (see "How I got here"
above for why: nothing in `fly.toml`, the `Dockerfile`, or the volume
mount needed to change), so there is nothing to report here beyond the
scaffold's existing, unmodified pipeline.
