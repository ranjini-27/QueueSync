import { useState } from "react";
import { reportAdminService } from "../../services/adminPanelService.js";
import "./ReportsPanel.css";

export default function ReportsPanel() {
  const [downloading, setDownloading] = useState(null); // "pdf" | "excel" | null
  const [error, setError] = useState("");

  async function handleDownload(format) {
    setDownloading(format);
    setError("");
    try {
      await reportAdminService.downloadToday(format);
    } catch (err) {
      setError(err.response?.data?.message || "Could not download the report.");
    } finally {
      setDownloading(null);
    }
  }

  return (
    <section className="reports-panel">
      <h2>Reports</h2>
      <p className="reports-panel__hint">Download today's queue report — tokens issued, completed, skipped, and per-counter activity.</p>

      {error && <div className="form-error-banner">{error}</div>}

      <div className="reports-panel__actions">
        <button className="admin-btn admin-btn--primary" disabled={downloading} onClick={() => handleDownload("pdf")}>
          {downloading === "pdf" ? "Preparing…" : "Download PDF"}
        </button>
        <button className="admin-btn admin-btn--ghost" disabled={downloading} onClick={() => handleDownload("excel")}>
          {downloading === "excel" ? "Preparing…" : "Download Excel"}
        </button>
      </div>
    </section>
  );
}
