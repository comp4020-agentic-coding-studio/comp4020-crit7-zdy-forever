# ANU Badminton Court Booking

A redesigned booking flow for ANU Sport's badminton courts. A demo ANU student
picks a date, time and hall, sees exactly which of the eight courts in that
hall are free right now, taps one on a visual court map, and confirms a
booking that's checked and written straight to SQLite — with eligible weekday
mornings automatically claiming the ANU Free Student Hour. My Bookings lists
everything the student has on, and cancelling one immediately frees the court
again.

## What good looks like here

The brief in `CLAUDE.md` names one narrow slice of ANU Sport's booking
system — badminton courts only, one fixed demo student, no login, no
payments — and asks for it to work end to end against a real database rather
than being a static mockup. Good, for this prototype, means:

- **The database is the only source of truth.** Every court tile's
  Available/Selected/Booked state is computed from the `bookings` table on
  each request; nothing about availability is hard-coded or held in
  `localStorage`. Reloading the browser after a booking still shows it.
- **The court map is a real control, not an image.** Each of the 16 seeded
  courts (`Old Hall BM Court 1–8`, `New Hall BM Court 1–8`) is a clickable
  tile with its own state, and it's explicitly labelled `Schematic / not to
  scale` — it's an interaction layout, not a claim about the real venue's
  floor plan.
- **The server never trusts the client.** Confirming a booking re-checks
  court availability and re-derives Free Student Hour eligibility from
  scratch server-side, even though the UI already showed an available/free
  state — the client-side state is a preview, the write path is the
  authority. This is what makes double-booking prevention and the
  once-per-calendar-week Free Student Hour limit actually hold up.
- **Works with and without JavaScript.** Selecting a hall, date, time or
  court is a plain HTML form submission that a full page reload can satisfy
  correctly; an inline script layers instant visual feedback (tile
  selection, the booking summary panel, the URL updating) on top of that
  baseline rather than replacing it.

What I judged rather than had handed to me: the exact one-hour time slots
(09:00–16:00, per `CLAUDE.md`'s example), the specific wording of the
eligibility/pricing states (`Free Student Hour` / `$0.00` vs. `Student rate
applies`), and the decision to keep booking creation and cancellation as
plain POST forms rather than adding a JSON API. `spec/booking.test.ts` is
what's enforced by CI: it drives the running app through creating a booking,
rejecting a duplicate, granting the free hour once per week, and releasing a
court on cancellation. Everything else — layout, colour, copy — is judgement
that stayed inside the brief's "no excessive animation" and "resemble a
simple modern university sports booking system" guidance.
