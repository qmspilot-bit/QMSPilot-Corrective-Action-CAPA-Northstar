function allowedNorthstarOrigin(origin) {
  try {
    const url = new URL(origin);
    const host = url.hostname.toLowerCase();
    if (url.protocol !== "https:" && host !== "localhost" && host !== "127.0.0.1") return false;
    return host === "qms-pilot-workforce.vercel.app"
      || host === "qms-pilot-workforce-qmsp-ilot.vercel.app"
      || /^qms-pilot-workforce-[a-z0-9-]+-qmsp-ilot\.vercel\.app$/.test(host)
      || host === "qms-pilot.com"
      || host.endsWith(".qms-pilot.com")
      || host === "localhost"
      || host === "127.0.0.1";
  } catch {
    return false;
  }
}

function parentOrigin() {
  if (window.parent === window || !document.referrer) return "";
  try {
    const origin = new URL(document.referrer).origin;
    return allowedNorthstarOrigin(origin) ? origin : "";
  } catch {
    return "";
  }
}

export class NorthstarSDK {
  constructor({ toolId, version, onAudit = () => {}, onToast = () => {}, onContext = () => {} }) {
    this.toolId = toolId;
    this.version = version;
    this.onAudit = onAudit;
    this.onToast = onToast;
    this.onContext = onContext;
    this.lastRecordId = null;
    this.hostOrigin = parentOrigin();
    this.pending = new Map();

    window.addEventListener("message", (event) => this.handleMessage(event));
  }

  announceReady() {
    if (!this.hostOrigin || window.parent === window) return;
    window.parent.postMessage(
      {
        type: "QMSPILOT_MICROTOOL_READY",
        toolId: this.toolId,
        version: this.version
      },
      this.hostOrigin
    );
  }

  handleMessage(event) {
    if (!this.hostOrigin || event.source !== window.parent || event.origin !== this.hostOrigin) return;
    const message = event.data || {};

    if (message.type === "QMSPILOT_CONTEXT" && message.context) {
      this.onContext(message.context);
      return;
    }

    if (message.type === "QMSPILOT_SUBMISSION_CONFIRMED") {
      const pending = this.pending.get(message.requestId);
      if (pending) {
        clearTimeout(pending.timer);
        this.pending.delete(message.requestId);
        const recordId = message.result?.recordId || message.recordId || null;
        this.lastRecordId = recordId;
        pending.resolve(recordId);
      }
      if (message.recordId || message.result?.recordId) {
        const recordId = message.result?.recordId || message.recordId;
        this.onAudit(`Northstar confirmed record ${recordId}`);
        this.onToast("Northstar confirmed submission.");
      }
      return;
    }

    if (message.type === "QMSPILOT_SUBMISSION_FAILED") {
      const pending = this.pending.get(message.requestId);
      if (!pending) return;
      clearTimeout(pending.timer);
      this.pending.delete(message.requestId);
      pending.reject(new Error(message.error || "Northstar rejected the submission."));
    }
  }

  async submit(payload, { mode, endpoint, enqueue }) {
    if (mode === "Northstar Host Bridge") {
      if (!this.hostOrigin || window.parent === window) {
        throw new Error("Northstar Host Bridge is only available inside an approved Northstar workspace.");
      }

      const requestId = crypto.randomUUID();
      const result = new Promise((resolve, reject) => {
        const timer = window.setTimeout(() => {
          this.pending.delete(requestId);
          reject(new Error("Northstar submission timed out."));
        }, 60000);
        this.pending.set(requestId, { resolve, reject, timer });
      });

      window.parent.postMessage(
        {
          type: "QMSPILOT_SUBMIT_TO_NORTHSTAR",
          requestId,
          toolId: this.toolId,
          payload
        },
        this.hostOrigin
      );

      this.onAudit("Submitted through secure Northstar host bridge");
      return result;
    }

    if (mode === "Direct API" && endpoint) {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const apiResult = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(apiResult.error || `API ${response.status}`);

      this.lastRecordId = apiResult.recordId || apiResult.id || `NS-${Date.now()}`;
      return this.lastRecordId;
    }

    const localQueueId = `NS-CAPA-${Date.now()}`;
    enqueue({ ...payload, localQueueId });
    this.lastRecordId = localQueueId;
    return localQueueId;
  }
}
