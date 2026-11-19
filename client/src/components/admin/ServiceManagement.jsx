import { useCallback, useEffect, useState } from "react";
import { serviceAdminService } from "../../services/adminPanelService.js";
import ServiceFormModal from "./ServiceFormModal.jsx";
import "./ServiceManagement.css";

export default function ServiceManagement() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [modalMode, setModalMode] = useState(null); // null | "add" | service object being edited
  const [confirmDelete, setConfirmDelete] = useState(null);

  const load = useCallback(async () => {
    setError("");
    try {
      const { data } = await serviceAdminService.list();
      setServices(data.services);
    } catch (err) {
      setError(err.response?.data?.message || "Could not load services.");
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

  async function handleFormSubmit(payload) {
    if (modalMode === "add") {
      await serviceAdminService.create(payload);
    } else {
      await serviceAdminService.update(modalMode._id, payload);
    }
    setModalMode(null);
    await load();
  }

  function handleDelete(service) {
    withBusy(async () => {
      await serviceAdminService.remove(service._id);
      setConfirmDelete(null);
    });
  }

  return (
    <section className="service-mgmt">
      <div className="service-mgmt__header">
        <h2>Service Management</h2>
        <button className="admin-btn admin-btn--primary" onClick={() => setModalMode("add")}>
          + Add Service
        </button>
      </div>

      {error && <div className="form-error-banner">{error}</div>}

      {loading ? (
        <p className="staff-mgmt__empty">Loading…</p>
      ) : services.length === 0 ? (
        <p className="staff-mgmt__empty">No services yet.</p>
      ) : (
        <div className="service-list">
          {services.map((s) => (
            <div className="service-row" key={s._id}>
              <div className="service-row__info">
                <strong>{s.name}</strong>
                {s.description && <span>{s.description}</span>}
              </div>

              {confirmDelete === s._id ? (
                <div className="service-row__confirm">
                  <span>Delete this service?</span>
                  <button className="admin-link admin-link--danger" disabled={busy} onClick={() => handleDelete(s)}>
                    Yes, delete
                  </button>
                  <button className="admin-link" onClick={() => setConfirmDelete(null)}>
                    Cancel
                  </button>
                </div>
              ) : (
                <div className="service-row__actions">
                  <button className="admin-link" onClick={() => setModalMode(s)}>
                    Edit
                  </button>
                  <button className="admin-link admin-link--danger" onClick={() => setConfirmDelete(s._id)}>
                    Delete
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {modalMode && (
        <ServiceFormModal
          service={modalMode === "add" ? null : modalMode}
          busy={busy}
          onClose={() => setModalMode(null)}
          onSubmit={handleFormSubmit}
        />
      )}
    </section>
  );
}
