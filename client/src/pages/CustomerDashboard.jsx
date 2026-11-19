import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { customerService } from "../services/customerService.js";
import { getSocket } from "../services/socket.js";
import CounterStatusCard from "../components/customer/CounterStatusCard.jsx";
import "./CustomerDashboard.css";

// Events that should trigger a fresh snapshot fetch — the same
// "reload on event" pattern already used by the Staff Dashboard and
// Central Display, so this page updates in real time as tokens are
// generated, called, skipped, or counters are paused/resumed.
const REFRESH_EVENTS = [
  "tokenGenerated",
  "tokenCalled",
  "tokenSkipped",
  "queueUpdated",
  "occupancyUpdated",
  "displayUpdated",
  "counterPaused",
  "counterResumed",
];

/**
 * Customer Dashboard — a public branch overview, no login required.
 * Reached from the site's More Options menu, it shows live occupancy,
 * how many counters are currently active, and every counter's current
 * token / customers waiting / estimated wait time. Generating a token
 * happens on the Kiosk page (also linked from More Options); this page
 * is purely a read-only, always-live snapshot.
 */
export default function CustomerDashboard() {
  const navigate = useNavigate();

  const [snapshot, setSnapshot] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [clock, setClock] = useState(formatClock());

  const load = useCallback(async () => {
    try {
      const { data } = await customerService.dashboard();
      setSnapshot(data);
      setError("");
    } catch (err) {
      setError(err.response?.data?.message || "Could not load the branch dashboard.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Live clock for the header.
  useEffect(() => {
    const t = setInterval(() => setClock(formatClock()), 1000);
    return () => clearInterval(t);
  }, []);

  // Real-time refresh on any queue/occupancy/display event.
  useEffect(() => {
    const socket = getSocket();
    REFRESH_EVENTS.forEach((e) => socket.on(e, load));
    return () => REFRESH_EVENTS.forEach((e) => socket.off(e, load));
  }, [load]);

  if (loading) {
    return (
      <div className="customer-dashboard customer-dashboard--center">
        <p>Loading the branch dashboard…</p>
      </div>
    );
  }

  if (error && !snapshot) {
    return (
      <div className="customer-dashboard customer-dashboard--center">
        <p className="form-error-banner">{error}</p>
        <button className="cd-btn cd-btn--primary" onClick={load}>
          Retry
        </button>
      </div>
    );
  }

  const { occupancy, activeCounters = 0, counters = [] } = snapshot || {};
  const totalWaiting = counters.reduce((sum, c) => sum + (c.queueCount || 0), 0);

  return (
    <div className="customer-dashboard">
      {/* Header */}
      <header className="cd-header">
        <div>
          <span className="cd-eyebrow">Customer Dashboard</span>
          <h1>Branch Queue Overview</h1>
          <p className="cd-header__meta">Live status — updates automatically, no login needed.</p>
        </div>
        <div className="cd-header__right">
          <div className="cd-header__clock">
            <span>{clock.time}</span>
            <span className="cd-header__date">{clock.date}</span>
          </div>
        </div>
      </header>

      {error && <div className="form-error-banner">{error}</div>}

      <div className="cd-grid cd-grid--stats">
        {/* Live Bank Occupancy */}
        <section className="cd-card cd-occupancy">
          <span className="cd-card__label">Current Occupancy</span>
          <span className="cd-occupancy__count">{occupancy?.current ?? 0} Customers Inside Bank</span>
          <div className="cd-occupancy__status">
            <span>Occupancy Status</span>
            <span className="cd-status-pill" data-level={occupancy?.status}>
              ● {occupancy?.status || "Low"}
            </span>
          </div>
        </section>

        {/* Active Counters */}
        <section className="cd-card cd-now-serving">
          <span className="cd-card__label">Active Counters</span>
          <span className="cd-now-serving__token">{activeCounters}</span>
          <span className="cd-now-serving__empty">of {counters.length} counters open</span>
        </section>
      </div>

      {/* Counter Status */}
      <section id="counter-status-section" className="cd-section">
        <h2 className="cd-section__title">Counter Status</h2>
        {counters.length === 0 ? (
          <p className="cd-empty">No counters are configured yet.</p>
        ) : (
          <div className="cd-counter-grid">
            {counters.map((c) => (
              <CounterStatusCard key={c.counter._id} snapshot={c} isMine={false} />
            ))}
          </div>
        )}
      </section>

      <div className="cd-quick-actions__buttons">
        <button className="cd-btn" onClick={load}>
          Refresh
        </button>
        <button className="cd-btn cd-btn--primary" onClick={() => navigate("/kiosk")}>
          Generate a Token
        </button>
      </div>
    </div>
  );
}

function formatClock() {
  const now = new Date();
  return {
    time: now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
    date: now.toLocaleDateString([], { weekday: "long", year: "numeric", month: "long", day: "numeric" }),
  };
}
