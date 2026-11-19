import { useState } from "react";
import { Link } from "react-router-dom";
import AuthLayout from "../components/AuthLayout.jsx";
import { authService } from "../services/authService.js";
import "../styles/forms.css";

const INITIAL = { staffId: "", name: "", counterAssigned: "", email: "", password: "" };

export default function StaffRegister() {
  const [form, setForm] = useState(INITIAL);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  function update(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setFieldErrors({});
    setLoading(true);
    try {
      await authService.staffRegister(form);
      setSubmitted(true);
    } catch (err) {
      const res = err.response?.data;
      if (res?.errors) {
        const map = {};
        res.errors.forEach((e2) => (map[e2.field] = e2.message));
        setFieldErrors(map);
      }
      setError(res?.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout
      eyebrow="Staff Access"
      title="Join the counter roster."
      subtitle="Registrations are reviewed by a branch admin before login is enabled — this keeps counter access controlled."
      footer={
        <>
          Already approved?{" "}
          <Link to="/login/staff" className="form-link">
            Sign in
          </Link>
        </>
      }
    >
      {submitted ? (
        <div className="form">
          <h1>Registration Received</h1>
          <div className="form-success-banner">
            Thanks — your account is now pending review. An admin will approve it from the
            Admin Dashboard before you're able to log in.
          </div>
          <Link to="/login/staff" className="form-link">
            Back to staff login
          </Link>
        </div>
      ) : (
        <form className="form" onSubmit={handleSubmit} noValidate>
          <h1>Staff Registration</h1>
          {error && <div className="form-error-banner">{error}</div>}

          <div className="field">
            <label htmlFor="staffId">Staff ID</label>
            <input id="staffId" required value={form.staffId} onChange={update("staffId")} />
            {fieldErrors.staffId && <div className="field-error">{fieldErrors.staffId}</div>}
          </div>

          <div className="field">
            <label htmlFor="name">Name</label>
            <input id="name" required value={form.name} onChange={update("name")} />
            {fieldErrors.name && <div className="field-error">{fieldErrors.name}</div>}
          </div>

          <div className="field">
            <label htmlFor="counterAssigned">Counter Assigned</label>
            <input
              id="counterAssigned"
              placeholder="e.g. Counter 2"
              required
              value={form.counterAssigned}
              onChange={update("counterAssigned")}
            />
            {fieldErrors.counterAssigned && <div className="field-error">{fieldErrors.counterAssigned}</div>}
          </div>

          <div className="field">
            <label htmlFor="email">Email</label>
            <input id="email" type="email" required value={form.email} onChange={update("email")} />
            {fieldErrors.email && <div className="field-error">{fieldErrors.email}</div>}
          </div>

          <div className="field">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              minLength={8}
              required
              value={form.password}
              onChange={update("password")}
            />
            {fieldErrors.password && <div className="field-error">{fieldErrors.password}</div>}
          </div>

          <button className="form-submit" type="submit" disabled={loading}>
            {loading ? "Submitting…" : "Submit for Approval"}
          </button>
        </form>
      )}
    </AuthLayout>
  );
}
