// ============================================================
// FILE: api/story.js
// This is your secure middleman. It runs on Vercel's servers,
// keeps your API key hidden, and talks to Anthropic for you.
// You do NOT need to edit this file.
// ============================================================

export default async function handler(req, res) {
  // Allow any website to call this function
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Access-Control-Max-Age", "86400");

  // Handle browser "pre-flight" check
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { words, sentenceCount, password } = req.body;
  const correctPassword = process.env.CLASSROOM_PASSWORD;

  if (!password || password !== correctPassword) {
    return res.status(401).json({ error: "Incorrect password" });
  }

  if (!words || !Array.isArray(words) || words.length === 0) {
    return res.status(400).json({ error: "No words provided" });
  }

  try {
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
        messages: [
          {
            role: "user",
            content: `You are a creative storyteller for a classroom. Write a short story that uses ALL of the following ${words.length} words naturally within it. The story must be exactly ${sentenceCount} sentences long. Make it imaginative, vivid, and engaging — suitable for a classroom vocabulary activity. Use each word at least once; the words don't need to appear in order.

Words to include: ${words.join(", ")}

Write only the story, no preamble or explanation.`,
          },
        ],
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(500).json({ error: data.error?.message || "Anthropic API error" });
    }

    const story = data.content?.map((b) => b.text || "").join("") || "";
    return res.status(200).json({ story });
  } catch (err) {
    return res.status(500).json({ error: "Server error: " + err.message });
  }
}
