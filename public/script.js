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
  const selectedCategory =
    document.getElementById("chunkCategoryFilter")?.value ||
    document.getElementById("chunkFilter")?.value ||
    "All";
  chunks
    .filter(
      (chunk) =>
        chunk.text.toLowerCase().includes(searchTerm) &&
        (selectedCategory === "All" || chunk.category === selectedCategory)
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

  let sentence = `I'm reaching out`;

  if (formData.company_name || formData.job_title) {
    sentence += ` to explore potential internship opportunities`;

    if (formData.company_name && formData.job_title) {
      sentence += ` at ${formData.company_name}, for the ${formData.job_title} role`;
    } else if (formData.company_name) {
      sentence += ` at ${formData.company_name}`;
    } else if (formData.job_title) {
      sentence += ` for the ${formData.job_title} role`;
    }
  }

  sentence += `.\n\n`;

  // Student pitch
  let pitch = "";
  if (
    formData.student_name ||
    formData.project_title ||
    formData.student_pitch
  ) {
    pitch += "I have a student";
    if (formData.student_name) {
      pitch += `, ${formData.student_name}`;
    }
    if (formData.project_title) {
      pitch += `, who recently worked on a project titled "${formData.project_title}"`;
    }
    pitch += `. `;

    if (formData.student_pitch) {
      pitch += formData.student_pitch;
      if (!formData.student_pitch.trim().endsWith(".")) {
        pitch += ".";
      }
    }

    pitch += "\n\n";
  }

  // Job link sentence
  let link = "";
  if (formData.job_link) {
    link = `Here is the job listing posted by your team: ${formData.job_link}\n\n`;
  }

  // Internship period
  let intern = "";
  if (formData.internship_period) {
    intern = `The proposed internship period is: ${formData.internship_period}\n\n`;
  }

  // Now combine all
  let fullMessage = intro + sentence + pitch + link + intern;

  // Add chunks filtered by selected category
  const selectedCategory =
    document.getElementById("chunkCategoryFilter")?.value ||
    document.getElementById("chunkFilter")?.value ||
    "All";
  chunks
    .filter(
      (chunk) =>
        selectedCategory === "All" || chunk.category === selectedCategory
    )
    .forEach((chunk) => {
      fullMessage += chunk.text + "\n\n";
    });

  fullMessage += `You can learn more about the course here:\n👉 Higher Nitec in AI Applications – Course Overview: https://www.ite.edu.sg/courses/course-finder/course/higher-nitec-in-ai-applications\nIf you're open to a quick chat, I have attached my calendar for booking at your convenience:\nBook time with Syazwan HANIF (ITE): Office Hours: https://outlook.office.com/bookwithme/user/d2d0ebef929d4accbe27e1d5788b8df6@ite.edu.sg/meetingtype/tTLhlJ-CBkG1M97S3P-sRA2?anonymous&amp;ep=mlink\nLooking forward to hearing from you 🙂`;

  previewBox.textContent = fullMessage.trim();
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
document.getElementById("copyBtn").addEventListener("click", () => {
  navigator.clipboard.writeText(previewBox.textContent);
});

document.getElementById("downloadTxt").addEventListener("click", () => {
  downloadFile(previewBox.textContent, "message.txt");
});

document.getElementById("downloadMd").addEventListener("click", () => {
  downloadFile(previewBox.textContent, "message.md");
});

function downloadFile(content, filename) {
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
}

fetchChunks();
document.getElementById("chunkSearch")?.addEventListener("input", renderChunks);
document.getElementById("chunkCategoryFilter")?.addEventListener("change", renderChunks);
document.getElementById("chunkFilter")?.addEventListener("change", renderChunks);

// Rewrite functionality using /rewrite API and Ollama
document.getElementById("rewriteBtn")?.addEventListener("click", async () => {
  const originalText = previewBox.textContent;

  try {
    const response = await fetch("/rewrite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: originalText }),
    });

    if (!response.ok) throw new Error("Failed to rewrite message");

    const data = await response.json();
    previewBox.textContent = data.rewritten.trim();
  } catch (err) {
    console.error("Rewrite error:", err);
    alert("Something went wrong while rewriting the message.");
  }
  });

document
  .getElementById("rewriteOllamaBtn")
  ?.addEventListener("click", async () => {
    const originalText = previewBox.textContent;

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
      previewBox.textContent = data.response.trim();
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
