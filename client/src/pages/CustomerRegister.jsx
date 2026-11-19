import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthLayout from "../components/AuthLayout.jsx";
import { authService } from "../services/authService.js";
import { useAuth } from "../context/AuthContext.jsx";
import "../styles/forms.css";

const INITIAL = { fullName: "", mobileNumber: "", email: "", password: "" };

export default function CustomerRegister() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState(INITIAL);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
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
      const { data } = await authService.customerRegister(form);
      login(data.token, data.user, data.role);
      navigate("/dashboard");
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
      eyebrow="Customer Access"
      title="Create your customer account."
      subtitle="One account gets you live occupancy, digital tokens, and queue tracking across every visit."
      footer={
        <>
          Already registered?{" "}
          <Link to="/login/customer" className="form-link">
            Sign in
          </Link>
        </>
      }
    >
      <form className="form" onSubmit={handleSubmit} noValidate>
        <h1>Customer Registration</h1>
        {error && <div className="form-error-banner">{error}</div>}

        <div className="field">
          <label htmlFor="fullName">Full Name</label>
          <input id="fullName" required value={form.fullName} onChange={update("fullName")} />
          {fieldErrors.fullName && <div className="field-error">{fieldErrors.fullName}</div>}
        </div>

        <div className="field">
          <label htmlFor="mobileNumber">Mobile Number</label>
          <input
            id="mobileNumber"
            type="tel"
            placeholder="e.g. 9876543210"
            required
            value={form.mobileNumber}
            onChange={update("mobileNumber")}
          />
          {fieldErrors.mobileNumber && <div className="field-error">{fieldErrors.mobileNumber}</div>}
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
          {loading ? "Creating account…" : "Create Account"}
        </button>
      </form>
    </AuthLayout>
  );
}
