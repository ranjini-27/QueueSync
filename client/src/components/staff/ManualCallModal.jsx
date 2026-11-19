import Modal from "./Modal.jsx";

export default function ManualCallModal({ queue, onClose, onSelect, busy }) {
  return (
    <Modal title="Manual Next — Pick a Token" onClose={onClose}>
      {queue.length === 0 ? (
        <p className="modal-hint">No customers are waiting on your counter.</p>
      ) : (
        <ul className="manual-call-list">
          {queue.map((t, i) => (
            <li key={t._id}>
              <button className="manual-call-list__item" disabled={busy} onClick={() => onSelect(t._id)}>
                <span className="manual-call-list__pos">{i + 1}</span>
                <span className="manual-call-list__token">{t.tokenNumber}</span>
                <span className="manual-call-list__service">{t.service}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </Modal>
  );
}
