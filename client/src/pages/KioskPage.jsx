import { useCallback, useEffect, useRef, useState } from "react";
import { kioskService } from "../services/kioskService.js";
import KioskWelcome from "../components/kiosk/KioskWelcome.jsx";
import KioskServiceGrid from "../components/kiosk/KioskServiceGrid.jsx";
import KioskTokenResult from "../components/kiosk/KioskTokenResult.jsx";
import "./KioskPage.css";

const RESULT_AUTO_RETURN_SECONDS = 15;
// No touch at all on the service screen for this long -> assume the
// customer walked away and reset for the next person.
const SERVICE_IDLE_TIMEOUT_MS = 45_000;

/**
 * Smart Token Kiosk (Module 5).
 *
 * A three-screen, self-resetting state machine — welcome -> services ->
 * result -> back to welcome — with no login step anywhere, per spec. Token
 * issuance and counter assignment are entirely handled by the existing
 * public POST /api/queue/tokens endpoint (Module 2/3 backend): this page's
 * job is just to drive that flow on a touchscreen and keep resetting
 * itself for the next walk-in customer.
 */
export default function KioskPage() {
  const [screen, setScreen] = useState("welcome"); // welcome | services | result
  const [services, setServices] = useState([]);
  const [servicesLoading, setServicesLoading] = useState(false);
  const [servicesError, setServicesError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [issued, setIssued] = useState(null); // { token, counter }
  const [secondsLeft, setSecondsLeft] = useState(RESULT_AUTO_RETURN_SECONDS);
  const [clock, setClock] = useState(formatClock());

  const idleTimerRef = useRef(null);
  const resultTimerRef = useRef(null);

  const resetToWelcome = useCallback(() => {
    clearTimeout(idleTimerRef.current);
    clearInterval(resultTimerRef.current);
    setScreen("welcome");
    setIssued(null);
    setServicesError("");
  }, []);

  // Live clock, ticking regardless of which screen is showing.
  useEffect(() => {
    const t = setInterval(() => setClock(formatClock()), 1000);
    return () => clearInterval(t);
  }, []);

  const loadServices = useCallback(async () => {
    setServicesLoading(true);
    setServicesError("");
    try {
      const { data } = await kioskService.listServices();
      setServices(data.services || []);
    } catch (err) {
      setServicesError(err.response?.data?.message || "Could not load services. Please try again.");
    } finally {
      setServicesLoading(false);
    }
  }, []);

  function startFlow() {
    setScreen("services");
    loadServices();
    armIdleTimer();
  }

  // Any tap on the service screen restarts the "walked away" timer.
  function armIdleTimer() {
    clearTimeout(idleTimerRef.current);
    idleTimerRef.current = setTimeout(resetToWelcome, SERVICE_IDLE_TIMEOUT_MS);
  }

  async function handleSelectService(serviceName) {
    armIdleTimer();
    setSubmitting(true);
    setServicesError("");
    try {
      const { data } = await kioskService.generateToken(serviceName);
      clearTimeout(idleTimerRef.current);
      setIssued({ token: data.token, counter: data.counter });
      setScreen("result");
    } catch (err) {
      setServicesError(
        err.response?.data?.message || "Could not generate a token right now. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  }

  // Result screen auto-return countdown.
  useEffect(() => {
    if (screen !== "result") return undefined;
    setSecondsLeft(RESULT_AUTO_RETURN_SECONDS);
    resultTimerRef.current = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          clearInterval(resultTimerRef.current);
          resetToWelcome();
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(resultTimerRef.current);
  }, [screen, resetToWelcome]);

  useEffect(() => () => {
    clearTimeout(idleTimerRef.current);
    clearInterval(resultTimerRef.current);
  }, []);

  return (
    <div className="kiosk-page" onClick={screen === "services" ? armIdleTimer : undefined}>
      {screen === "welcome" && <KioskWelcome onStart={startFlow} clock={clock} />}

      {screen === "services" && (
        <KioskServiceGrid
          services={services}
          loading={servicesLoading}
          error={servicesError}
          disabled={submitting}
          onSelect={handleSelectService}
          onBack={resetToWelcome}
        />
      )}

      {screen === "result" && issued && (
        <KioskTokenResult
          token={issued.token}
          counter={issued.counter}
          secondsLeft={secondsLeft}
          onDone={resetToWelcome}
        />
      )}
    </div>
  );
}

function formatClock() {
  return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}
