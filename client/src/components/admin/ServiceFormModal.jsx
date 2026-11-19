import { useState } from "react";
import Modal from "../staff/Modal.jsx";
import "../../styles/forms.css";

export default function ServiceFormModal({ service, busy, onClose, onSubmit }) {
  const isEdit = Boolean(service);
  const [form, setForm] = useState({
    name: service?.name || "",
    description: service?.description || "",
  });
  const [error, setError] = useState("");

  function update(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    try {
      await onSubmit(form);
    } catch (err) {
      setError(err.response?.data?.message || "Could not save service.");
    }
  }

  return (
    <Modal title={isEdit ? "Edit Service" : "Add Service"} onClose={onClose}>
      <form className="form" onSubmit={handleSubmit}>
        {error && <div className="form-error-banner">{error}</div>}

        <div className="field">
          <label htmlFor="name">Service Name</label>
          <input id="name" required value={form.name} onChange={update("name")} placeholder="e.g. Cash Deposit" />
        </div>

        <div className="field">
          <label htmlFor="description">Description (optional)</label>
          <input id="description" value={form.description} onChange={update("description")} />
        </div>

        <div className="modal-actions">
          <button type="button" className="modal-btn modal-btn--ghost" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="modal-btn modal-btn--primary" disabled={busy}>
            {isEdit ? "Save Changes" : "Add Service"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
