import type { APIRoute } from "astro";
import { createBooking, DEMO_STUDENT_ID, getCourtById, hallSlugForLabel } from "../../lib/booking";
import { isValidDate, isValidTimeSlot } from "../../lib/dates";

// Confirm Booking: re-validates and re-checks availability server-side —
// the frontend's court map is never trusted, only what's actually in SQLite
// right now. On success the booking is written and the student is sent to
// My Bookings, which reads it straight back out of the database.
export const POST: APIRoute = async ({ request, redirect }) => {
  const form = await request.formData();
  const courtId = Number(form.get("courtId"));
  const bookingDate = String(form.get("bookingDate") ?? "");
  const startTime = String(form.get("startTime") ?? "");

  const backToBooking = (extra: Record<string, string>) => {
    const url = new URL("/", request.url);
    for (const [key, value] of Object.entries(extra)) url.searchParams.set(key, value);
    return redirect(`${url.pathname}${url.search}`, 303);
  };

  if (!Number.isInteger(courtId) || courtId <= 0 || !isValidDate(bookingDate) || !isValidTimeSlot(startTime)) {
    return backToBooking({ error: "invalid" });
  }

  const result = createBooking({ studentId: DEMO_STUDENT_ID, courtId, bookingDate, startTime });

  if (!result.ok) {
    const court = getCourtById(courtId);
    const hallSlug = court ? hallSlugForLabel(court.hall) : undefined;
    return backToBooking({
      date: bookingDate,
      time: startTime,
      ...(hallSlug ? { hall: hallSlug } : {}),
      error: result.error === "conflict" ? "conflict" : "invalid",
    });
  }

  return redirect("/bookings/", 303);
};
