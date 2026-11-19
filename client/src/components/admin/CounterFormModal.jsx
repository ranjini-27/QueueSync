import { useState } from "react";
import Modal from "../staff/Modal.jsx";
import "../../styles/forms.css";

export default function CounterFormModal({ counter, services, busy, onClose, onSubmit }) {
  const isEdit = Boolean(counter);
  const [form, setForm] = useState({
    name: counter?.name || "",
    counterNumber: counter?.counterNumber || "",
    tokenPrefix: counter?.tokenPrefix || "",
    servicesOffered: counter?.servicesOffered || [],
  });
  const [error, setError] = useState("");

  function update(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  function toggleService(name) {
    setForm((f) => ({
      ...f,
      servicesOffered: f.servicesOffered.includes(name)
        ? f.servicesOffered.filter((s) => s !== name)
        : [...f.servicesOffered, name],
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    try {
      if (isEdit) {
        await onSubmit({ name: form.name, servicesOffered: form.servicesOffered });
      } else {
        await onSubmit({
          name: form.name,
          counterNumber: Number(form.counterNumber),
          tokenPrefix: form.tokenPrefix,
          servicesOffered: form.servicesOffered,
        });
      }
    } catch (err) {
      setError(err.response?.data?.message || "Could not save counter.");
    }
  }

  return (
    <Modal title={isEdit ? "Edit Counter" : "Add Counter"} onClose={onClose}>
      <form className="form" onSubmit={handleSubmit}>
        {error && <div className="form-error-banner">{error}</div>}

        <div className="field">
          <label htmlFor="name">Counter Name</label>
          <input id="name" required value={form.name} onChange={update("name")} />
        </div>

        {!isEdit && (
          <>
            <div className="field">
              <label htmlFor="counterNumber">Counter Number</label>
              <input
                id="counterNumber"
                type="number"
                min="1"
                required
                value={form.counterNumber}
                onChange={update("counterNumber")}
              />
            </div>
            <div className="field">
              <label htmlFor="tokenPrefix">Token Prefix (e.g. A)</label>
              <input
                id="tokenPrefix"
                required
                maxLength={3}
                value={form.tokenPrefix}
                onChange={(e) => setForm((f) => ({ ...f, tokenPrefix: e.target.value.toUpperCase() }))}
              />
            </div>
          </>
        )}

        <div className="field">
          <label>Services Offered</label>
          <div className="counter-service-picker">
            {(services || []).map((s) => (
              <label key={s._id} className="counter-service-picker__item">
                <input
                  type="checkbox"
                  checked={form.servicesOffered.includes(s.name)}
                  onChange={() => toggleService(s.name)}
                />
                {s.name}
              </label>
            ))}
            {!services?.length && <p className="staff-mgmt__hint">Add a service first.</p>}
          </div>
        </div>

        <div className="modal-actions">
          <button type="button" className="modal-btn modal-btn--ghost" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="modal-btn modal-btn--primary" disabled={busy}>
            {isEdit ? "Save Changes" : "Add Counter"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
