import "./QueueList.css";

export default function QueueList({ queue }) {
  return (
    <div className="queue-list">
      <div className="queue-list__header">
        <h3>Waiting Queue</h3>
        <span className="queue-list__count">{queue.length} waiting</span>
      </div>

      {queue.length === 0 ? (
        <p className="queue-list__empty">No customers waiting right now.</p>
      ) : (
        <ul className="queue-list__items">
          {queue.map((t, i) => (
            <li className="queue-list__item" key={t._id}>
              <span className="queue-list__position">{i + 1}</span>
              <span className="queue-list__token">{t.tokenNumber}</span>
              <span className="queue-list__service">{t.service}</span>
              <span className="queue-list__customer">{t.customer?.fullName || "Walk-in"}</span>
              <span className="queue-list__wait">~{t.estimatedWaitMinutes} min</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
