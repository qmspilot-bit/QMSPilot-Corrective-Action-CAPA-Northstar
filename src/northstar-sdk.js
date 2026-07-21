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
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!response.ok) throw new Error(`API ${response.status}`);

      const result = await response.json().catch(() => ({}));
      this.lastRecordId = result.recordId || result.id || `NS-${Date.now()}`;
      return this.lastRecordId;
    }

    const localQueueId = `NS-CAPA-${Date.now()}`;
    enqueue({ ...payload, localQueueId });
    this.lastRecordId = localQueueId;
    return localQueueId;
  }
}
