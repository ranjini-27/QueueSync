import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { HiOutlineMenu, HiX } from "react-icons/hi";
import "./Navbar.css";



const MENU_LINKS = [
  { label: "Customer Dashboard", to: "/dashboard" },
  { label: "Kiosk", to: "/kiosk" },
  { label: "Staff Register", to: "/register/staff" },
  { label: "Staff Login", to: "/login/staff" },
  { label: "Admin Login", to: "/login/admin" },
];

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const panelRef = useRef(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    function onKeyDown(e) {
      if (e.key === "Escape") setMenuOpen(false);
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <header className={`navbar ${scrolled ? "navbar--scrolled" : ""}`} id="top">
      <div className="navbar__inner">
        <Link to="/" className="navbar__brand">
          <span className="navbar__mark" aria-hidden="true">
            QS
          </span>
          <span className="navbar__name"> QueueSync</span>
        </Link>

      

        <button
          className="navbar__toggle"
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          aria-expanded={menuOpen}
          aria-controls="account-menu"
          onClick={() => setMenuOpen((v) => !v)}
        >
          {menuOpen ? <HiX size={22} /> : <HiOutlineMenu size={22} />}
        </button>
      </div>

      <div
        id="account-menu"
        ref={panelRef}
        className={`navbar__panel ${menuOpen ? "navbar__panel--open" : ""}`}
      >
        <ul>
          {MENU_LINKS.map((item) =>
            item.to ? (
              <li key={item.label}>
                <Link to={item.to} onClick={() => setMenuOpen(false)}>
                  {item.label}
                </Link>
              </li>
            ) : (
              <li key={item.label}>
                <a href={item.href} onClick={() => setMenuOpen(false)}>
                  {item.label}
                </a>
              </li>
            )
          )}
        </ul>
      </div>

      {menuOpen && <div className="navbar__scrim" onClick={() => setMenuOpen(false)} />}
    </header>
  );
}
