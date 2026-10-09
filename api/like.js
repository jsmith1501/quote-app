import { neon } from "@neondatabase/serverless";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  try {
    const id = parseInt(req.query.id, 10);
    if (!id) return res.status(400).json({ error: "Missing id" });
    const sql = neon(process.env.DATABASE_URL);
    const rows = await sql`UPDATE quotes SET likes = likes + 1 WHERE id = ${id} RETURNING likes`;
    if (!rows.length) return res.status(404).json({ error: "Not found" });
    res.status(200).json({ likes: rows[0].likes });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong." });
  }
}
