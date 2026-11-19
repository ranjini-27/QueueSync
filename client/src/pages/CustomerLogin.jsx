import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthLayout from "../components/AuthLayout.jsx";
import { authService } from "../services/authService.js";
import { useAuth } from "../context/AuthContext.jsx";
import "../styles/forms.css";

export default function CustomerLogin() {
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
      const { data } = await authService.customerLogin(form);
      login(data.token, data.user, data.role);
      navigate("/dashboard"); // Customer Dashboard module
    } catch (err) {
      setError(err.response?.data?.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout
      eyebrow="Customer Access"
      title="Skip the line, not the service."
      subtitle="Check live occupancy, take a token, and track your place in the queue from anywhere nearby."
      footer={
        <>
          New here?{" "}
          <Link to="/register/customer" className="form-link">
            Create a customer account
          </Link>
        </>
      }
    >
      <form className="form" onSubmit={handleSubmit}>
        <h1>Customer Login</h1>
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
