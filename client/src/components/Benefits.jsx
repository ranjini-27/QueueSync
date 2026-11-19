import "./Benefits.css";

const BENEFITS = [
  {
    title: "Check occupancy before you leave",
    desc: "See how many customers are inside the branch right now, so you can time your visit.",
  },
  {
    title: "No physical waiting required",
    desc: "Take a token at the kiosk and track your position from your phone anywhere nearby.",
  },
  {
    title: "Fair, transparent ordering",
    desc: "Every token is served in sequence, with live status if a counter pauses or a token is skipped.",
  },
  {
    title: "Accurate wait estimates",
    desc: "Wait times are calculated from real service history, not fixed guesses.",
  },
];

export default function Benefits() {
  return (
    <section className="benefits" id="about">
      <div className="benefits__inner">
        <div className="section-heading">
          <span className="section-heading__eyebrow">Why we built this</span>
          <h2>Built to remove the wait, not just track it</h2>
        </div>

        <div className="benefits__list">
          {BENEFITS.map((b, i) => (
            <div className="benefit-row" key={b.title}>
              <span className="benefit-row__index">{String(i + 1).padStart(2, "0")}</span>
              <div>
                <h3>{b.title}</h3>
                <p>{b.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
