import { neon } from "@neondatabase/serverless";

const COOLDOWN_MS = 15 * 1000; // one quote per IP every 15 seconds

// Returns seconds to wait, or 0 if the request may proceed.
export async function checkRateLimit(ip) {
  const sql = neon(process.env.DATABASE_URL);
  await sql`CREATE TABLE IF NOT EXISTS rate_limits (ip TEXT PRIMARY KEY, last_hit TIMESTAMPTZ NOT NULL DEFAULT NOW())`;
  const rows = await sql`SELECT last_hit FROM rate_limits WHERE ip = ${ip}`;
  if (rows.length) {
    const elapsed = Date.now() - new Date(rows[0].last_hit).getTime();
    if (elapsed < COOLDOWN_MS) return Math.ceil((COOLDOWN_MS - elapsed) / 1000);
  }
  await sql`INSERT INTO rate_limits (ip, last_hit) VALUES (${ip}, NOW())
            ON CONFLICT (ip) DO UPDATE SET last_hit = NOW()`;
  return 0;
}
