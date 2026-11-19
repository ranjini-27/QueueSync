import api from "./api.js";

// Full Admin Dashboard (Module 4) API surface. Kept separate from the
// `adminService` object in authService.js, which only covers the original
// staff registration approval flow (pending/approve/reject) and stays
// untouched so that existing page keeps working as-is.

export const dashboardService = {
  stats: () => api.get("/admin/dashboard/stats"),
};

export const staffAdminService = {
  list: () => api.get("/admin/staff"),
  create: (payload) => api.post("/admin/staff", payload),
  update: (id, payload) => api.patch(`/admin/staff/${id}`, payload),
  setStatus: (id, isActive) => api.patch(`/admin/staff/${id}/status`, { isActive }),
  assignCounter: (id, counterId) => api.patch(`/admin/staff/${id}/assign-counter`, { counterId }),
};

export const counterAdminService = {
  list: () => api.get("/admin/counters"),
  create: (payload) => api.post("/admin/counters", payload),
  update: (id, payload) => api.patch(`/admin/counters/${id}`, payload),
  toggle: (id, isActive) => api.patch(`/admin/counters/${id}/toggle`, { isActive }),
};

export const serviceAdminService = {
  list: () => api.get("/admin/services"),
  create: (payload) => api.post("/admin/services", payload),
  update: (id, payload) => api.patch(`/admin/services/${id}`, payload),
  remove: (id) => api.delete(`/admin/services/${id}`),
};

export const queueAdminService = {
  resetToday: () => api.post("/admin/queue/reset"),
};

// Reports are file downloads, not JSON — fetched with axios' blob
// responseType and triggered as a browser download client-side.
export const reportAdminService = {
  async downloadToday(format) {
    const { data } = await api.get(`/admin/reports/today`, {
      params: { format },
      responseType: "blob",
    });
    const extension = format === "excel" ? "xlsx" : "pdf";
    const url = window.URL.createObjectURL(new Blob([data]));
    const link = document.createElement("a");
    link.href = url;
    link.download = `queue-report-${new Date().toISOString().slice(0, 10)}.${extension}`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },
};
