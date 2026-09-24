import type { AstroSession } from "astro";

// A mock ANU login: real ANU SSO is out of scope (CLAUDE.md), but the Free
// Student Hour rule only applies to a verified ANU student, so a visitor's
// browsing state has to distinguish the two somehow. This flag lives in
// Astro's built-in per-browser session (cookie + server-side storage) rather
// than a request field, so a booking request can't just claim student status
// for itself — only a prior login on this same session can set it.
const SESSION_KEY = "isAnuStudent";

export async function isAnuStudent(session: AstroSession | undefined): Promise<boolean> {
  if (!session) return false;
  return (await session.get<boolean>(SESSION_KEY)) === true;
}

export async function setAnuStudent(session: AstroSession | undefined, value: boolean): Promise<void> {
  if (!session) return;
  if (value) {
    session.set(SESSION_KEY, true);
  } else {
    session.set(SESSION_KEY, false);
  }
}
