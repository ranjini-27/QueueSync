import { useCallback, useEffect, useState } from "react";
import { staffAdminService, counterAdminService } from "../../services/adminPanelService.js";
import { adminService as approvalService } from "../../services/authService.js";
import StaffFormModal from "./StaffFormModal.jsx";
import "./StaffManagement.css";

const STATUS_LABEL = { pending: "Pending", approved: "Approved", rejected: "Rejected" };

export default function StaffManagement() {
  const [staff, setStaff] = useState([]);
  const [counters, setCounters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [modalMode, setModalMode] = useState(null); // null | "add" | staff object being edited

  const load = useCallback(async () => {
    setError("");
    try {
      const [staffRes, countersRes] = await Promise.all([staffAdminService.list(), counterAdminService.list()]);
      setStaff(staffRes.data.staff);
      setCounters(countersRes.data.counters);
    } catch (err) {
      setError(err.response?.data?.message || "Could not load staff.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function withBusy(fn) {
    setBusy(true);
    setError("");
    try {
      await fn();
      await load();
    } catch (err) {
      setError(err.response?.data?.message || "Action failed. Please retry.");
    } finally {
      setBusy(false);
    }
  }

  const handleApprove = (id) => withBusy(() => approvalService.approveStaff(id));
  const handleReject = (id) => withBusy(() => approvalService.rejectStaff(id));
  const handleToggleActive = (s) => withBusy(() => staffAdminService.setStatus(s._id, !s.isActive));
  const handleAssignCounter = (s, counterId) => withBusy(() => staffAdminService.assignCounter(s._id, counterId));

  async function handleFormSubmit(payload) {
    if (modalMode === "add") {
      await staffAdminService.create(payload);
    } else {
      await staffAdminService.update(modalMode._id, payload);
    }
    setModalMode(null);
    await load();
  }

  return (
    <section className="staff-mgmt">
      <div className="staff-mgmt__header">
        <h2>Staff Management</h2>
        <button className="admin-btn admin-btn--primary" onClick={() => setModalMode("add")} disabled={!counters.length}>
          + Add Staff
        </button>
      </div>

      {error && <div className="form-error-banner">{error}</div>}
      {!counters.length && !loading && (
        <p className="staff-mgmt__hint">Add a counter first so staff can be assigned to one.</p>
      )}

      {loading ? (
        <p className="staff-mgmt__empty">Loading…</p>
      ) : staff.length === 0 ? (
        <p className="staff-mgmt__empty">No staff accounts yet.</p>
      ) : (
        <div className="staff-table">
          <div className="staff-table__row staff-table__row--head">
            <span>Name</span>
            <span>Staff ID</span>
            <span>Counter</span>
            <span>Status</span>
            <span>Active</span>
            <span></span>
          </div>
          {staff.map((s) => (
            <div className="staff-table__row" key={s._id}>
              <span className="staff-table__name">
                {s.name}
                <small>{s.email}</small>
              </span>
              <span>{s.staffId}</span>
              <span>
                <select
                  value={s.counterAssigned}
                  disabled={busy}
                  onChange={(e) => {
                    const target = counters.find((c) => c.name === e.target.value);
                    if (target) handleAssignCounter(s, target._id);
                  }}
                >
                  {counters.map((c) => (
                    <option key={c._id} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                  {!counters.some((c) => c.name === s.counterAssigned) && (
                    <option value={s.counterAssigned}>{s.counterAssigned}</option>
                  )}
                </select>
              </span>
              <span>
                <span className={`staff-badge staff-badge--${s.approvalStatus}`}>
                  {STATUS_LABEL[s.approvalStatus]}
                </span>
              </span>
              <span>
                <label className="staff-toggle">
                  <input
                    type="checkbox"
                    checked={s.isActive}
                    disabled={busy}
                    onChange={() => handleToggleActive(s)}
                  />
                  {s.isActive ? "Active" : "Inactive"}
                </label>
              </span>
              <span className="staff-table__actions">
                {s.approvalStatus === "pending" ? (
                  <>
                    <button className="admin-link admin-link--success" disabled={busy} onClick={() => handleApprove(s._id)}>
                      Approve
                    </button>
                    <button className="admin-link admin-link--danger" disabled={busy} onClick={() => handleReject(s._id)}>
                      Reject
                    </button>
                  </>
                ) : (
                  <button className="admin-link" onClick={() => setModalMode(s)}>
                    Edit
                  </button>
                )}
              </span>
            </div>
          ))}
        </div>
      )}

      {modalMode && (
        <StaffFormModal
          staff={modalMode === "add" ? null : modalMode}
          counters={counters}
          busy={busy}
          onClose={() => setModalMode(null)}
          onSubmit={handleFormSubmit}
        />
      )}
    </section>
  );
}
