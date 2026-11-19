import "./NowServingCard.css";

export default function NowServingCard({ counter, currentToken }) {
  return (
    <div className={`now-serving ${currentToken ? "" : "now-serving--empty"}`}>
      <span className="now-serving__eyebrow">Now Serving · {counter?.name}</span>
      {currentToken ? (
        <span className="now-serving__token">{currentToken.tokenNumber}</span>
      ) : (
        <span className="now-serving__placeholder">No customer being served</span>
      )}
      {currentToken && (
        <span className="now-serving__service">{currentToken.service}</span>
      )}
    </div>
  );
}
