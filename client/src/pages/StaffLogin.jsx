import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthLayout from "../components/AuthLayout.jsx";
import { authService } from "../services/authService.js";
import { useAuth } from "../context/AuthContext.jsx";
import "../styles/forms.css";

export default function StaffLogin() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function update(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { data } = await authService.staffLogin(form);
      login(data.token, data.user, data.role);
      navigate("/staff/dashboard"); // Staff Dashboard module
    } catch (err) {
      setError(err.response?.data?.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout
      eyebrow="Staff Access"
      title="Your counter, your queue."
      subtitle="Call, recall, skip, and pause tokens for your assigned counter in real time."
      footer={
        <>
          Not registered yet?{" "}
          <Link to="/register/staff" className="form-link">
            Register as staff
          </Link>
        </>
      }
    >
      <form className="form" onSubmit={handleSubmit}>
        <h1>Staff Login</h1>
        {error && <div className="form-error-banner">{error}</div>}

        <div className="field">
          <label htmlFor="email">Email</label>
          <input id="email" type="email" required value={form.email} onChange={update("email")} />
        </div>
        <div className="field">
          <label htmlFor="password">Password</label>
          <input id="password" type="password" required value={form.password} onChange={update("password")} />
        </div>

        <button className="form-submit" type="submit" disabled={loading}>
          {loading ? "Signing in…" : "Sign In"}
        </button>
      </form>
    </AuthLayout>
  );
}
