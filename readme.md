# ✉️ Message Composer

A local-first, browser-based tool to quickly generate and customize cold emails or internship proposals using structured inputs, reusable content chunks, and AI suggestions via local Ollama.

## 🚀 Features

- **Input Panel**: Enter dynamic contact and project details (e.g. contact name, company, internship period).
- **Custom Chunks**: Drag, drop, reorder, and edit reusable message chunks (stored in `chunks.json`).
- **Live Preview**: Instant message rendering on the right pane, always visible with smooth scrolling.
- **Internship Period Picker**: Toggle buttons to choose standard internship dates.
- **Category Filtering**: Filter visible chunks based on their categories using a dropdown.
- **AI Autocomplete**: Generate content using your local Ollama LLM (e.g. LLaMA3, Mistral) for selected fields.
- **Export Options**: Copy to clipboard or download the final message as `.txt` or `.md`.

## 📦 File Structure

```
message-composer/
├── public/
│   └── chunks.json        # Stores reusable text chunks
├── script.js              # Frontend logic & chunk rendering
├── index.html             # Main UI layout
├── styles.css             # Styling for UI and layout
├── server.js              # Node.js backend (for static serving and Ollama proxy)
├── run.sh                 # Start Ollama + Node server
├── .gitignore
└── README.md              # You're here!
```

## 🧠 Powered by Ollama (Local LLM)

Message Composer uses your local [Ollama](https://ollama.com) instance to suggest or autocomplete text via API (default: `http://localhost:11434`). It sends structured prompts based on selected fields.

### Example models:

- `llama3`
- `mistral`
- `gemma`

## 🛠️ Getting Started

### 1. Clone this repo

```bash
git clone https://github.com/your-username/message-composer.git
cd message-composer
```

### 2. Install dependencies

```bash
npm install
```

### 3. Run the app

```bash
chmod +x run.sh
./run.sh
```

This will:

- Start your local Ollama server (if installed)
- Serve the project on: [http://localhost:3000](http://localhost:3000)

Make sure Ollama is already installed and your desired model is pulled:

```bash
ollama run llama3
```

## 🧱 Customization

- ✍️ Add/edit chunks via the UI (or directly in `chunks.json`)
- 🧩 Add new categories to organize your content
- 🧠 Edit prompt generation logic for different models in `script.js`

## 📌 To-Do / Future Ideas

- Save/load message templates
- Authentication layer for multi-user usage
- Support for local saving using IndexedDB or FileSystem API
- Email integration (e.g. Gmail API)
- Enhanced prompt templates for different message types

## Preview
<img width="1509" height="823" alt="messagecomposer_example" src="https://github.com/user-attachments/assets/04ba16c5-b712-4d97-ae43-319b05bd777a" />

## 🧑‍💻 Made by Syazwan Hanif

Built as a productivity booster for educators, internship coordinators, and cold outreach professionals. Feel free to fork, adapt, or collaborate.

---

🧵 _Built with ❤️ using HTML, CSS, JS, Node.js, and Ollama._
