const inputs = [
  "contact_name",
  "job_title",
  "company_name",
  "job_link",
  "student_name",
  "project_title",
  "internship_period",
  "student_pitch",
];

const previewBox = document.getElementById("preview");
const chunkList = document.getElementById("chunkList");
const chunkModal = document.getElementById("chunkModal");
const chunkText = document.getElementById("chunkText");
const addChunkBtn = document.getElementById("addChunkBtn");

// Model name from server status (fallback to llama3)
let statusModelName = "llama3";

let chunks = [];
let latestPlain = "";
let latestHTML = "";

// --- Helpers: safe HTML + linkification ---
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function encodeAttr(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

// Convert URLs (http/https and www.) and emails to anchors while escaping other text
function linkifyAndEscape(text) {
  const tokenRegex =
    /((?:https?:\/\/|www\.)[^\s]+)|([A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,})/g;
  let result = [];
  let lastIndex = 0;
  // Correct callback params: match, p1(url/www), p2(email), offset
  text.replace(tokenRegex, (match, urlOrWww, email, offset) => {
    const before = text.slice(lastIndex, offset);
    if (before) result.push(escapeHtml(before));
    if (urlOrWww) {
      const isWww = urlOrWww.startsWith("www.");
      const hrefRaw = (isWww ? `https://${urlOrWww}` : urlOrWww).replace(
        /&amp;/g,
        "&"
      );
      const href = encodeAttr(hrefRaw);
      const display = escapeHtml(urlOrWww);
      result.push(
        `<a href="${href}" target="_blank" rel="noopener noreferrer">${display}</a>`
      );
    } else if (email) {
      const safeEmail = encodeAttr(email);
      result.push(`<a href="mailto:${safeEmail}">${escapeHtml(email)}</a>`);
    }
    lastIndex = offset + match.length;
    return match;
  });
  const tail = text.slice(lastIndex);
  if (tail) result.push(escapeHtml(tail));
  return result.join("");
}

function fetchChunks() {
  fetch("/api/chunks")
    .then((res) => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    })
    .then((data) => {
      chunks = data;
      renderChunks();
    })
    .catch((err) => {
      console.error("Failed to load chunks:", err);
      // Keep UI usable even if API not available
      chunks = [];
      renderChunks();
    });
}

function saveChunksToServer() {
  fetch("/api/chunks", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(chunks),
  }).then(() => renderChunks());
}

function renderChunks() {
  chunkList.innerHTML = "";
  const searchTerm =
    document.getElementById("chunkSearch")?.value?.toLowerCase() || "";
  const selectedCategoryRaw =
    document.getElementById("chunkCategoryFilter")?.value ||
    document.getElementById("chunkFilter")?.value ||
    "all";
  const selectedCategory = String(selectedCategoryRaw).toLowerCase();
  chunks
    .filter(
      (chunk) =>
        chunk.text.toLowerCase().includes(searchTerm) &&
        (selectedCategory === "all" ||
          String(chunk.category || "").toLowerCase() === selectedCategory)
    )
    .forEach((chunk, index) => {
      const div = document.createElement("div");
      div.className = "chunk";
      div.setAttribute("data-id", chunk.id);
      div.innerHTML = `
      <span>${chunk.text.slice(0, 50)}...</span>
      <span>
        <button onclick="editChunk(${chunk.id})">✏️</button>
        <button onclick="deleteChunk(${chunk.id})">🗑️</button>
      </span>
    `;
      chunkList.appendChild(div);
    });
  updatePreview();
}

function updatePreview() {
  const formData = {};
  inputs.forEach((id) => {
    if (id === "internship_period") {
      formData[id] = selectedInternshipPeriods.join(", ");
    } else {
      formData[id] = document.getElementById(id).value.trim();
    }
  });

  // Build the base intro sentence
  let intro = "";
  if (formData.contact_name) {
    intro += `Hi ${formData.contact_name},\n\n`;
  }

  let sentence = "I'm reaching out";
  if (formData.company_name && formData.job_title) {
    sentence += ` regarding an internship opportunity for the ${formData.job_title} role at ${formData.company_name}.`;
  } else if (formData.company_name) {
    sentence += ` regarding internship opportunities at ${formData.company_name}.`;
  } else if (formData.job_title) {
    sentence += ` regarding an internship opportunity for the ${formData.job_title} role.`;
  } else {
    sentence += ` regarding internship opportunities.`;
  }
  sentence += `\n\n`;

  // Student pitch
  let pitch = "";
  if (
    formData.student_name ||
    formData.project_title ||
    formData.student_pitch
  ) {
    if (formData.student_name) {
      pitch += `I'd like to recommend ${formData.student_name}, a student from ITE College West's Higher Nitec in AI Applications.`;
    } else {
      pitch += `I'd like to recommend a student from ITE College West's Higher Nitec in AI Applications.`;
    }
    if (formData.project_title) {
      pitch += ` They recently completed a project titled "${formData.project_title}".`;
    }
    if (formData.student_pitch) {
      const sp = formData.student_pitch.trim();
      pitch += ` ${sp}${/[.!?]$/.test(sp) ? "" : "."}`;
    }

    pitch += "\n\n";
  }

  // Job link sentence
  let link = "";
  if (formData.job_link) {
    link = `Here is the role I'm referring to: ${formData.job_link}\n\n`;
  }

  // Internship period
  let intern = "";
  if (formData.internship_period) {
    intern = `The proposed internship period is: ${formData.internship_period}\n\n`;
  }

  // Now combine all
  let fullMessage = intro + sentence + pitch + link + intern;

  // Add chunks filtered by selected category
  const selectedCategoryRaw =
    document.getElementById("chunkCategoryFilter")?.value ||
    document.getElementById("chunkFilter")?.value ||
    "all";
  const selectedCategory = String(selectedCategoryRaw).toLowerCase();
  chunks
    .filter(
      (chunk) =>
        selectedCategory === "all" ||
        String(chunk.category || "").toLowerCase() === selectedCategory
    )
    .forEach((chunk) => {
      fullMessage += chunk.text + "\n\n";
    });

  const finalText = fullMessage.trim();
  const html = linkifyAndEscape(finalText).replace(/\n/g, "<br>");
  previewBox.innerHTML = html;
  latestPlain = finalText;
  latestHTML = html;
}

document.getElementById("messageForm").addEventListener("input", updatePreview);

let selectedInternshipPeriods = [];

document.querySelectorAll(".toggle-btn").forEach((button) => {
  button.addEventListener("click", () => {
    const value = button.dataset.value;
    if (button.classList.contains("active")) {
      button.classList.remove("active");
      selectedInternshipPeriods = selectedInternshipPeriods.filter(
        (v) => v !== value
      );
    } else {
      button.classList.add("active");
      selectedInternshipPeriods.push(value);
    }
    updatePreview();
  });
});

new Sortable(chunkList, {
  animation: 150,
  onEnd: () => {
    const newOrder = [];
    chunkList.querySelectorAll(".chunk").forEach((div) => {
      const id = parseInt(div.getAttribute("data-id"));
      const chunk = chunks.find((c) => c.id === id);
      if (chunk) newOrder.push(chunk);
    });
    chunks = newOrder;
    updatePreview();
  },
});

addChunkBtn.addEventListener("click", () => {
  chunkModal.classList.remove("hidden");
  chunkText.value = "";
});

document.getElementById("cancelChunk").addEventListener("click", () => {
  chunkModal.classList.add("hidden");
});

document.getElementById("saveChunk").addEventListener("click", () => {
  const text = chunkText.value.trim();
  if (text) {
    const category =
      document.getElementById("chunkCategory")?.value || "Default";
    chunks.push({ id: Date.now(), text, category });
    chunkModal.classList.add("hidden");
    saveChunksToServer();
  }
});

function editChunk(id) {
  const chunk = chunks.find((c) => c.id === id);
  if (chunk) {
    chunkText.value = chunk.text;
    const catEl = document.getElementById("chunkCategory");
    if (catEl) catEl.value = chunk.category || "Default";
    chunkModal.classList.remove("hidden");
    document.getElementById("saveChunk").onclick = () => {
      chunk.text = chunkText.value.trim();
      chunk.category =
        document.getElementById("chunkCategory")?.value || chunk.category;
      chunkModal.classList.add("hidden");
      saveChunksToServer();
    };
  }
}

function deleteChunk(id) {
  chunks = chunks.filter((c) => c.id !== id);
  saveChunksToServer();
}

// Export & Copy
document.getElementById("copyBtn").addEventListener("click", async () => {
  const html = previewBox.innerHTML;
  const plain = previewBox.innerText;
  try {
    if (navigator.clipboard && window.ClipboardItem) {
      const item = new ClipboardItem({
        "text/html": new Blob([html], { type: "text/html" }),
        "text/plain": new Blob([plain], { type: "text/plain" }),
      });
      await navigator.clipboard.write([item]);
    } else {
      await navigator.clipboard.writeText(plain);
    }
  } catch (e) {
    console.error("Clipboard write failed, falling back to text:", e);
    try {
      await navigator.clipboard.writeText(plain);
    } catch {}
  }
});

document.getElementById("downloadTxt").addEventListener("click", () => {
  downloadFile(latestPlain, "message.txt", "text/plain;charset=utf-8");
});

// Convert plain text with URLs to Markdown with links
function toMarkdown(text) {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  return text.replace(urlRegex, (m) => {
    const u = m.replace(/&amp;/g, "&");
    return `[${u}](${u})`;
  });
}

document.getElementById("downloadMd").addEventListener("click", () => {
  const md = toMarkdown(latestPlain);
  downloadFile(md, "message.md", "text/markdown;charset=utf-8");
});

document.getElementById("downloadHtml").addEventListener("click", () => {
  const htmlDoc = `<!DOCTYPE html><html><head><meta charset=\"UTF-8\"><title>Message</title></head><body>${latestHTML}</body></html>`;
  downloadFile(htmlDoc, "message.html", "text/html;charset=utf-8");
});

function downloadFile(content, filename, mime = "text/plain;charset=utf-8") {
  const blob = new Blob([content], { type: mime });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
}

fetchChunks();
document.getElementById("chunkSearch")?.addEventListener("input", renderChunks);
document
  .getElementById("chunkCategoryFilter")
  ?.addEventListener("change", renderChunks);
document
  .getElementById("chunkFilter")
  ?.addEventListener("change", renderChunks);

// Rewrite functionality using /rewrite API and Ollama
document.getElementById("rewriteBtn")?.addEventListener("click", async () => {
  const originalText = previewBox.innerText;

  try {
    const response = await fetch("/rewrite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: originalText }),
    });

    if (!response.ok) throw new Error("Failed to rewrite message");

    const data = await response.json();
    const rewritten = data.rewritten.trim();
    const html = linkifyAndEscape(rewritten).replace(/\n/g, "<br>");
    previewBox.innerHTML = html;
    latestPlain = rewritten;
    latestHTML = html;
  } catch (err) {
    console.error("Rewrite error:", err);
    alert("Something went wrong while rewriting the message.");
  }
});

document
  .getElementById("rewriteOllamaBtn")
  ?.addEventListener("click", async () => {
    const originalText = previewBox.innerText;

    try {
      const response = await fetch("http://127.0.0.1:11434/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: statusModelName, // use model advertised by server
          stream: false,
          prompt: `Please improve the following cold outreach message to make it more concise, clear, and professional:\n\n${originalText}`,
        }),
      });

      if (!response.ok) throw new Error("Failed to rewrite with Ollama");

      const data = await response.json();
      const rewritten = data.response.trim();
      const html = linkifyAndEscape(rewritten).replace(/\n/g, "<br>");
      previewBox.innerHTML = html;
      latestPlain = rewritten;
      latestHTML = html;
    } catch (err) {
      console.error("Ollama rewrite error:", err);
      alert("Failed to get rewritten text from Ollama.");
    }
  });

// --- Status banner ---
async function refreshAppStatus() {
  const el = document.getElementById("appStatus");
  if (!el) return;
  try {
    const r = await fetch("/status");
    if (!r.ok) throw new Error("status not ok");
    const s = await r.json();
    const port = s?.port || window.location.port || "unknown";
    const o = s?.ollama || {};
    const reach = o.reachable ? "reachable" : "not reachable";
    const model = o.model || "llama3";
    const ok = o.modelAvailable ? "available" : "not available";
    statusModelName = model;
    el.textContent = `Server port: ${port} • Ollama: ${reach} • Model '${model}': ${ok}`;
  } catch (e) {
    const port = window.location.port || "unknown";
    el.textContent = `Server port: ${port} • Ollama: status unavailable`;
  }
}

// Initial and periodic refresh
refreshAppStatus();
setInterval(refreshAppStatus, 10000);
