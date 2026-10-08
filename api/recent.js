import { neon } from "@neondatabase/serverless";

export default async function handler(req, res) {
    try {
        const sql = neon(process.env.DATABASE_URL);
        const rows = await sql `SELECT text, author FROM quotes ORDER BY id DESC LIMIT 6`;
        res.status(200).json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Could not load recent quotes" });
    }
}