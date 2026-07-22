export class NorthstarSDK {
  constructor({ toolId, version, onAudit = () => {}, onToast = () => {} }) {
    this.toolId = toolId;
    this.version = version;
    this.onAudit = onAudit;
    this.onToast = onToast;
    this.lastRecordId = null;

    window.addEventListener("message", (event) => this.handleMessage(event));
  }

  announceReady() {
    window.parent?.postMessage(
      {
        type: "QMSPILOT_MICROTOOL_READY",
        toolId: this.toolId,
        version: this.version
      },
      "*"
    );
  }

  handleMessage(event) {
    const message = event.data || {};

    if (message.type === "QMSPILOT_SUBMISSION_CONFIRMED") {
      this.lastRecordId = message.recordId;
      this.onAudit(`Northstar confirmed record ${message.recordId}`);
      this.onToast("Northstar confirmed submission.");
    }
  }

  accessToken() {
    try {
      for (let index = 0; index < window.localStorage.length; index += 1) {
        const key = window.localStorage.key(index) || "";
        if (!key.startsWith("sb-") || !key.endsWith("-auth-token")) continue;
        const value = JSON.parse(window.localStorage.getItem(key) || "{}");
        const token = value.access_token || value.currentSession?.access_token || value.session?.access_token;
        if (token) return token;
      }
    } catch {
      // A missing or stale browser session is handled by the receiving adapter.
    }
    return "";
  }

  async submit(payload, { mode, endpoint, enqueue }) {
    if (mode === "Northstar Host Bridge" && window.parent !== window) {
      window.parent.postMessage(
        {
          type: "QMSPILOT_SUBMIT_TO_NORTHSTAR",
          payload
        },
        "*"
      );

      this.onAudit("Submitted through Northstar host bridge");
      return null;
    }

    if (mode === "Direct API" && endpoint) {
      const token = this.accessToken();
      const headers = { "Content-Type": "application/json" };
      if (token) headers.Authorization = `Bearer ${token}`;
      const response = await fetch(endpoint, {
        method: "POST",
        headers,
        body: JSON.stringify(payload)
      });

      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || `API ${response.status}`);

      this.lastRecordId = result.recordId || result.id || `NS-${Date.now()}`;
      return this.lastRecordId;
    }

    const localQueueId = `NS-CAPA-${Date.now()}`;
    enqueue({ ...payload, localQueueId });
    this.lastRecordId = localQueueId;
    return localQueueId;
  }
}
