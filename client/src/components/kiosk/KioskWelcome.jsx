import { MdTouchApp } from "react-icons/md";
import "./KioskWelcome.css";

/**
 * Idle/attract screen. The entire panel is one big tap target — a real
 * touchscreen kiosk shouldn't force a customer to hunt for a small button.
 */
export default function KioskWelcome({ onStart, clock }) {
  return (
    <button className="kiosk-welcome" onClick={onStart} type="button">
      <div className="kiosk-welcome__brand">
        <span className="kiosk-welcome__brand-mark">QS</span>
        <span className="kiosk-welcome__brand-name">QueueSync</span>
      </div>

      <div className="kiosk-welcome__center">
        <h1>Welcome</h1>
        <p>Tap anywhere on the screen to get your token</p>
        <div className="kiosk-welcome__cta">
          <MdTouchApp size={40} />
          <span>Tap to Begin</span>
        </div>
      </div>

      <div className="kiosk-welcome__clock">{clock}</div>
    </button>
  );
}
