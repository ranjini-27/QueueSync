import { useState } from "react";
import Modal from "./Modal.jsx";

export default function TransferModal({ currentToken, onClose, onConfirm, busy }) {
  const [target, setTarget] = useState("");

  return (
    <Modal title="Transfer Customer" onClose={onClose}>
      <p className="modal-hint">
        Move token <strong>{currentToken?.tokenNumber}</strong> to another counter's queue.
      </p>
      <label className="modal-field">
        Target counter number
        <input
          type="number"
          min="1"
          value={target}
          onChange={(e) => setTarget(e.target.value)}
          placeholder="e.g. 3"
        />
      </label>
      <div className="modal-actions">
        <button className="modal-btn modal-btn--ghost" onClick={onClose}>
          Cancel
        </button>
        <button
          className="modal-btn modal-btn--primary"
          disabled={!target || busy}
          onClick={() => onConfirm(Number(target))}
        >
          Transfer
        </button>
      </div>
    </Modal>
  );
}
