import { useEffect, useState, useCallback } from "react";
import { adminService } from "../services/authService.js";
import { useAuth } from "../context/AuthContext.jsx";
import "./AdminPendingStaff.css";

export default function AdminPendingStaff() {
  const { user, logout } = useAuth();
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actioningId, setActioningId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await adminService.pendingStaff();
      setStaff(data.staff);
    } catch (err) {
      setError(err.response?.data?.message || "Could not load pending staff.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleDecision(id, action) {
    setActioningId(id);
    try {
      if (action === "approve") await adminService.approveStaff(id);
      else await adminService.rejectStaff(id);
      setStaff((prev) => prev.filter((s) => s._id !== id));
    } catch (err) {
      setError(err.response?.data?.message || "Action failed. Please retry.");
    } finally {
      setActioningId(null);
    }
  }

  return (
    <div className="pending-page">
      <header className="pending-page__header">
        <div>
          <span className="pending-page__eyebrow">Admin Dashboard</span>
          <h1>Pending Staff Approvals</h1>
        </div>
        <div className="pending-page__account">
          <span>{user?.name}</span>
          <button onClick={logout}>Log out</button>
        </div>
      </header>

      {error && <div className="form-error-banner">{error}</div>}

      {loading ? (
        <p className="pending-page__empty">Loading…</p>
      ) : staff.length === 0 ? (
        <p className="pending-page__empty">No staff registrations are waiting for review.</p>
      ) : (
        <div className="pending-list">
          {staff.map((s) => (
            <div className="pending-card" key={s._id}>
              <div className="pending-card__info">
                <strong>{s.name}</strong>
                <span>Staff ID: {s.staffId}</span>
                <span>{s.email}</span>
                <span>Requested counter: {s.counterAssigned}</span>
              </div>
              <div className="pending-card__actions">
                <button
                  className="pending-card__approve"
                  disabled={actioningId === s._id}
                  onClick={() => handleDecision(s._id, "approve")}
                >
                  Approve
                </button>
                <button
                  className="pending-card__reject"
                  disabled={actioningId === s._id}
                  onClick={() => handleDecision(s._id, "reject")}
                >
                  Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
