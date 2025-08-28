const express = require("express");
const path = require("path");

const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));

const app = express();
const PORT = 3000;

// Serve everything from /public
app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public/index.html"));
});

app.use(express.json());

app.post("/rewrite", async (req, res) => {
  const prompt = req.body.prompt;

  try {
    const ollamaRes = await fetch("http://localhost:11434/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "llama3",
        prompt: prompt,
        system:
          "You are a professional assistant. Rewrite the given message in a clear, professional, and persuasive tone.",
        stream: false,
      }),
    });

    const data = await ollamaRes.json();
    res.json({ rewritten: data.response });
  } catch (err) {
    console.error(err);
    res.status(500).send("Ollama error");
  }
});

app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
