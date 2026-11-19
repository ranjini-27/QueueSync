import "./StaffStatsCards.css";

/**
 * Occupancy is intentionally not wired to real data here — that's the
 * ESP32 Occupancy Unit (Module 6). The card is present so the layout
 * matches the spec and slots in live data with no rework once that
 * module ships.
 */
export default function StaffStatsCards({ stats }) {
  const cards = [
    { label: "Today's Customers", value: stats?.todayCustomers ?? 0 },
    { label: "Completed", value: stats?.completed ?? 0 },
    { label: "Skipped", value: stats?.skipped ?? 0 },
    {
      label: "Avg. Waiting Time",
      value: stats?.averageWaitMinutes ? `${stats.averageWaitMinutes} min` : "—",
    },
  ];

  return (
    <div className="staff-stats">
      {cards.map((c) => (
        <div className="staff-stats__card" key={c.label}>
          <span className="staff-stats__value">{c.value}</span>
          <span className="staff-stats__label">{c.label}</span>
        </div>
      ))}
      <div className="staff-stats__card">
  <span className="staff-stats__value">
    {stats?.occupancy ?? 0}
  </span>
  <span className="staff-stats__label">
    Current Occupancy
  </span>
</div>
    </div>
  );
}
