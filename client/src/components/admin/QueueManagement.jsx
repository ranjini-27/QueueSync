import { useState } from "react";
import { queueAdminService } from "../../services/adminPanelService.js";
import "./QueueManagement.css";

export default function QueueManagement() {
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  async function handleReset() {
    setBusy(true);
    setError("");
    try {
      const { data } = await queueAdminService.resetToday();
      setResult(data);
      setConfirming(false);
    } catch (err) {
      setError(err.response?.data?.message || "Could not reset the queue.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="queue-mgmt">
      <h2>Queue Management</h2>

      {error && <div className="form-error-banner">{error}</div>}
      {result && (
        <div className="admin-toast">
          Today's queue was reset — {result.tokensCancelled} pending token
          {result.tokensCancelled === 1 ? "" : "s"} cancelled.
        </div>
      )}

      <div className="queue-mgmt__card">
        <div>
          <strong>Reset Today's Queue</strong>
          <p>
            Cancels every token still waiting or being served today and clears each counter's current token. Staff,
            counter, and service configuration are untouched. This cannot be undone.
          </p>
        </div>

        {confirming ? (
          <div className="queue-mgmt__confirm">
            <span>Are you sure?</span>
            <button className="admin-btn admin-btn--danger" disabled={busy} onClick={handleReset}>
              {busy ? "Resetting…" : "Yes, reset queue"}
            </button>
            <button className="admin-btn admin-btn--ghost" disabled={busy} onClick={() => setConfirming(false)}>
              Cancel
            </button>
          </div>
        ) : (
          <button className="admin-btn admin-btn--danger" onClick={() => setConfirming(true)}>
            Reset Today's Queue
          </button>
        )}
      </div>
    </section>
  );
}
