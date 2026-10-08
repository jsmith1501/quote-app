import { neon } from "@neondatabase/serverless";

export default async function handler(req, res) {
  try {
    const sql = neon(process.env.DATABASE_URL);
    const rows = await sql`SELECT COUNT(*) AS count FROM quotes`;
    res.status(200).json({ count: Number(rows[0].count) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not load count" });
  }
}
