import "./Footer.css";

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer__inner">
        <div className="footer__brand">
          <span className="footer__mark">QS</span>
          <div>
            <strong>QueueSync</strong>
            <p>221 Harbor Street, Riverton, ST 04821</p>
          </div>
        </div>

        <nav className="footer__links" aria-label="Footer">
          <a href="#about">About</a>
        </nav>
      </div>
      <div className="footer__bottom">
        <span>© {new Date().getFullYear()} QueueSync. All rights reserved.</span>
      </div>
    </footer>
  );
}
