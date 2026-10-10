# The Daily Spark


An AI quote generator — pick a mood, and Gemini writes an original quote on the spot. Every quote is saved forever and joins the public collection.


**Live:** https://borie-daily-spark.vercel.app


## How it works


1. Pick a mood and click generate
2. Gemini composes an original quote (never from a list)
3. It's stored in Postgres and appears in the collection


## Stack


- Frontend: HTML, CSS, JavaScript
- API: Vercel serverless functions
- Database: Neon Postgres
- AI: Google Gemini


## Features


- Mood-based generation (motivation, wisdom, calm, humor, love)
- Like button + Most Loved section
- Share to X, LinkedIn, Facebook, Instagram and Snapchat; copy to clipboard
- Per-IP rate limiting to protect the API quota

