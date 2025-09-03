# ✉️ Message Composer

Local-first tool to compose and customize internship outreach messages with structured inputs, reusable chunks, and AI help via your local Ollama.

## 🚀 Features

- **Structured Inputs**: Contact, job, student details, and internship period toggles.
- **Reusable Chunks**: Add, edit, reorder blocks; persisted to `public/chunks.json`.
- **Live Preview**: Always-on preview reflecting current inputs and chunk order.
- **AI Assist (Ollama)**:
  - “Generate Boilerplate” uses your local model with a tailored prompt.
  - “Rewrite with AI” refines the preview text.
- **Status Banner**: Shows active server port and Ollama/model availability.
- **Export**: Copy or download as `.txt` or `.md`.

## 📦 File Structure

```
message-composer/
├── public/
│   ├── index.html                 # UI
│   ├── style.css                  # Styles
│   ├── script.js                  # Frontend logic, chunks, status banner
│   ├── boilerplate-generator.js   # Boilerplate generation button wiring
│   └── chunks.json                # Stored chunks
├── routes/
│   ├── boilerplate.js             # /generate-boilerplate (Ollama + fallback)
│   └── chunks.js                  # /api/chunks (load/save chunks)
├── server.js                      # Express server (+ /status, /rewrite)
├── run.sh                         # Starts Ollama, frees port 3000, starts server
├── package.json
└── readme.md
```

## 🧠 Powered by Ollama

- API: `http://127.0.0.1:11434`
- Default model (configurable): `llama3.2`
- Change model via env: `OLLAMA_MODEL="llama3.2" ./run.sh`
- The status banner checks reachability and whether the configured model is installed.

## 🛠️ Getting Started

1) Clone and install

```bash
git clone https://github.com/your-username/message-composer.git
cd message-composer
npm install
```

2) Ensure Ollama is installed and a model is available

```bash
brew install ollama         # macOS (or see https://ollama.com/download)
ollama pull llama3.2        # or your preferred model
```

3) Run the app

```bash
chmod +x run.sh
./run.sh
```

What `./run.sh` does:
- Kills any process on port 3000 (then starts the server on 3000)
- Starts Ollama if not already running
- Ensures your model is installed (defaults to `llama3.2`)
- Opens `http://localhost:3000`

## 🔧 Endpoints

- `GET /status` – Server port and Ollama status, including installed models.
- `POST /generate-boilerplate` – Generates a 1‑paragraph boilerplate using your model.
- `POST /rewrite` – Rewrites the current preview using your model.
- `GET/POST /api/chunks` – Load/save reusable chunks.

## 🧱 Prompting (Boilerplate)

The server instructs the model as an internship placement officer for ITE College West’s AI Applications course to return a concise, 1‑paragraph (3–5 sentences) boilerplate tailored to the provided job description, with specific guidance on tone, competencies, and acknowledging partial mismatches.

## 🧰 Configuration

- Select model at launch:
  - `OLLAMA_MODEL="llama3.2" ./run.sh`
  - Default in `run.sh`: `llama3.2`
- Ollama API host: uses `http://127.0.0.1:11434`.

## 🧪 Troubleshooting

- Port 3000 in use:
  - `./run.sh` now auto‑kills listeners on 3000 before launching.
- Banner shows “Ollama: not reachable”:
  - Check `curl http://127.0.0.1:11434/api/tags` returns JSON.
  - Ensure `ollama serve` is running (the script tries to start it).
- Banner shows “Model 'X': not available”:
  - `ollama list` to see installed names.
  - `ollama pull X` (e.g., `ollama pull llama3.2`).
  - Start with `OLLAMA_MODEL="X" ./run.sh`.

## 🧑‍💻 Credits

Built by Syazwan Hanif to streamline internship outreach. Fork, adapt, and collaborate!

— Built with HTML, CSS, JS, Node.js, and Ollama.
