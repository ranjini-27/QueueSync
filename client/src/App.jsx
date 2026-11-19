import { Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import LandingPage from "./pages/LandingPage.jsx";
import ComingSoon from "./pages/ComingSoon.jsx";
import CustomerLogin from "./pages/CustomerLogin.jsx";
import CustomerRegister from "./pages/CustomerRegister.jsx";
import StaffLogin from "./pages/StaffLogin.jsx";
import StaffRegister from "./pages/StaffRegister.jsx";
import AdminLogin from "./pages/AdminLogin.jsx";
import AdminPendingStaff from "./pages/AdminPendingStaff.jsx";
import AdminDashboard from "./pages/AdminDashboard.jsx";
import StaffDashboard from "./pages/StaffDashboard.jsx";
import CustomerDashboard from "./pages/CustomerDashboard.jsx";
import KioskPage from "./pages/KioskPage.jsx";
import CentralDisplayPage from "./pages/CentralDisplayPage.jsx";

// Staff Dashboard requires the staff account to be admin-approved —
// ProtectedRoute + the /api/staff/* middleware both enforce that. The
// Kiosk, Central Display, and Customer Dashboard are intentionally NOT
// wrapped in ProtectedRoute — all three are public, no-login surfaces,
// matching their unauthenticated backend endpoints (/api/queue/*).
export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<LandingPage />} />

        <Route path="/login/customer" element={<CustomerLogin />} />
        <Route path="/register/customer" element={<CustomerRegister />} />
        <Route path="/login/staff" element={<StaffLogin />} />
        <Route path="/register/staff" element={<StaffRegister />} />
        <Route path="/login/admin" element={<AdminLogin />} />

        <Route path="/dashboard" element={<CustomerDashboard />} />
        <Route path="/kiosk" element={<KioskPage />} />
        <Route path="/display" element={<CentralDisplayPage />} />
        <Route
          path="/staff/dashboard"
          element={
            <ProtectedRoute roles={["staff"]}>
              <StaffDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/staff/pending"
          element={
            <ProtectedRoute roles={["admin"]}>
              <AdminPendingStaff />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute roles={["admin"]}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<ComingSoon title="Page Not Found" />} />
      </Routes>
    </AuthProvider>
  );
}
