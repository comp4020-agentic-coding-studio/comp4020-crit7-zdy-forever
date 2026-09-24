import type { APIRoute } from "astro";
import { setAnuStudent } from "../../../lib/anu-login";

// Drops this browser's session back to "visitor". Existing bookings are
// untouched — only future Free Student Hour eligibility is affected.
export const POST: APIRoute = async ({ request, redirect, session }) => {
  await setAnuStudent(session, false);
  const form = await request.formData();
  const back = String(form.get("returnTo") ?? "/");
  // Only ever redirect back to a path on this site, never off it.
  return redirect(/^\/(?!\/)/.test(back) ? back : "/", 303);
};
