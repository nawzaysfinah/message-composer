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

let chunks = [];

function fetchChunks() {
  fetch("/chunks")
    .then((res) => res.json())
    .then((data) => {
      chunks = data;
      renderChunks();
    })
    .catch((err) => console.error("Failed to load chunks:", err));
}

function saveChunksToServer() {
  fetch("/chunks", {
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
    document.getElementById("chunkCategoryFilter")?.value || "All";
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
      formData[id] = selectedInternshipPeriod;
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
      sentence += ` at ${formData.company_name}, where you're currently the ${formData.job_title}`;
    } else if (formData.company_name) {
      sentence += ` at ${formData.company_name}`;
    } else if (formData.job_title) {
      sentence += ` with your role as ${formData.job_title}`;
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
    pitch += `I have a student, ${
      formData.student_name || "one of our top students"
    }`;

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
    link = `You can refer to the role here: ${formData.job_link}\n\n`;
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
    document.getElementById("chunkCategoryFilter")?.value || "All";
  chunks
    .filter(
      (chunk) =>
        selectedCategory === "All" || chunk.category === selectedCategory
    )
    .forEach((chunk) => {
      fullMessage += chunk.text + "\n\n";
    });

  previewBox.textContent = fullMessage.trim();
}

document.getElementById("messageForm").addEventListener("input", updatePreview);

let selectedInternshipPeriod = "";

document.querySelectorAll(".toggle-btn").forEach((button) => {
  button.addEventListener("click", () => {
    if (button.classList.contains("active")) {
      button.classList.remove("active");
      selectedInternshipPeriod = "";
    } else {
      document
        .querySelectorAll(".toggle-btn")
        .forEach((btn) => btn.classList.remove("active"));
      button.classList.add("active");
      selectedInternshipPeriod = button.dataset.value;
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
    const category = document.getElementById("chunkCategory").value;
    chunks.push({ id: Date.now(), text, category });
    chunkModal.classList.add("hidden");
    saveChunksToServer();
  }
});

function editChunk(id) {
  const chunk = chunks.find((c) => c.id === id);
  if (chunk) {
    chunkText.value = chunk.text;
    document.getElementById("chunkCategory").value =
      chunk.category || "Opening";
    chunkModal.classList.remove("hidden");
    document.getElementById("saveChunk").onclick = () => {
      chunk.text = chunkText.value.trim();
      chunk.category = document.getElementById("chunkCategory").value;
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
document
  .getElementById("chunkCategoryFilter")
  ?.addEventListener("change", renderChunks);

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
      const response = await fetch("http://localhost:11434/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "llama3", // replace with your running Ollama model
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
