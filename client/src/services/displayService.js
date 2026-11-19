import api from "./api.js";

// Central Queue Display (Module 6). Deliberately reuses the same public
// snapshot endpoint the Kiosk/Staff/Customer surfaces already read from —
// no dedicated backend route was needed for the TV page itself.
export const displayService = {
  counters: () => api.get("/queue/counters"),
};
