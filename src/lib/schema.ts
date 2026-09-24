import { sql } from "drizzle-orm";
import { int, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

// The schema is the ground truth for the database. To change it: edit here,
// run `pnpm db:generate` to turn the diff into a migration under drizzle/,
// and commit both — the migration applies automatically when the server
// boots (see src/lib/db.ts), locally and deployed. Never edit the database
// by hand: state on the deployed volume outlives every deploy, and the
// migration trail is what keeps old state and new code compatible.

export const courts = sqliteTable(
  "courts",
  {
    id: int().primaryKey({ autoIncrement: true }),
    hall: text().notNull(),
    courtNumber: int("court_number").notNull(),
    name: text().notNull(),
    displayRow: int("display_row").notNull(),
    displayColumn: int("display_column").notNull(),
  },
  (t) => [uniqueIndex("courts_hall_court_number_unique").on(t.hall, t.courtNumber)],
);

export const bookings = sqliteTable(
  "bookings",
  {
    id: int().primaryKey({ autoIncrement: true }),
    studentId: text("student_id").notNull(),
    courtId: int("court_id")
      .notNull()
      .references(() => courts.id),
    bookingDate: text("booking_date").notNull(),
    startTime: text("start_time").notNull(),
    endTime: text("end_time").notNull(),
    // Stored as 0/1: SQLite has no boolean type, and this is what the app
    // must check server-side before ever granting a second free hour.
    isFreeStudentHour: int("is_free_student_hour").notNull().default(0),
    createdAt: text("created_at")
      .notNull()
      .default(sql`(datetime('now'))`),
  },
  (t) => [
    // Belt-and-suspenders with the app-level conflict check in
    // src/lib/booking.ts: the same court/date/start-time can never have two
    // rows, even under a race between two requests.
    uniqueIndex("bookings_court_date_start_unique").on(t.courtId, t.bookingDate, t.startTime),
  ],
);

export type Court = typeof courts.$inferSelect;
export type Booking = typeof bookings.$inferSelect;
