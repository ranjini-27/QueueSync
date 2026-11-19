import api from "./api.js";

// Customer Dashboard — public branch overview (Module 2). No login
// required: one combined snapshot endpoint returns occupancy, the count
// of active counters, and every counter's current token / customers
// waiting / estimated wait, so the dashboard's initial load and every
// Socket.IO-triggered refresh stay a single request.
export const customerService = {
  dashboard: () => api.get("/queue/dashboard"),
};
