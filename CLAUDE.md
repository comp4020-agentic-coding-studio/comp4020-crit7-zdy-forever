# COMP4020 Crit 07 — ANU Badminton Court Booking Redesign

## Project Overview

This project redesigns one specific part of the existing ANU Sport facility booking experience: badminton court booking.

The project is deliberately limited to badminton court booking. It does not attempt to rebuild the complete ANU Sport platform.

The core user flow is:

Select Date and Time
→ Select Hall
→ Select Exact Court from a Visual Court Map
→ Check Free Student Hour Eligibility
→ Confirm Booking
→ My Bookings
→ Cancel Booking

The most important technical requirement is that bookings must be persisted in SQLite.

A booking must still exist after the browser is reloaded.

---

## Project Goals

The project should demonstrate a complete end-to-end full-stack workflow with:

* a real database;
* server-side booking logic;
* persistent booking data;
* an interactive visual court selector;
* booking availability;
* double-booking prevention;
* Free Student Hour eligibility;
* booking cancellation;
* deployment to Fly.io.

The database must be the source of truth.

Do not use localStorage or client-side state as persistent booking storage.

---

## Existing ANU Context

ANU Sport currently provides indoor badminton facilities in:

* Old Hall
* New Hall

For this prototype, model the following badminton courts:

### Old Hall

* Old Hall BM Court 1
* Old Hall BM Court 2
* Old Hall BM Court 3
* Old Hall BM Court 4
* Old Hall BM Court 5
* Old Hall BM Court 6
* Old Hall BM Court 7
* Old Hall BM Court 8

### New Hall

* New Hall BM Court 1
* New Hall BM Court 2
* New Hall BM Court 3
* New Hall BM Court 4
* New Hall BM Court 5
* New Hall BM Court 6
* New Hall BM Court 7
* New Hall BM Court 8

The visual court layout is a schematic interaction design only.

Do not claim that it is an exact architectural floor plan of the real venue.

The interface should clearly describe it as:

`Schematic / not to scale`

---

## Design Motivation

The redesign focuses on making three things immediately understandable to students:

1. Which hall they are booking.
2. Which exact badminton court they are selecting.
3. Whether the selected booking qualifies for the ANU Free Student Hour.

The visual court selector is a core interaction component, not decorative artwork.

Users should be able to directly see which courts are available and which courts are already booked.

---

## Demo User

Use one fixed demo ANU student.

Example:

* Student ID: `demo-student`
* Student type: `ANU Student`

Authentication and ANU SSO are outside the scope of this project.

Do not implement a login system.

---

## Core Booking Flow

### Step 1 — Select Date

The user selects a booking date.

The selected date should affect:

* availability;
* Free Student Hour eligibility;
* booking creation.

---

### Step 2 — Select Time

Use fixed one-hour booking slots.

Example:

* 09:00–10:00
* 10:00–11:00
* 11:00–12:00
* 12:00–13:00
* 13:00–14:00
* 14:00–15:00
* 15:00–16:00
* 16:00–17:00

Do not implement arbitrary custom durations.

For the Crit prototype, all bookings should be exactly one hour.

---

### Step 3 — Select Hall

Allow the user to switch between:

* Old Hall
* New Hall

Changing the hall should update the visual court selector and availability.

---

### Step 4 — Visual Court Map

Display all eight badminton courts for the selected hall using a visual schematic.

A responsive grid is acceptable.

For example:

Court 1 | Court 2 | Court 3 | Court 4

Court 5 | Court 6 | Court 7 | Court 8

Each court must be directly clickable.

Each court should have one of the following states:

* Available
* Selected
* Booked

Suggested behaviour:

### Available

The court can be selected.

### Selected

The court is currently selected by the user.

Only one court should be selected at a time.

### Booked

The court already has a booking for the selected date and time.

It must be visually distinct and must not be selectable.

Availability must come from the backend/database.

Do not hard-code booked courts in the final application.

---

## Free Student Hour Redesign

ANU Sport currently provides a Free Student Hour benefit for eligible ANU students before 2pm on weekdays.

For this prototype, intentionally redesign the benefit so that eligible students can claim their free hour through the online booking interface.

This is an intentional redesign of the current walk-in-oriented process.

It must be documented in `PROCESS.md` as a design decision.

Do not describe this prototype behaviour as if the real current ANU Sport system already works this way.

---

## Prototype Free Student Hour Rules

A booking qualifies for the Free Student Hour when all of the following are true:

* the user is the fixed ANU demo student;
* the booking date is Monday to Friday;
* the booking starts before 14:00;
* the booking duration is exactly one hour;
* the student has not already used a Free Student Hour during the same calendar week.

When eligible, display:

`Free Student Hour`

and:

`$0.00`

When not eligible, display:

`Student rate applies`

The project does not need to implement actual payment processing.

Do not invent an official current ANU Sport price if a verified price has not been provided.

---

## Weekly Free Hour Rule

Before creating a Free Student Hour booking, the backend must query the student's existing bookings for the same calendar week.

If an existing booking has:

`isFreeStudentHour = true`

then the new booking must not receive another free hour.

The user may still create another booking if the court is available, but it should not be marked as free.

The Free Student Hour rule must be enforced on the server.

Do not rely only on frontend validation.

---

## Booking Summary

Before confirming a booking, clearly display:

* date;
* time;
* hall;
* court;
* Free Student Hour eligibility;
* pricing status.

Example:

Old Hall
BM Court 4
Friday 25 September 2026
13:00–14:00

Free Student Hour
$0.00

Then provide a clear:

`Confirm Booking`

button.

---

## My Bookings

Create a page for the demo student's current bookings.

Suggested route:

`/bookings`

Each booking should display:

* hall;
* court number;
* booking date;
* start time;
* end time;
* Free Student Hour status.

Each booking must include a:

`Cancel Booking`

action.

Cancelling a booking must update the SQLite database.

After cancellation, the court must become available again for that date and time.

---

## Database Model

Use the minimum database model required for the project.

### `courts`

Suggested fields:

* `id`
* `hall`
* `courtNumber`
* `name`
* `displayRow`
* `displayColumn`

Seed 16 badminton courts:

* 8 Old Hall courts
* 8 New Hall courts

Example:

```text
Old Hall BM Court 1
Old Hall BM Court 2
...
Old Hall BM Court 8

New Hall BM Court 1
...
New Hall BM Court 8
```

---

### `bookings`

Suggested fields:

* `id`
* `studentId`
* `courtId`
* `bookingDate`
* `startTime`
* `endTime`
* `isFreeStudentHour`
* `createdAt`

A separate user table is not required unless the existing COMP4020 scaffold makes it useful.

Keep the data model small.

---

## Double Booking Prevention

The same court must not have more than one booking for the same date and time slot.

The backend must check availability again when the user confirms the booking.

Do not trust the availability state previously displayed by the frontend.

Where practical, also enforce this rule using a database unique constraint.

Conceptually:

```text
courtId + bookingDate + startTime
```

must be unique.

This protects the application against two booking requests being created for the same court and time.

---

## Backend Booking Flow

The expected flow is:

```text
User selects date and time
→ backend reads bookings from SQLite
→ UI displays current court availability
→ user selects an available court
→ user clicks Confirm Booking
→ backend validates the court again
→ backend checks for booking conflicts
→ backend calculates Free Student Hour eligibility
→ booking is written to SQLite
→ page reads the updated booking state from SQLite
```

After a browser reload, the booking must still exist.

All persistent state must come from the database.

---

## Cancellation Flow

The expected cancellation flow is:

```text
User opens My Bookings
→ user clicks Cancel Booking
→ backend validates the booking
→ booking is removed from SQLite
→ booking list updates
→ the court becomes available again
```

If the cancelled booking used the Free Student Hour, the system should naturally allow the student to use their free hour again later in the same week because the original booking no longer exists.

---

## Validation

At minimum, handle:

* invalid booking date;
* invalid booking time;
* court does not exist;
* court is already booked;
* duplicate booking request;
* booking does not exist during cancellation;
* invalid booking ownership;
* Free Student Hour already used during the selected week.

Errors should result in understandable feedback.

The application should not crash because of normal user errors.

---

## Technology Stack

Prefer the existing COMP4020 course scaffold.

Use the existing project setup wherever possible.

Preferred stack:

* Astro
* TypeScript
* Astro server/backend functionality
* Drizzle ORM
* SQLite
* Fly.io

Before adding dependencies:

1. inspect the existing repository;
2. inspect `package.json`;
3. inspect the database setup;
4. inspect Drizzle configuration;
5. inspect Fly.io configuration.

Do not replace existing working infrastructure without a clear reason.

---

## UI Requirements

The interface should resemble a simple modern university sports booking system.

Prioritise:

1. date selection;
2. time selection;
3. hall selection;
4. visual court map;
5. availability;
6. Free Student Hour status;
7. booking summary;
8. My Bookings.

The main booking screen should allow the user to understand the current booking state without navigating through many pages.

The visual court selector should be more important than decorative animation.

Do not spend excessive time on complex animation or visual effects.

---

## Suggested Main Booking Layout

A possible layout is:

```text
ANU Badminton Court Booking

[Date] [Time]

[Old Hall] [New Hall]

Free Student Hour
Eligible
$0.00

----------------------------------

Old Hall
Schematic / not to scale

[ Court 1 ] [ Court 2 ]
[ Court 3 ] [ Court 4 ]
[ Court 5 ] [ Court 6 ]
[ Court 7 ] [ Court 8 ]

Available / Selected / Booked

----------------------------------

Booking Summary

Friday 25 September
13:00–14:00
Old Hall BM Court 4

Free Student Hour
$0.00

[Confirm Booking]
```

This is only a structural suggestion.

Reuse the existing visual style of the scaffold where appropriate.

---

## Out of Scope

Do not implement the following unless explicitly requested:

* ANU SSO;
* real user authentication;
* multiple user account management;
* credit card payments;
* Stripe;
* real payment processing;
* email notifications;
* SMS notifications;
* tennis booking;
* basketball booking;
* volleyball booking;
* squash booking;
* other sports;
* administrative dashboards;
* staff management;
* membership management;
* real-time WebSocket updates;
* real ANU Sport API integration;
* web scraping;
* complex pricing systems.

Only implement the badminton court booking slice.

---

## Development Rules

Before implementing a feature:

1. inspect relevant existing files;
2. explain the intended change;
3. make the smallest reasonable change;
4. run relevant checks;
5. fix errors before continuing.

Do not unnecessarily rewrite working code.

Do not silently expand project scope.

Prefer the simplest implementation that satisfies the Crit 07 requirements.

---

## Development Stages

Do not build the entire project in one step.

Use staged development.

### Stage 1 — Repository Inspection

Inspect:

* Astro setup;
* database setup;
* Drizzle setup;
* SQLite configuration;
* Fly.io configuration;
* existing project structure.

Do not make major changes yet.

### Stage 2 — Database Schema

Create:

* `courts`
* `bookings`

Add migrations.

### Stage 3 — Seed Courts

Seed:

* Old Hall BM Court 1–8
* New Hall BM Court 1–8

### Stage 4 — Booking Selection UI

Implement:

* date selection;
* time selection;
* hall switching.

### Stage 5 — Visual Court Selector

Display real availability from SQLite.

Implement:

* Available;
* Selected;
* Booked.

### Stage 6 — Booking Creation

Implement server-side booking creation.

Prevent double bookings.

### Stage 7 — Free Student Hour

Implement the Free Student Hour calculation on the backend.

### Stage 8 — My Bookings

Read the demo student's bookings from SQLite.

### Stage 9 — Cancellation

Allow bookings to be cancelled.

Release the court after cancellation.

### Stage 10 — Validation and UI Polish

Handle errors and responsive layout.

### Stage 11 — Fly.io Deployment

Deploy the application.

Verify that SQLite remains persistent in the deployed environment.

### Stage 12 — Documentation

Complete:

* `PROCESS.md`
* `reflections/crit-7.md`

---

## Git Rules

The assessment requires visible development history.

Do not implement everything and then create a single final commit.

Use logical development stages.

Do not automatically create commits unless explicitly instructed.

Do not rewrite or squash existing Git history.

Suggested commit stages include:

```text
setup database schema

seed badminton courts

build booking selection interface

add court availability map

implement booking creation

add free student hour logic

add my bookings and cancellation

improve validation and UI

configure fly deployment

complete process documentation
```

---

## PROCESS.md

Maintain a `PROCESS.md` file based on the actual development process.

It should eventually explain:

* why the ANU Sport booking system was selected;
* what problems were identified in the current booking flow;
* why a visual court selector was introduced;
* why the Free Student Hour process was redesigned;
* database architecture decisions;
* booking conflict handling;
* Free Student Hour implementation decisions;
* instructions given to the coding agent;
* useful context supplied to the coding agent;
* mistakes or unsuitable suggestions made by the coding agent;
* how those issues were corrected;
* deployment problems;
* how deployment problems were solved.

Do not fabricate development history.

Only document events that actually happened.

---

## Reflection

The repository must also contain:

`reflections/crit-7.md`

Follow the COMP4020 Crit 07 reflection requirements.

Do not invent experiences or development events.

---

## Definition of Done

The project is complete when all of the following are true:

* The application loads successfully.
* The user can select a booking date.
* The user can select a one-hour booking time.
* The user can switch between Old Hall and New Hall.
* Eight badminton courts are shown for the selected hall.
* The court layout is labelled as schematic / not to scale.
* Availability comes from the database.
* Available courts can be selected.
* Booked courts cannot be selected.
* The selected court is clearly highlighted.
* The user can confirm a booking.
* The backend validates court availability.
* The booking is written to SQLite.
* Reloading the browser preserves the booking.
* Double booking is prevented.
* Free Student Hour eligibility is calculated by the backend.
* Eligible weekday bookings starting before 2pm display `$0.00`.
* The student cannot receive more than one active Free Student Hour booking in the same calendar week.
* My Bookings reads bookings from SQLite.
* The user can cancel a booking.
* Cancelling a booking releases the court.
* The application works when deployed to Fly.io.
* SQLite data remains persistent in the deployed environment.
* `PROCESS.md` exists.
* `reflections/crit-7.md` exists.

Keep the project small, understandable, demonstrable, and end-to-end functional.

