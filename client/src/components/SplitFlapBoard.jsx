import { useEffect, useState } from "react";
import "./SplitFlapBoard.css";

const CHARSET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

function randomChar() {
  return CHARSET[Math.floor(Math.random() * CHARSET.length)];
}

/**
 * A single mechanical "flap" cell. On value change it briefly cycles
 * through random glyphs before landing on the target, mimicking a
 * physical split-flap (Solari) departure-board display.
 */
function Flap({ value }) {
  const [display, setDisplay] = useState(value);
  const [flipping, setFlipping] = useState(false);

  useEffect(() => {
    if (value === display) return;
    setFlipping(true);
    let ticks = 0;
    const maxTicks = 5 + Math.floor(Math.random() * 4);
    const interval = setInterval(() => {
      ticks += 1;
      if (ticks >= maxTicks) {
        clearInterval(interval);
        setDisplay(value);
        setFlipping(false);
      } else {
        setDisplay(randomChar());
      }
    }, 55);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <span className={`flap ${flipping ? "flap--flipping" : ""}`}>
      <span className="flap__face">{display}</span>
    </span>
  );
}

const SAMPLE_TOKENS = [
  { counter: "1", token: "A021" },
  { counter: "2", token: "B015" },
  { counter: "3", token: "C008" },
  { counter: "4", token: "D011" },
];

export default function SplitFlapBoard() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % SAMPLE_TOKENS.length);
    }, 3200);
    return () => clearInterval(id);
  }, []);

  const active = SAMPLE_TOKENS[index];

  return (
    <div className="split-board" role="img" aria-label={`Now serving counter ${active.counter}, token ${active.token}`}>
      <div className="split-board__label">NOW SERVING</div>
      <div className="split-board__row">
        <div className="split-board__group">
          <span className="split-board__group-label">Counter</span>
          <div className="split-board__cells">
            <Flap value={active.counter} />
          </div>
        </div>
        <div className="split-board__divider" />
        <div className="split-board__group">
          <span className="split-board__group-label">Token</span>
          <div className="split-board__cells">
            {active.token.split("").map((ch, i) => (
              <Flap key={i} value={ch} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
