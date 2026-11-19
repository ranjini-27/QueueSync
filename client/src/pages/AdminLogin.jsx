import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AuthLayout from "../components/AuthLayout.jsx";
import { authService } from "../services/authService.js";
import { useAuth } from "../context/AuthContext.jsx";
import "../styles/forms.css";

export default function AdminLogin() {
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
      const { data } = await authService.adminLogin(form);
      login(data.token, data.user, data.role);
      navigate("/admin/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout
      eyebrow="Admin Access"
      title="Branch administration."
      subtitle="Approve staff, manage counters, and oversee the queue system. Admin accounts are provisioned directly, not self-registered."
    >
      <form className="form" onSubmit={handleSubmit}>
        <h1>Admin Login</h1>
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
