import "./CounterControlPanel.css";

export default function CounterControlPanel({
  counterStatus,
  hasCurrentToken,
  busy,
  onCallNext,
  onRecall,
  onSkip,
  onPauseResume,
  onTransfer,
  onManualCall,
}) {
  const paused = counterStatus === "paused";

  return (
    <div className="control-panel">
      <div className="control-panel__row">
        <button
          className="control-panel__btn control-panel__btn--primary"
          onClick={onCallNext}
          disabled={busy || paused}
        >
          Call Next
          <kbd>Space</kbd>
        </button>
        <button className="control-panel__btn" onClick={onRecall} disabled={busy || !hasCurrentToken}>
          Recall
          <kbd>R</kbd>
        </button>
        <button className="control-panel__btn" onClick={onSkip} disabled={busy || !hasCurrentToken}>
          Skip
          <kbd>S</kbd>
        </button>
        <button
          className={`control-panel__btn ${paused ? "control-panel__btn--resume" : "control-panel__btn--pause"}`}
          onClick={onPauseResume}
          disabled={busy}
        >
          {paused ? "Resume" : "Pause"}
          <kbd>P</kbd>
        </button>
      </div>
      <div className="control-panel__row">
        <button className="control-panel__btn control-panel__btn--wide" onClick={onTransfer} disabled={busy || !hasCurrentToken}>
          Transfer Customer
        </button>
        <button className="control-panel__btn control-panel__btn--wide" onClick={onManualCall} disabled={busy}>
          Manual Next
          <kbd>Ctrl+N</kbd>
        </button>
      </div>
      {paused && <p className="control-panel__notice">Counter is paused — resume to call the next token.</p>}
    </div>
  );
}
