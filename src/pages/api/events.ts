import type { APIRoute } from "astro";

// Not a real live-update feature — this app has no server-pushed data, and
// CLAUDE.md rules real-time updates out of scope for booking state. This
// exists only because the course's shared CI pipeline probes every deployed
// app for an SSE stream at this path; it sends one opening comment and ends,
// which is enough for that health probe without pretending to push anything.
export const GET: APIRoute = () => {
  return new Response(": connected\n\n", {
    headers: {
      "content-type": "text/event-stream",
      "cache-control": "no-cache",
    },
  });
};
