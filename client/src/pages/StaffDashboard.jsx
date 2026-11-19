import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { staffService } from "../services/staffService.js";
import { getSocket } from "../services/socket.js";
import StaffStatsCards from "../components/staff/StaffStatsCards.jsx";
import NowServingCard from "../components/staff/NowServingCard.jsx";
import CounterControlPanel from "../components/staff/CounterControlPanel.jsx";
import QueueList from "../components/staff/QueueList.jsx";
import TransferModal from "../components/staff/TransferModal.jsx";
import ManualCallModal from "../components/staff/ManualCallModal.jsx";
import "./StaffDashboard.css";

export default function StaffDashboard() {
  const { user, logout } = useAuth();
  const [snapshot, setSnapshot] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [showTransfer, setShowTransfer] = useState(false);
  const [showManualCall, setShowManualCall] = useState(false);

  // Kept in a ref so the keyboard listener always sees fresh state without
  // being re-bound on every snapshot update.
  const snapshotRef = useRef(snapshot);
  snapshotRef.current = snapshot;
  const busyRef = useRef(busy);
  busyRef.current = busy;

  const load = useCallback(async () => {
    setError("");
    try {
      const { data } = await staffService.dashboard();
      setSnapshot(data);
    } catch (err) {
      setError(err.response?.data?.message || "Could not load your counter.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Live updates: any queue/display/pause event for our counter (or a
  // token generated for it) triggers a fresh snapshot. The system is a
  // single branch, so a straightforward refetch-on-event is simple and
  // reliable rather than hand-merging partial state.
  useEffect(() => {
    const socket = getSocket();
    const counterId = snapshot?.counter?._id;

    const maybeReload = (payload) => {
      if (!payload?.counterId || String(payload.counterId) === String(snapshotRef.current?.counter?._id)) {
        load();
      }
    };

    const events = [
      "tokenCalled",
      "tokenSkipped",
      "tokenGenerated",
      "queueUpdated",
      "occupancyUpdated",
      "counterPaused",
      "counterResumed",
     "displayUpdated",
    ];
    events.forEach((e) => socket.on(e, maybeReload));
    return () => events.forEach((e) => socket.off(e, maybeReload));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [load, snapshot?.counter?._id]);

  function flash(message) {
    setToast(message);
    setTimeout(() => setToast(""), 2200);
  }

  async function runAction(fn, successMessage) {
    if (busyRef.current) return;
    setBusy(true);
    setError("");
    try {
      const { data } = await fn();
      setSnapshot((prev) => ({ ...prev, ...data }));
      if (successMessage) flash(successMessage);
    } catch (err) {
      setError(err.response?.data?.message || "Action failed. Please retry.");
    } finally {
      setBusy(false);
    }
  }

  const handleCallNext = () => runAction(staffService.callNext, "Next token called.");
  const handleRecall = () => runAction(staffService.recall, "Token recalled.");
  const handleSkip = () => runAction(staffService.skip, "Token skipped.");
  const handlePauseResume = () =>
    runAction(
      snapshot?.counter?.status === "paused" ? staffService.resume : staffService.pause,
      snapshot?.counter?.status === "paused" ? "Counter resumed." : "Counter paused."
    );

  async function handleTransferConfirm(targetCounterNumber) {
    await runAction(
      () => staffService.transfer(snapshot.currentToken._id, targetCounterNumber),
      "Customer transferred."
    );
    setShowTransfer(false);
  }

  async function handleManualSelect(tokenId) {
    await runAction(() => staffService.callSpecific(tokenId), "Token called manually.");
    setShowManualCall(false);
  }

  // Keyboard shortcuts: Space / R / S / P / Ctrl+N.
  useEffect(() => {
    function onKeyDown(e) {
      const tag = document.activeElement?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return; // don't hijack form typing
      if (showTransfer || showManualCall) return;

      if (e.ctrlKey && (e.key === "n" || e.key === "N")) {
        e.preventDefault();
        setShowManualCall(true);
        return;
      }
      switch (e.key) {
        case " ":
          e.preventDefault();
          handleCallNext();
          break;
        case "r":
        case "R":
          handleRecall();
          break;
        case "s":
        case "S":
          handleSkip();
          break;
        case "p":
        case "P":
          handlePauseResume();
          break;
        default:
          break;
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [snapshot, showTransfer, showManualCall]);

  if (loading) {
    return (
      <div className="staff-dashboard staff-dashboard--center">
        <p>Loading your counter…</p>
      </div>
    );
  }

  if (error && !snapshot) {
    return (
      <div className="staff-dashboard staff-dashboard--center">
        <p className="form-error-banner">{error}</p>
        <button className="modal-btn modal-btn--primary" onClick={load}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="staff-dashboard">
      <header className="staff-dashboard__header">
        <div>
          <span className="staff-dashboard__eyebrow">Staff Dashboard</span>
          <h1>{snapshot?.counter?.name}</h1>
        </div>
        <div className="staff-dashboard__account">
          <span>
            {user?.name} · {user?.staffId}
          </span>
          <button onClick={logout}>Log out</button>
        </div>
      </header>

      {error && <div className="form-error-banner">{error}</div>}
      {toast && <div className="staff-dashboard__toast">{toast}</div>}

      <StaffStatsCards stats={snapshot?.stats} />

      <div className="staff-dashboard__grid">
        <div>
          <NowServingCard counter={snapshot?.counter} currentToken={snapshot?.currentToken} />
          <CounterControlPanel
            counterStatus={snapshot?.counter?.status}
            hasCurrentToken={!!snapshot?.currentToken}
            busy={busy}
            onCallNext={handleCallNext}
            onRecall={handleRecall}
            onSkip={handleSkip}
            onPauseResume={handlePauseResume}
            onTransfer={() => setShowTransfer(true)}
            onManualCall={() => setShowManualCall(true)}
          />
        </div>
        <div>
          <QueueList queue={snapshot?.queue || []} />
        </div>
      </div>

      {showTransfer && (
        <TransferModal
          currentToken={snapshot?.currentToken}
          busy={busy}
          onClose={() => setShowTransfer(false)}
          onConfirm={handleTransferConfirm}
        />
      )}
      {showManualCall && (
        <ManualCallModal
          queue={snapshot?.queue || []}
          busy={busy}
          onClose={() => setShowManualCall(false)}
          onSelect={handleManualSelect}
        />
      )}
    </div>
  );
}
