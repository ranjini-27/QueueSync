import { Link } from "react-router-dom";

export default function ComingSoon({ title }) {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "1rem",
        fontFamily: "var(--font-body)",
        background: "var(--mist)",
        textAlign: "center",
        padding: "2rem",
      }}
    >
      <h2 style={{ fontFamily: "var(--font-display)" }}>{title}</h2>
      <p style={{ color: "var(--grey)", maxWidth: 420 }}>
        This module is built next, right after the Landing Page module is reviewed.
      </p>
      <Link to="/" style={{ color: "var(--sky)", fontWeight: 600 }}>
        ← Back to home
      </Link>
    </div>
  );
}
