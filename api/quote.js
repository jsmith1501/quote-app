import { neon } from "@neondatabase/serverless";

// Free-tier model. If you ever get "model not found", swap in "gemini-2.5-flash-lite".
const MODEL = "gemini-3.5-flash-lite";

export default async function handler(req, res) {
  try {
    // 1. Ask Gemini for a fresh, original quote
    const aiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": process.env.GEMINI_API_KEY,
        },
        body: JSON.stringify({
          systemInstruction: {
            parts: [{ text: "You write short, original motivational quotes (one or two sentences). Never copy famous quotes. Reply with only the quote text, no quotation marks, no attribution." }],
          },
          contents: [{ parts: [{ text: "Write one original motivational quote." }] }],
          generationConfig: { temperature: 0.9, maxOutputTokens: 100 },
        }),
      }
    );

if (!aiRes.ok) {
  const body = await aiRes.text();
  throw new Error(`Gemini error ${aiRes.status}: ${body.slice(0, 300)}`);
}
    const aiData = await aiRes.json();
    const text = aiData.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    if (!text) throw new Error("Empty response from Gemini");

    // 2. Save it in Neon so your collection grows over time
    const sql = neon(process.env.DATABASE_URL);
    await sql`INSERT INTO quotes (text, author) VALUES (${text}, 'AI-generated')`;

    // 3. Send it to the browser
    res.status(200).json({ text, author: "AI-generated" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not generate a quote. Try again in a moment." });
  }
}
