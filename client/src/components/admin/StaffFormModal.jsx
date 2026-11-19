import { useState } from "react";
import Modal from "../staff/Modal.jsx";
import "../../styles/forms.css";

/**
 * Shared add/edit form. In "edit" mode staffId/password are fixed at
 * registration time and not editable here — only name, email, and counter
 * assignment can change (counter reassignment also has its own quick
 * action in the staff list, this covers editing it inline too).
 */
export default function StaffFormModal({ staff, counters, busy, onClose, onSubmit }) {
  const isEdit = Boolean(staff);
  const [form, setForm] = useState({
    staffId: staff?.staffId || "",
    name: staff?.name || "",
    email: staff?.email || "",
    counterAssigned: staff?.counterAssigned || counters?.[0]?.name || "",
    password: "",
  });
  const [error, setError] = useState("");

  function update(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    try {
      if (isEdit) {
        await onSubmit({ name: form.name, email: form.email, counterAssigned: form.counterAssigned });
      } else {
        await onSubmit(form);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Could not save staff account.");
    }
  }

  return (
    <Modal title={isEdit ? "Edit Staff" : "Add Staff"} onClose={onClose}>
      <form className="form" onSubmit={handleSubmit}>
        {error && <div className="form-error-banner">{error}</div>}

        {!isEdit && (
          <div className="field">
            <label htmlFor="staffId">Staff ID</label>
            <input id="staffId" required value={form.staffId} onChange={update("staffId")} />
          </div>
        )}

        <div className="field">
          <label htmlFor="name">Name</label>
          <input id="name" required value={form.name} onChange={update("name")} />
        </div>

        <div className="field">
          <label htmlFor="email">Email</label>
          <input id="email" type="email" required value={form.email} onChange={update("email")} />
        </div>

        <div className="field">
          <label htmlFor="counterAssigned">Counter</label>
          <select id="counterAssigned" required value={form.counterAssigned} onChange={update("counterAssigned")}>
            {(counters || []).map((c) => (
              <option key={c._id} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {!isEdit && (
          <div className="field">
            <label htmlFor="password">Temporary Password</label>
            <input id="password" type="password" required minLength={8} value={form.password} onChange={update("password")} />
          </div>
        )}

        <div className="modal-actions">
          <button type="button" className="modal-btn modal-btn--ghost" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="modal-btn modal-btn--primary" disabled={busy}>
            {isEdit ? "Save Changes" : "Add Staff"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
