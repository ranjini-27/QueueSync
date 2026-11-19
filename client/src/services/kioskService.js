import api from "./api.js";

// Smart Token Kiosk (Module 5). Both calls hit the existing public
// /api/queue/* surface — no auth header is attached (walk-in customers
// never log in at the kiosk), and no counterNumber is sent on token
// generation so the backend auto-routes to the least-busy counter that
// offers the chosen service.
export const kioskService = {
  listServices: () => api.get("/queue/services"),
  generateToken: (service) => api.post("/queue/tokens", { service }),
};
