import { MdCheckCircleOutline, MdOutlineDesktopWindows, MdOutlineTimer } from "react-icons/md";
import "./KioskTokenResult.css";

/**
 * Shown right after POST /api/queue/tokens succeeds. `secondsLeft` drives
 * the auto-return-to-welcome countdown so the kiosk is always ready for
 * the next customer without staff intervention.
 */
export default function KioskTokenResult({ token, counter, secondsLeft, onDone }) {
  return (
    <div className="kiosk-result">
      <MdCheckCircleOutline className="kiosk-result__check" size={56} />

      <span className="kiosk-result__eyebrow">Your token number is</span>
      <div className="kiosk-result__token">{token.tokenNumber}</div>

      <div className="kiosk-result__cards">
        <div className="kiosk-result__card">
          <MdOutlineDesktopWindows size={26} />
          <span className="kiosk-result__card-label">Counter</span>
          <span className="kiosk-result__card-value">{counter?.name || `Counter ${counter?.counterNumber ?? "-"}`}</span>
        </div>
        <div className="kiosk-result__card">
          <MdOutlineTimer size={26} />
          <span className="kiosk-result__card-label">Estimated Wait</span>
          <span className="kiosk-result__card-value">
            {token.estimatedWaitMinutes > 0 ? `${token.estimatedWaitMinutes} min` : "Next in line"}
          </span>
        </div>
      </div>

      <p className="kiosk-result__message">
        Please wait for your turn.
      </p>

      <button className="kiosk-result__done" onClick={onDone} type="button">
        Done — returning in {secondsLeft}s
      </button>
    </div>
  );
}
