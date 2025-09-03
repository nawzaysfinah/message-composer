const boilerplateRoute = require("./routes/boilerplate");
const chunksRoute = require("./routes/chunks");
const express = require("express");
const path = require("path");

const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));

const app = express();
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "llama3";
// Force the app to use port 3000 and fail fast if busy
const FORCE_PORT = 3000;

// Serve everything from /public
app.use(express.static("public"));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public/index.html"));
});

app.use(express.json());

app.post("/rewrite", async (req, res) => {
  const prompt = req.body.prompt;

  try {
    const ollamaRes = await fetch("http://127.0.0.1:11434/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
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

app.use("/", boilerplateRoute);
app.use("/api", chunksRoute);

function startServer(port) {
  const server = app
    .listen(port, () => {
      app.locals.port = port;
      console.log(`✅ Server running at http://localhost:${port}`);
    })
    .on("error", (err) => {
      if (err && err.code === "EADDRINUSE") {
        console.error(`❌ Port ${port} is already in use. Exiting.`);
        process.exit(1);
      } else {
        console.error("Server failed to start:", err);
        process.exit(1);
      }
    });
  return server;
}

startServer(FORCE_PORT);

// Lightweight status endpoint for UI banner
app.get("/status", async (req, res) => {
  const activePort = app.locals?.port || req.socket?.localPort || null;
  const modelName = OLLAMA_MODEL;
  try {
    const r = await fetch("http://127.0.0.1:11434/api/tags");
    const reachable = r.ok;
    let modelAvailable = false;
    let models = [];
    if (reachable) {
      const data = await r.json().catch(() => ({}));
      // data may be { models: [{ name: "llama3" }, ...] } depending on Ollama version
      const list = Array.isArray(data.models) ? data.models : [];
      models = list.map((m) => m.name || m.model).filter(Boolean);
      const norm = (s) => String(s || "").toLowerCase();
      const target = norm(modelName);
      modelAvailable = models.some((raw) => {
        const n = norm(raw);
        // Match exact, prefix, or pre-colon token
        if (n === target) return true;
        if (n.startsWith(target + ":")) return true;
        const beforeColon = n.split(":")[0];
        return beforeColon === target;
      });
    }
    res.json({
      port: activePort,
      ollama: { reachable, model: modelName, modelAvailable, models },
    });
  } catch (e) {
    res.json({
      port: activePort,
      ollama: { reachable: false, model: modelName, modelAvailable: false },
    });
  }
});
