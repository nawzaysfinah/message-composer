document.addEventListener("DOMContentLoaded", () => {
  const generateBtn = document.getElementById("generate-boilerplate-btn");
  const jobDescriptionInput = document.getElementById("job-description");
  const outputField = document.getElementById("boilerplate-output");

  if (!generateBtn || !jobDescriptionInput || !outputField) {
    console.error("Required DOM elements not found for boilerplate generator.");
    return;
  }

  generateBtn.addEventListener("click", async () => {
    const jobDescription = jobDescriptionInput.value.trim();

    if (!jobDescription) {
      outputField.value = "Please enter a job description.";
      return;
    }

    outputField.value = "Generating boilerplate…";

    try {
      const response = await fetch("/generate-boilerplate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ jobDescription }),
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.statusText}`);
      }

      const data = await response.json();
      outputField.value = data.boilerplate || "No boilerplate returned.";
    } catch (error) {
      console.error("Error generating boilerplate:", error);
      outputField.value = "An error occurred while generating boilerplate.";
    }
  });
});
