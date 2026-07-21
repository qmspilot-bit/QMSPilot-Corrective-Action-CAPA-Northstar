import { storage } from "./storage.js";
import { calculateReadiness, validateCapa } from "./validation.js";
import { NorthstarSDK } from "./northstar-sdk.js";
import { updateDashboard } from "./dashboard.js";
import { mountDemoCard } from "./demo-card.js";

const TOOL_ID = "QMSP-CAPA-001";
const VERSION = "1.1.0";
let filesMeta = [];
let audit = [];
let lastRecordId = null;
let northstar;

const form = document.getElementById("capaForm");

function init() {
  const today = new Date().toISOString().slice(0, 10);
  if (!form.elements.dateOpened.value) form.elements.dateOpened.value = today;

  addActionRow("correctiveTable");
  addActionRow("correctiveTable");
  addActionRow("preventiveTable");

  form.addEventListener("input", () => {
    recalc();
    document.getElementById("draftPill").textContent = "Unsaved changes";
  });

  document.querySelectorAll(".navbtn").forEach((button) => {
    button.onclick = () => document.getElementById(button.dataset.target).scrollIntoView({ behavior: "smooth" });
  });

  northstar = new NorthstarSDK({
    toolId: TOOL_ID,
    version: VERSION,
    onAudit: addAudit,
    onToast: toast
  });

  northstar.announceReady();
  mountDemoCard({ onLaunch: launchGuidedDemo });
  recalc();
  addAudit("Application initialized with Northstar production modules");
}

function addActionRow(tableId, data = {}) {
  const preventive = tableId === "preventiveTable";
  const row = document.createElement("tr");

  row.innerHTML = `<td><textarea data-col="action" placeholder="${preventive ? "Systemic preventive action" : "Specific corrective action"}">${esc(data.action || "")}</textarea></td>
  <td><input data-col="owner" value="${esc(data.owner || "")}"></td>
  <td><input data-col="dueDate" type="date" value="${esc(data.dueDate || "")}"></td>
  <td>${preventive ? `<input data-col="scope" value="${esc(data.scope || "")}">` : `<select data-col="priority"><option>Low</option><option ${data.priority === "Medium" ? "selected" : ""}>Medium</option><option ${data.priority === "High" ? "selected" : ""}>High</option><option ${data.priority === "Critical" ? "selected" : ""}>Critical</option></select>`}</td>
  <td><select data-col="status"><option>Not Started</option><option ${data.status === "In Progress" ? "selected" : ""}>In Progress</option><option ${data.status === "Complete" ? "selected" : ""}>Complete</option><option ${data.status === "Blocked" ? "selected" : ""}>Blocked</option></select></td>
  <td><textarea data-col="evidence">${esc(data.evidence || "")}</textarea></td>
  <td><button type="button" class="btn danger" data-remove-action>×</button></td>`;

  row.querySelector("[data-remove-action]").addEventListener("click", () => {
    row.remove();
    recalc();
  });

  document.querySelector(`#${tableId} tbody`).appendChild(row);
  row.querySelectorAll("input,select,textarea").forEach((element) => element.addEventListener("input", recalc));
}

function tableData(id) {
  return [...document.querySelectorAll(`#${id} tbody tr`)]
    .map((row) => {
      const item = {};
      row.querySelectorAll("[data-col]").forEach((element) => {
        item[element.dataset.col] = element.value;
      });
      return item;
    })
    .filter((item) => Object.values(item).some((value) => value));
}

function getFormData() {
  const data = {};
  new FormData(form).forEach((value, key) => {
    data[key] = value;
  });

  data.correctiveActions = tableData("correctiveTable");
  data.preventiveActions = tableData("preventiveTable");
  data.attachments = filesMeta;
  data.auditTrail = audit;
  data.toolId = TOOL_ID;
  data.version = VERSION;
  data.readinessScore = calculateScore();
  data.lastRecordId = lastRecordId;
  data.aiRouting = {
    Pilot: "orchestrate",
    Atlas: "task_and_due_date_tracking",
    Forge: "quality_and_rca_review",
    Sentinel: "compliance_and_evidence_review",
    Vector: "systemic_improvement_review"
  };
  data.submissionTimestamp = new Date().toISOString();
  return data;
}

function calculateScore() {
  return calculateReadiness(form, tableData("correctiveTable"), tableData("preventiveTable"));
}

function recalc() {
  const score = calculateScore();
  document.getElementById("progressBar").style.width = `${score}%`;
  document.getElementById("progressText").textContent = `${score}%`;
  document.getElementById("scoreCircle").textContent = `${score}%`;
  document.getElementById("scoreCircle").style.background = `conic-gradient(${score >= 80 ? "var(--good)" : score >= 50 ? "var(--warn)" : "var(--bad)"} ${score * 3.6}deg,#17304a 0deg)`;
  document.getElementById("scoreLabel").textContent = score >= 90 ? "Ready for controlled submission" : score >= 70 ? "Nearly ready" : score >= 40 ? "Record developing" : "Record incomplete";
  document.getElementById("scoreDetail").textContent = score >= 90 ? "Run final validation before submission." : "Complete objective evidence, owners, due dates and verification.";

  const costs = ["scrapCost", "reworkCost", "laborCost", "customerCost", "otherCost"].reduce(
    (sum, name) => sum + (parseFloat(form.elements[name].value) || 0),
    0
  );

  form.elements.totalCost.value = costs.toFixed(2);

  updateDashboard({
    score,
    correctiveActions: tableData("correctiveTable"),
    preventiveActions: tableData("preventiveTable"),
    totalCost: costs,
    form
  });
}

function validateRecord(show = true) {
  const errors = validateCapa(form, tableData("correctiveTable"));
  if (show) toast(errors.length ? `Validation: ${errors.length} item(s) need attention.` : "Validation passed.");
  return errors;
}

function saveDraft() {
  storage.saveDraft(getFormData());
  document.getElementById("draftPill").textContent = `Draft saved ${new Date().toLocaleTimeString()}`;
  addAudit("Draft saved locally");
  toast("Draft saved.");
}

function loadDraft() {
  const draft = storage.loadDraft();
  if (!draft) return toast("No saved draft found.");
  hydrate(draft);
  addAudit("Draft loaded");
  toast("Draft loaded.");
}

function hydrate(data) {
  Object.entries(data).forEach(([key, value]) => {
    if (form.elements[key] && typeof value !== "object") form.elements[key].value = value ?? "";
  });

  filesMeta = data.attachments || [];
  audit = data.auditTrail || [];
  lastRecordId = data.lastRecordId || null;

  document.querySelector("#correctiveTable tbody").innerHTML = "";
  (data.correctiveActions || []).forEach((item) => addActionRow("correctiveTable", item));
  if (!(data.correctiveActions || []).length) addActionRow("correctiveTable");

  document.querySelector("#preventiveTable tbody").innerHTML = "";
  (data.preventiveActions || []).forEach((item) => addActionRow("preventiveTable", item));
  if (!(data.preventiveActions || []).length) addActionRow("preventiveTable");

  renderFiles();
  renderAudit();
  recalc();
}

function captureFiles(event) {
  filesMeta = [...event.target.files].map((file) => ({
    name: file.name,
    size: file.size,
    type: file.type,
    lastModified: file.lastModified
  }));
  renderFiles();
  addAudit(`${filesMeta.length} evidence file(s) selected`);
  recalc();
}

function renderFiles() {
  document.getElementById("fileCount").textContent = `${filesMeta.length} files`;
  document.getElementById("fileList").innerHTML = filesMeta.length
    ? filesMeta.map((file) => `<div>• ${esc(file.name)} · ${(file.size / 1024).toFixed(1)} KB · ${esc(file.type || "file")}</div>`).join("")
    : "No files selected.";
}

function exportJSON() {
  const blob = new Blob([JSON.stringify(getFormData(), null, 2)], { type: "application/json" });
  download(blob, `${form.elements.capaNumber.value || "CAPA"}-northstar.json`);
  addAudit("JSON exported");
}

function importJSON(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      hydrate(JSON.parse(reader.result));
      toast("JSON imported.");
      addAudit("JSON imported");
    } catch {
      toast("Invalid JSON file.");
    }
  };
  reader.readAsText(file);
}

function emailSummary() {
  const data = getFormData();
  const subject = encodeURIComponent(`${data.capaNumber || "CAPA"} - ${data.problemStatement?.slice(0, 60) || "Corrective Action"}`);
  const body = encodeURIComponent(`QMSPilot CAPA Summary\n\nCAPA: ${data.capaNumber}\nSite: ${data.site}\nOwner: ${data.owner}\nStatus: ${data.finalStatus}\nProblem: ${data.problemStatement}\nRoot Cause: ${data.rootCause}\nTotal COPQ: $${data.totalCost}\nReadiness: ${data.readinessScore}%\n\nGenerated by QMSPilot Northstar.`);
  location.href = `mailto:?subject=${subject}&body=${body}`;
}

function previewPayload() {
  const preview = document.getElementById("payloadPreview");
  preview.textContent = JSON.stringify(buildPayload(), null, 2);
  preview.classList.toggle("hidden");
}

function buildPayload() {
  const record = getFormData();
  return {
    schema: "qmspilot.northstar.capa.v1",
    event: "CAPA_SUBMITTED",
    record,
    workflow: {
      systemOfRecord: "Northstar",
      status: record.finalStatus,
      routeTo: ["Pilot", "Atlas", "Forge", "Sentinel", "Vector"]
    },
    security: {
      tenantId: record.tenantId || null,
      submittedBy: record.submittedBy || null
    },
    client: {
      toolId: TOOL_ID,
      version: VERSION,
      offlineCapable: true
    }
  };
}

async function submitToNorthstar() {
  const errors = validateRecord(true);
  if (errors.length) {
    addAudit("Submission blocked by validation");
    return;
  }

  const payload = buildPayload();
  const mode = form.elements.integrationMode.value;
  const endpoint = form.elements.apiEndpoint.value.trim();

  try {
    const recordId = await northstar.submit(payload, {
      mode,
      endpoint,
      enqueue: (item) => storage.enqueue(item)
    });

    lastRecordId = recordId || northstar.lastRecordId;
    addAudit(recordId ? `Northstar submission accepted: ${recordId}` : "Submission sent through Northstar host bridge");
    toast(recordId ? `Submitted. Record ID: ${recordId}` : "Submission sent to Northstar host.");
    saveDraft();
    document.getElementById("connectionPill").textContent = lastRecordId ? `Northstar Record: ${lastRecordId}` : "Awaiting Northstar confirmation";
  } catch (error) {
    addAudit(`Submission error: ${error.message}`);
    toast(`Submission failed: ${error.message}`);
  }
}

function handleHostMessage(event) {
  const message = event.data || {};
  if (message.type === "QMSPILOT_CONTEXT") {
    if (message.tenantId) form.elements.tenantId.value = message.tenantId;
    if (message.user?.name) form.elements.submittedBy.value = message.user.name;
    if (message.site) form.elements.site.value = message.site;
    document.getElementById("connectionPill").textContent = "Connected to Northstar";
    addAudit("Northstar context received");
    recalc();
  }

  if (message.type === "QMSPILOT_SUBMISSION_CONFIRMED") {
    lastRecordId = message.recordId;
    document.getElementById("connectionPill").textContent = `Northstar Record: ${message.recordId}`;
  }
}

function addAudit(action) {
  audit.unshift({ timestamp: new Date().toISOString(), action });
  audit = audit.slice(0, 50);
  renderAudit();
}

function renderAudit() {
  document.getElementById("auditTrail").innerHTML = audit.length
    ? audit.map((item) => `<div style="margin-bottom:8px"><strong>${new Date(item.timestamp).toLocaleString()}</strong><br>${esc(item.action)}</div>`).join("")
    : "No activity recorded.";
}

function download(blob, name) {
  const anchor = document.createElement("a");
  anchor.href = URL.createObjectURL(blob);
  anchor.download = name;
  anchor.click();
  URL.revokeObjectURL(anchor.href);
}

function toast(message) {
  const element = document.getElementById("toast");
  element.textContent = message;
  element.classList.add("show");
  setTimeout(() => element.classList.remove("show"), 3200);
}

function launchGuidedDemo() {
  document.getElementById("overview").scrollIntoView({ behavior: "smooth" });
  toast("Guided demo launched. Start with CAPA intake, then follow each numbered stage.");
  addAudit("Guided demonstration launched");
}

function esc(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[character]);
}

window.addEventListener("message", handleHostMessage);
Object.assign(window, {
  addActionRow,
  saveDraft,
  loadDraft,
  exportJSON,
  importJSON,
  emailSummary,
  previewPayload,
  submitToNorthstar,
  validateRecord,
  captureFiles,
  recalc
});

init();