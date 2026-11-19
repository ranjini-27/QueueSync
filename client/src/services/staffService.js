import api from "./api.js";

export const staffService = {
  dashboard: () => api.get("/staff/dashboard"),
  callNext: () => api.post("/staff/queue/call-next"),
  callSpecific: (tokenId) => api.post("/staff/queue/call-specific", { tokenId }),
  recall: () => api.post("/staff/queue/recall"),
  skip: () => api.post("/staff/queue/skip"),
  pause: () => api.post("/staff/queue/pause"),
  resume: () => api.post("/staff/queue/resume"),
  transfer: (tokenId, targetCounterNumber) =>
    api.post("/staff/queue/transfer", { tokenId, targetCounterNumber }),
};

// Used only for demoing/testing the queue before the Customer Portal /
// Kiosk modules ship — generates a token via the shared public endpoint.
export const devQueueService = {
  generateToken: (service, counterNumber) => api.post("/queue/tokens", { service, counterNumber }),
};