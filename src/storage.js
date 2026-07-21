const DRAFT_KEY = "qmspilot-capa-draft";
const QUEUE_KEY = "qmspilot-northstar-queue";

export const storage = {
  saveDraft(data) {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(data));
  },

  loadDraft() {
    const raw = localStorage.getItem(DRAFT_KEY);
    return raw ? JSON.parse(raw) : null;
  },

  enqueue(payload) {
    const queue = JSON.parse(localStorage.getItem(QUEUE_KEY) || "[]");
    queue.push(payload);
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
    return payload.localQueueId;
  },

  getQueue() {
    return JSON.parse(localStorage.getItem(QUEUE_KEY) || "[]");
  }
};
