/**
 * One counter's live status (Section 5 of the Customer Dashboard).
 * `snapshot` is a single entry from GET /api/customer/dashboard's
 * `counters` array — the same shape buildAllCountersSnapshot() already
 * produces for the Staff Dashboard and Central Display, so nothing new
 * had to be invented on the backend for this card.
 */
export default function CounterStatusCard({ snapshot, isMine }) {
  const { counter, currentToken, queueCount, stats } = snapshot;

  return (
    <div className={`counter-card ${isMine ? "counter-card--mine" : ""}`}>
      <div className="counter-card__top">
        <span className="counter-card__number">Counter {counter.counterNumber}</span>
        <span className="counter-card__status-pill" data-status={counter.status}>
          {counter.status}
        </span>
      </div>

      <h3 className="counter-card__name">{counter.name}</h3>

      <div className="counter-card__row">
        <span className="counter-card__label">Current Token</span>
        <span className="counter-card__value counter-card__value--mono">
          {currentToken?.tokenNumber || "—"}
        </span>
      </div>
      <div className="counter-card__row">
        <span className="counter-card__label">Customers Waiting</span>
        <span className="counter-card__value">{queueCount}</span>
      </div>
      <div className="counter-card__row">
        <span className="counter-card__label">Est. Waiting Time</span>
        <span className="counter-card__value">
          {stats?.averageWaitMinutes ? `${stats.averageWaitMinutes} min` : "—"}
        </span>
      </div>

      {isMine && <span className="counter-card__mine-badge">Your counter</span>}
    </div>
  );
}
