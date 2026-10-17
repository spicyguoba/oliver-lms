import fs from "node:fs/promises";
import path from "node:path";
import postgres from "postgres";
import { hashPassword } from "./security.mjs";
import { migrateFamily } from "./migrations.mjs";
import { localDay } from "./dates.mjs";
const root = process.env.LMS_DATA_DIR || path.join(process.cwd(), ".data");
let queue = Promise.resolve();
const sql = process.env.DATABASE_URL
  ? postgres(process.env.DATABASE_URL, {
      max: 2,
      idle_timeout: 20,
      connect_timeout: 15,
      ssl: process.env.DATABASE_URL.includes("localhost") ? false : "require",
    })
  : null;
let initialized;
export function seed() {
  if (
    (process.env.VERCEL || process.env.NODE_ENV === "production") &&
    (!sql || !process.env.SESSION_SECRET || !process.env.ADMIN_PASSWORD_HASH)
  )
    throw new Error(
      "Production requires DATABASE_URL, SESSION_SECRET and ADMIN_PASSWORD_HASH.",
    );
  return {
    version: 3,
    learningProgram: { edition: 1, startDay: localDay() },
    dailyPlans: {},
    consistencyAwards: [],
    profile: {
      name: "Oliver",
      age: 7,
      grade: "2",
      avatar: "fox",
      dailyGoal: 15,
    },
    settings: {
      passwordHash:
        process.env.ADMIN_PASSWORD_HASH || hashPassword("admin1234"),
      authVersion: 1,
      childVersion: 1,
      timezone: "America/New_York",
      defaultPassword: true,
    },
    stars: 0,
    sessions: [],
    legacy: {},
    legacyEvents: [],
    legacyCompletions: [],
    materials: [],
    assignments: [],
    completions: [],
    rewards: [
      { id: "choose-story", title: "Choose our bedtime story", cost: 15 },
      { id: "family-game", title: "Family board game time", cost: 30 },
    ],
    redemptions: [],
    loginLimits: {},
    storyProgress: Array.from({ length: 5 }, (_, i) => ({
      unlocked: i === 0,
      streak: [],
    })),
  };
}
async function initialize() {
  seed();
  if (sql)
    await sql`CREATE TABLE IF NOT EXISTS oliver_family (id INTEGER PRIMARY KEY CHECK (id=1), data JSONB NOT NULL, updated_at TIMESTAMPTZ NOT NULL DEFAULT now())`;
  else await fs.mkdir(root, { recursive: true });
}
export async function transact(fn) {
  initialized ||= initialize().catch((e) => {
    initialized = null;
    throw e;
  });
  await initialized;
  if (sql)
    return sql.begin(async (tx) => {
      await tx`INSERT INTO oliver_family (id, data) VALUES (1, ${tx.json(seed())}) ON CONFLICT DO NOTHING`;
      const [row] =
        await tx`SELECT data FROM oliver_family WHERE id=1 FOR UPDATE`;
      const result = await fn(migrateFamily(row.data));
      await tx`UPDATE oliver_family SET data=${tx.json(row.data)}, updated_at=now() WHERE id=1`;
      return result;
    });
  const run = queue.then(async () => {
    const file = path.join(root, "family.json");
    let data;
    try {
      data = JSON.parse(await fs.readFile(file, "utf8"));
    } catch (e) {
      if (e.code !== "ENOENT") throw e;
      data = seed();
    }
    const result = await fn(migrateFamily(data));
    const tmp = path.join(root, `family-${process.pid}.tmp`);
    await fs.writeFile(tmp, JSON.stringify(data), { mode: 0o600 });
    await fs.rename(tmp, file);
    return result;
  });
  queue = run.catch(() => {});
  return run;
}
export function databaseMode() {
  return sql
    ? "PostgreSQL · cloud storage"
    : "Local development · file storage";
}
