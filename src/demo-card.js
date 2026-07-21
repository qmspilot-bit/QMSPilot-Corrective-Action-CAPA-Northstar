const DEMO_EVENT = "QMSPILOT_CAPA_DEMO_LAUNCHED";

export function mountDemoCard({ onLaunch = () => {} } = {}) {
  if (document.getElementById("northstarDemoCard")) return;

  const card = document.createElement("aside");
  card.id = "northstarDemoCard";
  card.className = "demo-float";
  card.setAttribute("aria-label", "CAPA guided demonstration");
  card.innerHTML = `
    <button class="demo-close" type="button" aria-label="Close demo card">×</button>
    <div class="kicker">Future Northstar Demo</div>
    <h3>CAPA Production Application</h3>
    <p>
      Demonstrate how CAPA connects to Northstar, the AI workforce,
      shared records, evidence, accountability, and effectiveness verification.
    </p>
    <button class="btn primary demo-launch" type="button">Launch Guided Demo</button>
    <small>Roadmap: this floating card will become a Northstar Digital Toolbox tile.</small>
  `;

  card.querySelector(".demo-close").addEventListener("click", () => card.remove());
  card.querySelector(".demo-launch").addEventListener("click", () => {
    window.parent?.postMessage({ type: DEMO_EVENT, applicationId: "QMSP-CAPA-001" }, "*");
    onLaunch();
    card.remove();
  });

  document.body.appendChild(card);
}

export function getFutureTileDefinition() {
  return {
    applicationId: "QMSP-CAPA-001",
    title: "Corrective Action & CAPA",
    shortTitle: "CAPA",
    category: "Quality Execution",
    icon: "corrective-action",
    launchMode: "northstar-application",
    badgeSources: ["openActions", "overdueActions", "pendingApprovals"],
    workforce: ["Pilot", "Atlas", "Forge", "Sentinel", "Vector"]
  };
}
