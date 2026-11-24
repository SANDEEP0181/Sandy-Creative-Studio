(() => {
  const button = document.getElementById("creatorPackV2Btn");
  if (!button) return;
  const status = document.getElementById("creatorPackV2Status");
  const output = document.getElementById("result");
  const outputStatus = document.getElementById("status");
  const getValue = (id) => document.getElementById(id)?.value?.trim() || "";
  button.addEventListener("click", async () => {
    const idea = getValue("idea");
    if (idea.length < 3) {
      status.textContent = "Please enter an idea with at least 3 characters.";
      document.getElementById("idea")?.focus();
      return;
    }
    const apiBase = (window.SANDY_API_BASE_URL || "").replace(/\/$/, "");
    if (!apiBase) {
      status.textContent = "Backend URL is not configured. Existing local brief tools remain available.";
      return;
    }
    button.disabled = true;
    status.textContent = "Building Creator Pack 2.1 with local templates…";
    try {
      const response = await fetch(apiBase + "/api/free/creator-pack/v2", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          idea,
          mode: document.querySelector(".navbtn.active")?.dataset.kind || "content",
          platform: getValue("platform"),
          language: getValue("language"),
          tone: getValue("tone"),
          format: getValue("length"),
          sections: ["hook", "outline", "visuals", "cta", "seo"],
          style: getValue("creatorStyle") || "educational",
          duration: Number(getValue("creatorDuration") || 30)
        })
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Creator Pack 2.1 could not be created.");
      if (!data.pack || data.generatedBy !== "local-template-engine-v2" || data.providerCalled !== false || data.billingTriggered !== false) {
        throw new Error("The Creator Pack response did not pass its free-mode safety checks.");
      }
      output.textContent = data.pack;
      outputStatus.textContent = "Creator Pack 2.1 ready · Local templates · No AI inference or credits used";
      status.textContent = "✓ Pack ready. Review examples and verify factual claims before publishing.";
    } catch (error) {
      status.textContent = error instanceof Error ? error.message : "Creator Pack 2.1 failed.";
    } finally {
      button.disabled = false;
    }
  });
})();