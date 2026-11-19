import api from "./api.js";

export const authService = {
  customerRegister: (payload) => api.post("/auth/customer/register", payload),
  customerLogin: (payload) => api.post("/auth/customer/login", payload),
  staffRegister: (payload) => api.post("/auth/staff/register", payload),
  staffLogin: (payload) => api.post("/auth/staff/login", payload),
  adminLogin: (payload) => api.post("/auth/admin/login", payload),
  me: () => api.get("/auth/me"),
};

export const queueService = {
  counters: () => api.get("/queue/counters"),
};

export const adminService = {
  pendingStaff: () => api.get("/admin/staff/pending"),
  approveStaff: (id) => api.patch(`/admin/staff/${id}/approve`),
  rejectStaff: (id) => api.patch(`/admin/staff/${id}/reject`),
};