// ============================================================
// FILE: api/story.js
// This is your secure middleman. It runs on Vercel's servers,
// keeps your API key hidden, and talks to Anthropic for you.
// You do NOT need to edit this file.
// ============================================================

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { words, sentenceCount, password, ageGroup } = req.body;

  if (password !== process.env.CLASSROOM_PASSWORD) {
    return res.status(401).json({ error: "Incorrect password" });
  }

  const ageInstructions = {
    "under4":  "The reader is under 4 years old. Use extremely simple words (1-2 syllables), very short sentences, and a warm, gentle, playful tone. The story should feel like a picture book — simple animals, toys, or nature scenes. No conflict or scary elements.",
    "5to8":    "The reader is 5 to 8 years old. Use simple, clear language an early-elementary child would understand. The story should be fun, imaginative, and slightly adventurous — like a children's chapter book. Avoid anything frightening or complex.",
    "9to11":   "The reader is 9 to 11 years old. Use age-appropriate vocabulary for a middle-elementary student. The story can have light adventure, friendship themes, humour, and mild tension — nothing frightening or mature.",
    "12to14":  "The reader is 12 to 14 years old. Use vocabulary suitable for a middle school student. The story can explore themes like friendship, identity, light mystery, or adventure. Avoid adult themes, romance beyond a crush, or anything disturbing.",
    "15to17":  "The reader is 15 to 17 years old. Use natural teen-appropriate language. The story can explore more complex emotions, coming-of-age themes, or compelling scenarios. Keep it age-appropriate — no explicit content, graphic violence, or adult situations.",
    "18plus":  "The reader is 18 or older. Write an engaging, mature story with sophisticated vocabulary and complex themes if appropriate. Still keep it completely clean — no swearing, no explicit content, no religious symbols or references.",
  };

  const agePrompt = ageInstructions[ageGroup] || ageInstructions["9to11"];

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1000,
      messages: [{
        role: "user",
        content: `You are a creative storyteller writing for a classroom vocabulary activity.

AUDIENCE: ${agePrompt}

RULES:
- Use ALL of the words listed below at least once
- The story must be exactly ${sentenceCount} sentences long
- No swearing, profanity, or crude language of any kind
- No religious symbols, figures, or references of any kind
- No political references
- Age-appropriate content only as described above
- Write only the story — no title, no preamble, no explanation

Words to include: ${words.join(", ")}`
      }]
    }),
  });

  const data = await response.json();
  const story = data.content?.map(b => b.text || "").join("") || "";
  return res.status(200).json({ story });
};
