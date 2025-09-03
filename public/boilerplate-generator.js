document.addEventListener("DOMContentLoaded", () => {
  // Match actual IDs in public/index.html
  const generateBtn = document.getElementById("generateBoilerplate");
  const jobDescInput = document.getElementById("job_description");
  const resultOutput = document.getElementById("boilerplateOutput");
  const statusEl = document.getElementById("generateStatus");

  if (!generateBtn || !jobDescInput || !resultOutput) {
    console.error("Required DOM elements not found. Please check your HTML.");
    return;
  }

  generateBtn.addEventListener("click", async () => {
    generateBtn.disabled = true;
    generateBtn.textContent = "Generating...";
    if (statusEl) statusEl.textContent = "Calling generator…";
    resultOutput.value = "";

    const jobDescription = jobDescInput.value.trim();

    if (!jobDescription) {
      alert("Please paste a job description first.");
      generateBtn.disabled = false;
      generateBtn.textContent = "🧠 Generate Boilerplate";
      if (statusEl) statusEl.textContent = "";
      return;
    }

    try {
      const response = await fetch("/generate-boilerplate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // Server expects { jobDescription, curriculumChunks }
        body: JSON.stringify({ jobDescription, curriculumChunks: [] }),
      });

      if (!response.ok) throw new Error("Failed to generate boilerplate");

      const data = await response.json();
      const text = data.boilerplate || "No boilerplate returned.";
      resultOutput.value = text;
      const previewOutput = document.getElementById("preview");
      if (previewOutput) previewOutput.textContent = text;
      if (statusEl) statusEl.textContent = "✅ Generated";
    } catch (error) {
      console.error("Error during fetch:", error);
      if (statusEl) statusEl.textContent = "❌ Generation failed";
      resultOutput.value =
        "❌ Ollama server might be down or an error occurred.";
    } finally {
      generateBtn.disabled = false;
      generateBtn.textContent = "🧠 Generate Boilerplate";
    }
  });
});
