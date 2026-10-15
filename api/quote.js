import { neon } from "@neondatabase/serverless";

// Free-tier model. If you ever get "model not found", swap in "gemini-2.5-flash-lite".
const MOODS = ["motivation", "wisdom", "calm", "humor", "love"];
const MODEL = ["gemini-3.5-flash-lite", "gemini-2.5-flash-lite"];

const ANGLES = [
  "a vivid nature metaphor",
  "a short imperative command",
  "a paradox that resolves into insight",
  "a rhetorical question",
  "an image from everyday city life",
  "a contrast between two opposites",
  "a quiet observation, not advice",
  "a celestial or cosmic image",
  "a sports or movement metaphor",
  "a cooking or craft metaphor",
  "a memory from childhood",
  "an architectural or building metaphor"
];

export default async function handler(req, res) {
  
  try {
    let mood = (req.query.mood || "motivation").toString().toLowerCase();
    if (!MOODS.includes(mood)) mood = "motivation";

    const sql = neon(process.env.DATABASE_URL);
    const angle = ANGLES[Math.floor(Math.random() * ANGLES.length)];
    const prompt = `Write one original ${mood} quote built around ${angle}. 1-2 sentences, plain text only, no quotation marks around it, no attribution. Avoid cliches and do not reuse the same signature words (like "anchor" or "soft") — make it sound unlike a typical AI-generated quote.`;

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
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 1.15, maxOutputTokens: 120 }

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

    const qrows = await sql`INSERT INTO quotes (text, author, mood) VALUES (${text}, 'anonymous', ${mood}) RETURNING id`;
    const id = qrows[0].id;
    // 3. Send it to the browser
    res.status(200).json({ id: qrows[0].id, text, author: "anonymous", mood });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not generate a quote. Try again in a moment." });
  }
} 

