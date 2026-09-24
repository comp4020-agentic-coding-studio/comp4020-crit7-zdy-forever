import { describe, expect, inject, it } from "vitest";

// Turns the Crit 07 brief into checks against the RUNNING app: a booking
// persists, double-booking is rejected, the weekly Free Student Hour limit
// is enforced server-side, and cancelling releases the court again.
const baseUrl = inject("baseUrl");

// A weekday date comfortably in the future and before 14:00, so the same
// probe run is deterministic regardless of when CI happens to execute it.
function nextWeekdayIso(): string {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + 14);
  while (date.getUTCDay() === 0 || date.getUTCDay() === 6) {
    date.setUTCDate(date.getUTCDate() + 1);
  }
  return date.toISOString().slice(0, 10);
}

// Reads the court map's own button markup rather than a loose name/value
// regex, so a booked (disabled) tile is never mistaken for an available one.
function availableCourtIds(html: string): string[] {
  return [...html.matchAll(/<button[^>]*name="courtId"[^>]*>/g)]
    .filter((match) => !match[0].includes("disabled"))
    .map((match) => match[0].match(/value="(\d+)"/)![1]);
}

function bookingIds(html: string): string[] {
  return [...html.matchAll(/name="bookingId"\s+value="(\d+)"/g)].map((match) => match[1]);
}

describe("booking flow", () => {
  const bookingDate = nextWeekdayIso();

  const post = (path: string, body: URLSearchParams) =>
    fetch(new URL(path, baseUrl), {
      method: "POST",
      headers: { origin: baseUrl },
      body,
      redirect: "manual",
    });

  it("shows the eight-court schematic for Old Hall by default", async () => {
    const res = await fetch(baseUrl);
    const html = await res.text();
    expect(html).toContain("Old Hall");
    expect(html).toContain("Schematic / not to scale");
    for (let courtNumber = 1; courtNumber <= 8; courtNumber++) {
      expect(html).toContain(`Court ${courtNumber}`);
    }
  });

  it("creates a booking, persists it, and prevents a double booking", async () => {
    const homeRes = await fetch(new URL(`/?date=${bookingDate}&time=09:00&hall=old`, baseUrl));
    const homeHtml = await homeRes.text();
    const availableIds = availableCourtIds(homeHtml);
    expect(availableIds.length, "expected at least one available court").toBeGreaterThan(0);
    const courtId = availableIds[0];

    const confirm = await post(
      "/api/bookings",
      new URLSearchParams({ courtId, bookingDate, startTime: "09:00" }),
    );
    expect(confirm.status).toBe(303);
    expect(confirm.headers.get("location")).toBe("/bookings/");

    const bookingsRes = await fetch(new URL("/bookings/", baseUrl));
    const bookingsHtml = await bookingsRes.text();
    expect(bookingsHtml).toContain("Old Hall BM Court");

    // Same court, same date, same time — must be rejected, not duplicated.
    const conflict = await post(
      "/api/bookings",
      new URLSearchParams({ courtId, bookingDate, startTime: "09:00" }),
    );
    expect(conflict.status).toBe(303);
    expect(conflict.headers.get("location")).toContain("error=conflict");

    // Cancel it, then confirm the same slot can be booked again.
    const createdBookingIds = bookingIds(bookingsHtml);
    expect(createdBookingIds.length, "expected the booking just created to be listed").toBeGreaterThan(0);
    const cancel = await post("/api/bookings/cancel", new URLSearchParams({ bookingId: createdBookingIds[0] }));
    expect(cancel.status).toBe(303);
    expect(cancel.headers.get("location")).toBe("/bookings/?cancelled=1");

    const rebooked = await post(
      "/api/bookings",
      new URLSearchParams({ courtId, bookingDate, startTime: "09:00" }),
    );
    expect(rebooked.status).toBe(303);
    expect(rebooked.headers.get("location")).toBe("/bookings/");

    // Clean up so this probe leaves no state behind for other test runs.
    const cleanupHtml = await (await fetch(new URL("/bookings/", baseUrl))).text();
    const [cleanupId] = bookingIds(cleanupHtml);
    if (cleanupId) {
      await post("/api/bookings/cancel", new URLSearchParams({ bookingId: cleanupId }));
    }
  });

  it("grants only one Free Student Hour per calendar week, enforced by the server", async () => {
    const home = await fetch(new URL(`/?date=${bookingDate}&time=09:00&hall=new`, baseUrl));
    const homeHtml = await home.text();
    const courtIds = availableCourtIds(homeHtml);
    expect(courtIds.length).toBeGreaterThanOrEqual(2);

    const first = await post(
      "/api/bookings",
      new URLSearchParams({ courtId: courtIds[0], bookingDate, startTime: "09:00" }),
    );
    expect(first.status).toBe(303);

    const bookingsHtml = await (await fetch(new URL("/bookings/", baseUrl))).text();
    expect(bookingsHtml).toContain("Free Student Hour");

    // A second booking the same week, on a different court, must not also
    // be free — even though it's still a weekday morning slot.
    const second = await post(
      "/api/bookings",
      new URLSearchParams({ courtId: courtIds[1], bookingDate, startTime: "10:00" }),
    );
    expect(second.status).toBe(303);
    expect(second.headers.get("location")).toBe("/bookings/");

    const afterHtml = await (await fetch(new URL("/bookings/", baseUrl))).text();
    expect(afterHtml).toContain("Student rate applies");

    // Clean up both bookings made in this test.
    for (const bookingId of bookingIds(afterHtml)) {
      await post("/api/bookings/cancel", new URLSearchParams({ bookingId }));
    }
  });
});
