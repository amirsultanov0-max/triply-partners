import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext.jsx";
import Layout from "./components/Layout.jsx";

import LandingPage   from "./pages/LandingPage.jsx";
import LoginPage     from "./pages/LoginPage.jsx";
import ApplyPage     from "./pages/ApplyPage.jsx";
import DashboardPage from "./pages/DashboardPage.jsx";
import ToursPage     from "./pages/ToursPage.jsx";
import BookingsPage  from "./pages/BookingsPage.jsx";
import PendingPage   from "./pages/PendingPage.jsx";

const ProtectedRoute = ({ children }) => {
  const { user, operator, loading } = useAuth();
  if (loading) return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "center",
      height: "100vh", color: "var(--text-tertiary)", fontSize: 14,
    }}>
      Loading…
    </div>
  );
  if (!user) return <Navigate to="/login" replace />;
  if (!operator) return <Navigate to="/apply" replace />;
  if (operator.status === "pending") return <Navigate to="/pending" replace />;
  if (operator.status === "rejected") return <Navigate to="/apply?rejected=true" replace />;
  return children;
};

const App = () => (
  <Layout>
    <Routes>
      <Route path="/"          element={<LandingPage />} />
      <Route path="/login"     element={<LoginPage />} />
      <Route path="/apply"     element={<ApplyPage />} />
      <Route path="/pending"   element={<PendingPage />} />
      <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
      <Route path="/tours"     element={<ProtectedRoute><ToursPage /></ProtectedRoute>} />
      <Route path="/bookings"  element={<ProtectedRoute><BookingsPage /></ProtectedRoute>} />
      <Route path="*"          element={<Navigate to="/" replace />} />
    </Routes>
  </Layout>
);

export default App;
