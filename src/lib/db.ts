import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { courts } from "./schema";

// One SQLite file is the app's whole persistent state. In production
// fly.toml points DATABASE_PATH at the machine's volume (/data), which is
// how state survives a reload and a redeploy; locally it defaults to an
// untracked file in .data/.
const path = process.env.DATABASE_PATH ?? "./.data/app.db";
mkdirSync(dirname(path), { recursive: true });

const client = new Database(path);
client.pragma("journal_mode = WAL");

export const db = drizzle(client);

// Migrations run at boot, on whatever machine holds the volume — the
// recommended shape for SQLite on Fly, where there's no separate machine to
// run them from. The flow: edit src/lib/schema.ts, `pnpm db:generate`,
// commit the migration it writes to drizzle/.
migrate(db, { migrationsFolder: "./drizzle" });

// Seeds the 16 badminton courts (Old Hall 1-8, New Hall 1-8) the first time
// this database boots against an empty courts table — a fresh local
// .data/app.db, or a brand new Fly volume. Every later boot sees a non-empty
// table and is a no-op, so this is safe to run on every start.
const HALLS = ["Old Hall", "New Hall"] as const;

if (db.select({ id: courts.id }).from(courts).get() === undefined) {
  const seedRows = HALLS.flatMap((hall) =>
    Array.from({ length: 8 }, (_, index) => {
      const courtNumber = index + 1;
      return {
        hall,
        courtNumber,
        name: `${hall} BM Court ${courtNumber}`,
        displayRow: Math.floor(index / 4),
        displayColumn: index % 4,
      };
    }),
  );
  db.insert(courts).values(seedRows).run();
}
