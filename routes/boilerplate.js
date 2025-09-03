const express = require("express");
const router = express.Router();

const fetchFn = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));

const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "llama3";

// Dummy boilerplate generator function
function generateBoilerplateFallback({ jobDescription }) {
  return `Our students are well-equipped to contribute meaningfully to roles such as "${jobDescription}" thanks to rigorous training in relevant modules. They’ve developed both technical skills and a hands-on, collaborative mindset that aligns with your organisational needs.`;
}

router.post("/generate-boilerplate", async (req, res) => {
  const { jobDescription, curriculumChunks = [] } = req.body || {};

  if (!jobDescription || !Array.isArray(curriculumChunks)) {
    return res.status(400).json({ error: "Invalid input format." });
  }

  // Try local Ollama first; if it fails, return a deterministic fallback.
  try {
    const systemPrompt =
      "You are an internship placement officer for ITE College West’s AI Applications course.";

    const userPrompt = `Your goal is to write a short, professional boilerplate pitch explaining why our students are a good fit for a given internship job description.\n\nHere’s what you must do:\n1. Keep the tone professional, positive, and concise.\n2. Highlight that our students are hands-on, adaptable, and skilled in practical AI, data, and tech tools.\n3. Reference relevant competencies (e.g. data cleaning, Python, dashboarding, annotation, stakeholder communication) only if the job requires them.\n4. Acknowledge where students are not a perfect match (e.g. not medical students), but show how they can still contribute with guidance.\n\nGiven the following job description, return a 1-paragraph boilerplate (3–5 sentences) that can be used in outreach emails or messages to internship hosts. No headings, no fluff — just the message.\n\nJob Description:\n${jobDescription}`;

    const resp = await fetchFn("http://127.0.0.1:11434/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        stream: false,
        system: systemPrompt,
        prompt: userPrompt,
        options: {
          temperature: 0.6,
          top_p: 0.9,
          repeat_penalty: 1.1,
        },
      }),
    });

    if (!resp.ok) {
      throw new Error(`Ollama HTTP ${resp.status}`);
    }
    const data = await resp.json();
    const text = (data && data.response ? String(data.response) : "").trim();
    if (!text) throw new Error("Empty response from Ollama");
    return res.json({ boilerplate: text });
  } catch (e) {
    console.warn("Ollama unavailable, using fallback:", e?.message || e);
    const boilerplate = generateBoilerplateFallback({ jobDescription });
    return res.json({ boilerplate });
  }
});

module.exports = router;
