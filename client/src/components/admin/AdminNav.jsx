import "./AdminNav.css";

const TABS = [
  { key: "overview", label: "Dashboard" },
  { key: "staff", label: "Staff" },
  { key: "counters", label: "Counters" },
  { key: "services", label: "Services" },
  { key: "queue", label: "Queue" },
  { key: "reports", label: "Reports" },
];

export default function AdminNav({ active, onChange }) {
  return (
    <nav className="admin-nav">
      {TABS.map((tab) => (
        <button
          key={tab.key}
          className={`admin-nav__item ${active === tab.key ? "admin-nav__item--active" : ""}`}
          onClick={() => onChange(tab.key)}
        >
          {tab.label}
        </button>
      ))}
    </nav>
  );
}
