// Fixed one-hour slots — no custom durations for this prototype.
export const TIME_SLOTS = ["09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00"] as const;

export type TimeSlot = (typeof TIME_SLOTS)[number];

export function isValidTimeSlot(value: string): value is TimeSlot {
  return (TIME_SLOTS as readonly string[]).includes(value);
}

export function endTimeFor(startTime: string): string {
  const hours = Number(startTime.slice(0, 2));
  return `${String(hours + 1).padStart(2, "0")}:00`;
}

export function formatSlotLabel(startTime: string): string {
  return `${startTime}–${endTimeFor(startTime)}`;
}

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

// Dates are plain "YYYY-MM-DD" strings throughout — parsed with Date.UTC
// rather than `new Date(string)` so weekday/round-trip checks don't depend
// on the server process's local timezone.
export function isValidDate(value: string): boolean {
  if (!DATE_PATTERN.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

export function isWeekday(dateValue: string): boolean {
  const [year, month, day] = dateValue.split("-").map(Number);
  const weekday = new Date(Date.UTC(year, month - 1, day)).getUTCDay(); // 0 = Sunday
  return weekday >= 1 && weekday <= 5;
}

export function formatDateLong(dateValue: string): string {
  const [year, month, day] = dateValue.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.toLocaleDateString("en-AU", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

// The Monday-Sunday week containing the given date, as "YYYY-MM-DD" bounds —
// used to enforce "one Free Student Hour per calendar week".
export function isoWeekRange(dateValue: string): { weekStart: string; weekEnd: string } {
  const [year, month, day] = dateValue.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  const isoWeekday = date.getUTCDay() === 0 ? 7 : date.getUTCDay(); // 1 = Monday ... 7 = Sunday
  const monday = new Date(date);
  monday.setUTCDate(date.getUTCDate() - (isoWeekday - 1));
  const sunday = new Date(monday);
  sunday.setUTCDate(monday.getUTCDate() + 6);
  const toIso = (d: Date) => d.toISOString().slice(0, 10);
  return { weekStart: toIso(monday), weekEnd: toIso(sunday) };
}

export function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}
