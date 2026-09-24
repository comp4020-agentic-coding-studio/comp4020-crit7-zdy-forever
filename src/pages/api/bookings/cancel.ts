import type { APIRoute } from "astro";
import { cancelBooking, DEMO_STUDENT_ID } from "../../../lib/booking";

// Cancel Booking: validates the booking exists and belongs to the demo
// student before deleting it. Once the row is gone, the court is available
// again for that date and time on the very next read.
export const POST: APIRoute = async ({ request, redirect }) => {
  const form = await request.formData();
  const bookingId = Number(form.get("bookingId"));

  if (!Number.isInteger(bookingId) || bookingId <= 0) {
    return redirect("/bookings/?error=not-found", 303);
  }

  const result = cancelBooking(bookingId, DEMO_STUDENT_ID);
  if (!result.ok) {
    return redirect("/bookings/?error=not-found", 303);
  }

  return redirect("/bookings/?cancelled=1", 303);
};
