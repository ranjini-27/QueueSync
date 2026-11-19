import { useCallback, useEffect, useState } from "react";
import { dashboardService } from "../../services/adminPanelService.js";
import { getSocket } from "../../services/socket.js";
import "./AdminOverviewCards.css";

/**
 * Current Occupancy is now live: it reflects the ESP32 Occupancy Unit's
 * running counter (Module 6) and refreshes on `occupancyUpdated`.
 */
export default function AdminOverviewCards() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const { data } = await dashboardService.stats();
      setStats(data.stats);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Refresh whenever anything queue/counter/staff/occupancy related
  // changes elsewhere.
  useEffect(() => {
    const socket = getSocket();
    const events = [
      "tokenGenerated",
      "tokenCalled",
      "queueUpdated",
      "displayUpdated",
      "counterPaused",
      "counterResumed",
      "occupancyUpdated",
    ];
    events.forEach((e) => socket.on(e, load));
    return () => events.forEach((e) => socket.off(e, load));
  }, [load]);

  const cards = [
    { label: "Current Occupancy", value: stats?.currentOccupancy ?? 0 },
    { label: "Active Counters", value: stats?.activeCounters ?? 0 },
    { label: "Tokens Issued Today", value: stats?.tokensIssued ?? 0 },
    { label: "Staff Online", value: stats?.staffOnline ?? 0 },
  ];

  return (
    <div className="admin-overview">
      {(loading ? Array(4).fill(null) : cards).map((c, i) => (
        <div className={`admin-overview__card ${c?.muted ? "admin-overview__card--muted" : ""}`} key={c?.label || i}>
          <span className="admin-overview__value">{loading ? "—" : c.value}</span>
          <span className="admin-overview__label">{loading ? "" : c.label}</span>
          {c?.note && <span className="admin-overview__note">{c.note}</span>}
        </div>
      ))}
    </div>
  );
}
