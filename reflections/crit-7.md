# Crit 7 reflection

The breakthrough was realising the redesign had two genuinely different
problems hiding inside one brief, and that conflating them would have
produced a worse result. Making the court map "feel real" was a frontend
interaction problem: real buttons in a plain form so it works with no
JavaScript, with an inline script layered on top purely for instant
feedback. Making the booking *trustworthy* was a backend problem entirely
independent of that UI: availability and Free Student Hour eligibility had
to be recomputed from SQLite at the moment of write, never taken on the
client's word, with a unique database index as the final backstop under
even the application-level check. Once I separated "how does this feel to
click" from "what does the server actually guarantee," both halves got
simpler, and the one moment I mixed them up — a stray thought about
short-circuiting the conflict check using state the page had already
rendered — was easy to catch precisely because I'd drawn that line first.

What this changed about who I want to be as a developer is a sharper
instinct for asking "what does the client's copy of this fact obligate the
server to re-check?" before writing any handler that mutates persisted
state, rather than treating "the UI already validated it" as reassurance.
It also reinforced that fighting a tool head-on (I initially tried to fake
a TTY for drizzle-kit's interactive prompt) is often the wrong move;
restructuring the schema change into two unambiguous diffs took less time
than the workaround and left a clean migration history besides.
