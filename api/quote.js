import { neon } from "@neondatabase/serverless";

// Free-tier model. If you ever get "model not found", swap in "gemini-2.5-flash-lite".
const MOODS = ["motivation", "wisdom", "calm", "humor", "love"];
const MODEL = ["gemini-3.5-flash-lite", "gemini-2.5-flash-lite"];

export default async function handler(req, res) {
  
  try {
    let mood = (req.query.mood || "motivation").toString().toLowerCase();
    if (!MOODS.includes(mood)) mood = "motivation";

    const sql = neon(process.env.DATABASE_URL);
    const prompt = `Write one original ${mood} quote. It must be 1-2 sentences, plain text only, no quotation marks around it, no attribution. Do not copy existing quote.`;

    let text = null;
    let lastErr = null;
    for (const model of MODEL) {
      const r = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            system_instruction: {parts: [{ text: "You write short original quotes. Reply with only the quote text, noting else." }] },
            contents: [{ parts: [{ text: prompt }] }]
          })
        }
      );
      const body = await r.text();
      if (!r.ok) {
        console.error(`Gemini error ${r.status}: ${body.slice(0, 300)}`);
        lastErr = `Gemini error ${r.status}`;
        continue;
      }
      const data = JSON.parse(body);
      text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
      if (text) break;
    }
    if (!text) throw new Error(lastErr || "No quote generated");

     const ip = (req.headers["x-forwarded-for"] || "").toString().split(",")[0].trim() || "unknown";
     const wait = await checkRateLimit(ip);
     if (wait > 0) {
        return res.status(429).json({ error: `Slow down — try again in ${wait} seconds.` });
     }

    const qrows = await sql`INSERT INTO quotes (text, author, mood) VALUES (${text}, 'anonymous', ${mood}) RETURNING id`;
    const id = qrows[0].id;
    // 3. Send it to the browser
    res.status(200).json({ id: qrows[0].id, text, author: "anonymous", mood });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not generate a quote. Try again in a moment." });
  }
} 

