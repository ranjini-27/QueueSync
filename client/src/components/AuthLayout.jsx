import { Link } from "react-router-dom";
import "./AuthLayout.css";

export default function AuthLayout({ eyebrow, title, subtitle, children, footer }) {
  return (
    <div className="auth-layout">
      <div className="auth-layout__panel">
        <Link to="/" className="auth-layout__brand">
          <span className="auth-layout__mark">QS</span>
          QueueSync
        </Link>
        <div className="auth-layout__copy">
          <span className="auth-layout__eyebrow">{eyebrow}</span>
          <h2>{title}</h2>
          <p>{subtitle}</p>
        </div>
      </div>

      <div className="auth-layout__form-side">
        <div className="auth-layout__form-card">{children}</div>
        {footer && <div className="auth-layout__footer">{footer}</div>}
      </div>
    </div>
  );
}
