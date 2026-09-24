import type { APIRoute } from "astro";
import { setAnuStudent } from "../../../lib/anu-login";

// Mock ANU SSO: flips this browser's session to "verified ANU student".
// Real ANU SSO is out of scope (CLAUDE.md) — this exists only so the app can
// demonstrate that Free Student Hour is gated behind student status, not
// available to an anonymous visitor.
export const POST: APIRoute = async ({ request, redirect, session }) => {
  await setAnuStudent(session, true);
  const form = await request.formData();
  const back = String(form.get("returnTo") ?? "/");
  // Only ever redirect back to a path on this site, never off it.
  return redirect(/^\/(?!\/)/.test(back) ? back : "/", 303);
};
