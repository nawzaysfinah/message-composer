const express = require("express");
const fs = require("fs");
const path = require("path");

const router = express.Router();

const chunksPath = path.join(__dirname, "..", "public", "chunks.json");

router.get("/chunks", (req, res) => {
  try {
    const raw = fs.readFileSync(chunksPath, "utf8");
    const data = JSON.parse(raw || "[]");
    res.json(data);
  } catch (e) {
    console.error("Failed to read chunks:", e);
    res.status(500).json({ error: "Failed to read chunks" });
  }
});

router.post("/chunks", (req, res) => {
  try {
    const incoming = req.body;
    if (!Array.isArray(incoming)) {
      return res.status(400).json({ error: "Expected an array of chunks" });
    }
    fs.writeFileSync(chunksPath, JSON.stringify(incoming, null, 2), "utf8");
    res.json({ ok: true });
  } catch (e) {
    console.error("Failed to write chunks:", e);
    res.status(500).json({ error: "Failed to write chunks" });
  }
});

module.exports = router;

