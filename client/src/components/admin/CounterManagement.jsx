import { useCallback, useEffect, useState } from "react";
import { counterAdminService, serviceAdminService } from "../../services/adminPanelService.js";
import CounterFormModal from "./CounterFormModal.jsx";
import "./CounterManagement.css";

const STATUS_LABEL = { offline: "Offline", active: "Active", paused: "Paused" };

export default function CounterManagement() {
  const [counters, setCounters] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [modalMode, setModalMode] = useState(null); // null | "add" | counter object being edited

  const load = useCallback(async () => {
    setError("");
    try {
      const [countersRes, servicesRes] = await Promise.all([counterAdminService.list(), serviceAdminService.list()]);
      setCounters(countersRes.data.counters);
      setServices(servicesRes.data.services.filter((s) => s.isActive));
    } catch (err) {
      setError(err.response?.data?.message || "Could not load counters.");
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

  const handleToggle = (c) => withBusy(() => counterAdminService.toggle(c._id, !c.isActive));

  async function handleFormSubmit(payload) {
    if (modalMode === "add") {
      await counterAdminService.create(payload);
    } else {
      await counterAdminService.update(modalMode._id, payload);
    }
    setModalMode(null);
    await load();
  }

  return (
    <section className="counter-mgmt">
      <div className="counter-mgmt__header">
        <h2>Counter Management</h2>
        <button className="admin-btn admin-btn--primary" onClick={() => setModalMode("add")}>
          + Add Counter
        </button>
      </div>

      {error && <div className="form-error-banner">{error}</div>}

      {loading ? (
        <p className="staff-mgmt__empty">Loading…</p>
      ) : counters.length === 0 ? (
        <p className="staff-mgmt__empty">No counters yet.</p>
      ) : (
        <div className="counter-grid">
          {counters.map((c) => (
            <div className="counter-card" key={c._id}>
              <div className="counter-card__top">
                <div>
                  <strong>{c.name}</strong>
                  <span className="counter-card__prefix">Token prefix: {c.tokenPrefix}</span>
                </div>
                <span className={`counter-card__status counter-card__status--${c.status}`}>
                  {STATUS_LABEL[c.status]}
                </span>
              </div>

              <div className="counter-card__services">
                {c.servicesOffered?.length ? (
                  c.servicesOffered.map((s) => (
                    <span className="counter-card__service" key={s}>
                      {s}
                    </span>
                  ))
                ) : (
                  <span className="counter-card__service counter-card__service--empty">No services assigned</span>
                )}
              </div>

              <div className="counter-card__staff">
                {c.staffOnDuty ? `On duty: ${c.staffOnDuty.name}` : "No staff on duty"}
              </div>

              <div className="counter-card__actions">
                <button className="admin-link" onClick={() => setModalMode(c)}>
                  Edit
                </button>
                <label className="staff-toggle">
                  <input type="checkbox" checked={c.isActive} disabled={busy} onChange={() => handleToggle(c)} />
                  {c.isActive ? "Enabled" : "Disabled"}
                </label>
              </div>
            </div>
          ))}
        </div>
      )}

      {modalMode && (
        <CounterFormModal
          counter={modalMode === "add" ? null : modalMode}
          services={services}
          busy={busy}
          onClose={() => setModalMode(null)}
          onSubmit={handleFormSubmit}
        />
      )}
    </section>
  );
}
