import Database from "better-sqlite3";
import { and, asc, eq, gte, lte } from "drizzle-orm";
import { db } from "./db";
import { endTimeFor, isWeekday, isoWeekRange } from "./dates";
import { type Booking, bookings, type Court, courts } from "./schema";

// Authentication and ANU SSO are out of scope for this prototype — one
// fixed demo student stands in for a logged-in user.
export const DEMO_STUDENT_ID = "demo-student";

export const HALLS = [
  { slug: "old", label: "Old Hall" },
  { slug: "new", label: "New Hall" },
] as const;

export type HallSlug = (typeof HALLS)[number]["slug"];

export function isValidHallSlug(value: string): value is HallSlug {
  return HALLS.some((hall) => hall.slug === value);
}

export function hallLabelFor(slug: HallSlug): string {
  return HALLS.find((hall) => hall.slug === slug)!.label;
}

export function hallSlugForLabel(label: string): HallSlug | undefined {
  return HALLS.find((hall) => hall.label === label)?.slug;
}

export function listCourtsForHall(hallSlug: HallSlug): Court[] {
  const hall = hallLabelFor(hallSlug);
  return db
    .select()
    .from(courts)
    .where(eq(courts.hall, hall))
    .orderBy(asc(courts.displayRow), asc(courts.displayColumn))
    .all();
}

export function getCourtById(courtId: number): Court | undefined {
  return db.select().from(courts).where(eq(courts.id, courtId)).get();
}

// The set of courts in `hallSlug` that already have a booking for this exact
// date + start time. Read fresh from the database on every render — the
// frontend must never be trusted to already know this.
export function bookedCourtIdsFor(hallSlug: HallSlug, bookingDate: string, startTime: string): Set<number> {
  const hall = hallLabelFor(hallSlug);
  const rows = db
    .select({ courtId: bookings.courtId })
    .from(bookings)
    .innerJoin(courts, eq(courts.id, bookings.courtId))
    .where(and(eq(courts.hall, hall), eq(bookings.bookingDate, bookingDate), eq(bookings.startTime, startTime)))
    .all();
  return new Set(rows.map((row) => row.courtId));
}

function isCourtBooked(courtId: number, bookingDate: string, startTime: string): boolean {
  const existing = db
    .select({ id: bookings.id })
    .from(bookings)
    .where(and(eq(bookings.courtId, courtId), eq(bookings.bookingDate, bookingDate), eq(bookings.startTime, startTime)))
    .get();
  return existing !== undefined;
}

function hasUsedFreeHourInWeek(studentId: string, bookingDate: string): boolean {
  const { weekStart, weekEnd } = isoWeekRange(bookingDate);
  const existing = db
    .select({ id: bookings.id })
    .from(bookings)
    .where(
      and(
        eq(bookings.studentId, studentId),
        eq(bookings.isFreeStudentHour, 1),
        gte(bookings.bookingDate, weekStart),
        lte(bookings.bookingDate, weekEnd),
      ),
    )
    .get();
  return existing !== undefined;
}

// The authoritative Free Student Hour check: the user must be a verified ANU
// student, the booking must be on a weekday, start before 2pm, and no free
// hour already used this calendar week. Depends only on the student and the
// date/time — never on which court is picked — so callers can use it both
// for the pre-booking preview and for the actual write.
//
// `isAnuStudent` must come from the server-held session, never a
// client-supplied field: it's the one flag a tampered request could use to
// grant itself a free booking otherwise.
export function isEligibleForFreeHour(
  studentId: string,
  bookingDate: string,
  startTime: string,
  isAnuStudent: boolean,
): boolean {
  if (!isAnuStudent) return false;
  if (!isWeekday(bookingDate)) return false;
  if (startTime >= "14:00") return false;
  return !hasUsedFreeHourInWeek(studentId, bookingDate);
}

export type CreateBookingResult = { ok: true; booking: Booking } | { ok: false; error: "invalid-court" | "conflict" };

export function createBooking(input: {
  studentId: string;
  courtId: number;
  bookingDate: string;
  startTime: string;
  isAnuStudent: boolean;
}): CreateBookingResult {
  const court = getCourtById(input.courtId);
  if (!court) return { ok: false, error: "invalid-court" };

  // Re-check availability now, server-side — the caller's view of the court
  // map may already be stale.
  if (isCourtBooked(input.courtId, input.bookingDate, input.startTime)) {
    return { ok: false, error: "conflict" };
  }

  const isFreeStudentHour = isEligibleForFreeHour(
    input.studentId,
    input.bookingDate,
    input.startTime,
    input.isAnuStudent,
  );

  try {
    const booking = db
      .insert(bookings)
      .values({
        studentId: input.studentId,
        courtId: input.courtId,
        bookingDate: input.bookingDate,
        startTime: input.startTime,
        endTime: endTimeFor(input.startTime),
        isFreeStudentHour: isFreeStudentHour ? 1 : 0,
      })
      .returning()
      .get();
    return { ok: true, booking };
  } catch (error) {
    // Belt-and-suspenders against the race between the check above and this
    // insert: the unique index on (courtId, bookingDate, startTime) is the
    // real guarantee.
    if (error instanceof Database.SqliteError && error.code === "SQLITE_CONSTRAINT_UNIQUE") {
      return { ok: false, error: "conflict" };
    }
    throw error;
  }
}

export type BookingWithCourt = Booking & { hall: string; courtNumber: number; courtName: string };

export function listBookingsForStudent(studentId: string): BookingWithCourt[] {
  return db
    .select({
      id: bookings.id,
      studentId: bookings.studentId,
      courtId: bookings.courtId,
      bookingDate: bookings.bookingDate,
      startTime: bookings.startTime,
      endTime: bookings.endTime,
      isFreeStudentHour: bookings.isFreeStudentHour,
      createdAt: bookings.createdAt,
      hall: courts.hall,
      courtNumber: courts.courtNumber,
      courtName: courts.name,
    })
    .from(bookings)
    .innerJoin(courts, eq(courts.id, bookings.courtId))
    .where(eq(bookings.studentId, studentId))
    .orderBy(asc(bookings.bookingDate), asc(bookings.startTime))
    .all();
}

export type CancelBookingResult = { ok: true } | { ok: false; error: "not-found" };

export function cancelBooking(bookingId: number, studentId: string): CancelBookingResult {
  // Ownership check: only a booking that belongs to this student can be
  // cancelled by them.
  const existing = db
    .select({ id: bookings.id })
    .from(bookings)
    .where(and(eq(bookings.id, bookingId), eq(bookings.studentId, studentId)))
    .get();
  if (!existing) return { ok: false, error: "not-found" };

  db.delete(bookings).where(eq(bookings.id, bookingId)).run();
  return { ok: true };
}
