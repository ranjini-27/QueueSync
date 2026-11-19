/**
 * Horizontal "people ahead -> you -> served" progress indicator
 * (Section 6 of the Customer Dashboard). Purely presentational — derived
 * entirely from the customer's own token in the dashboard snapshot.
 */
export default function QueueProgress({ peopleAhead, position, waitMinutes }) {
  // A generous denominator keeps the fill bar meaningful even with a
  // small queue, while still reading as "almost there" once only a
  // couple of people remain ahead.
  const denominator = Math.max(peopleAhead + 1, 5);
  const progressPct = Math.round(((denominator - peopleAhead) / denominator) * 100);

  return (
    <div className="queue-progress">
      <div className="queue-progress__track">
        <div className="queue-progress__fill" style={{ width: `${progressPct}%` }} />
      </div>
      <div className="queue-progress__stats">
        <div className="queue-progress__stat">
          <span className="queue-progress__stat-value">{peopleAhead}</span>
          <span className="queue-progress__stat-label">People Ahead</span>
        </div>
        <div className="queue-progress__stat queue-progress__stat--current">
          <span className="queue-progress__stat-value">#{position}</span>
          <span className="queue-progress__stat-label">Current Position</span>
        </div>
        <div className="queue-progress__stat">
          <span className="queue-progress__stat-value">{waitMinutes} min</span>
          <span className="queue-progress__stat-label">Approximate Wait</span>
        </div>
      </div>
    </div>
  );
}
