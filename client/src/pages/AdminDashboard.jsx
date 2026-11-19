import { useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import AdminNav from "../components/admin/AdminNav.jsx";
import AdminOverviewCards from "../components/admin/AdminOverviewCards.jsx";
import StaffManagement from "../components/admin/StaffManagement.jsx";
import CounterManagement from "../components/admin/CounterManagement.jsx";
import ServiceManagement from "../components/admin/ServiceManagement.jsx";
import QueueManagement from "../components/admin/QueueManagement.jsx";
import ReportsPanel from "../components/admin/ReportsPanel.jsx";
import "../components/admin/AdminShared.css";
import "./AdminDashboard.css";

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const [tab, setTab] = useState("overview");

  return (
    <div className="admin-dashboard">
      <header className="admin-dashboard__header">
        <div>
          <span className="admin-dashboard__eyebrow">Admin Dashboard</span>
          <h1>Branch Administration</h1>
        </div>
        <div className="admin-dashboard__account">
          <span>{user?.name}</span>
          <button onClick={logout}>Log out</button>
        </div>
      </header>

      {tab === "overview" && <AdminOverviewCards />}

      <AdminNav active={tab} onChange={setTab} />

      <div className="admin-dashboard__body">
        {tab === "overview" && (
          <div className="admin-section">
            <h2>Welcome back</h2>
            <p className="admin-dashboard__welcome">
              Use the tabs above to manage staff, counters, banking services, today's queue, and reports. The cards
              above refresh automatically as tokens are issued and served across the branch.
            </p>
          </div>
        )}
        {tab === "staff" && (
          <div className="admin-section">
            <StaffManagement />
          </div>
        )}
        {tab === "counters" && (
          <div className="admin-section">
            <CounterManagement />
          </div>
        )}
        {tab === "services" && (
          <div className="admin-section">
            <ServiceManagement />
          </div>
        )}
        {tab === "queue" && (
          <div className="admin-section">
            <QueueManagement />
          </div>
        )}
        {tab === "reports" && (
          <div className="admin-section">
            <ReportsPanel />
          </div>
        )}
      </div>
    </div>
  );
}
