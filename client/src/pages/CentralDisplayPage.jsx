import { useCallback, useEffect, useState } from "react";
import { displayService } from "../services/displayService.js";
import { getSocket } from "../services/socket.js";
import "./CentralDisplayPage.css";

const REFRESH_EVENTS = [
  "tokenGenerated",
  "tokenCalled",
  "tokenSkipped",
  "queueUpdated",
  "displayUpdated",
  "counterPaused",
  "counterResumed",
];

/**
 * Central Queue Display (Module 6) — the fullscreen webpage meant for a
 * TV/monitor mounted inside the branch. Read-only, no interaction, no
 * idle timeout: it just always shows the current state, updating itself
 * over Socket.IO the instant staff call/skip/pause/resume a token,
 * exactly like every other dashboard in the system already does.
 */
export default function CentralDisplayPage() {
  const [counters, setCounters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [clock, setClock] = useState(formatClock());

  const load = useCallback(async () => {
    try {
      const { data } = await displayService.counters();
      setCounters(data.counters || []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const socket = getSocket();
    REFRESH_EVENTS.forEach((e) => socket.on(e, load));
    return () => REFRESH_EVENTS.forEach((e) => socket.off(e, load));
  }, [load]);

  useEffect(() => {
    const t = setInterval(() => setClock(formatClock()), 1000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="central-display">
      <header className="central-display__header">
        <div className="central-display__brand">
          <span className="central-display__brand-mark">MTB</span>
          <span className="central-display__brand-name">Meridian Trust Bank</span>
        </div>
        <div className="central-display__clock">
          <span>{clock.time}</span>
          <span className="central-display__date">{clock.date}</span>
        </div>
      </header>

      <p className="central-display__welcome">
        Welcome to Meridian Trust Bank — please watch this screen for your token number.
      </p>

      {loading ? (
        <div className="central-display__status">Loading counters…</div>
      ) : counters.length === 0 ? (
        <div className="central-display__status">No counters are configured yet.</div>
      ) : (
        <div className="central-display__grid">
          {counters
            .filter(Boolean)
            .map(({ counter, currentToken }) => (
              <div className="central-display__card" key={counter._id}>
                <span className="central-display__counter-label">
                  Counter {counter.counterNumber}
                </span>
                <span className="central-display__counter-name">{counter.name}</span>
                <span className={`central-display__token ${!currentToken ? "central-display__token--empty" : ""}`}>
                  {currentToken?.tokenNumber || "—"}
                </span>
                <span className="central-display__status-pill" data-status={counter.status}>
                  {counter.status}
                </span>
              </div>
            ))}
        </div>
      )}
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
