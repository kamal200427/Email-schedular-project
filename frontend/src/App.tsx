
// import IntegrationsSettings from "./pages";

import { Navigate, Outlet, Route, Routes } from "react-router-dom";

import { useAuth } from "./context/AuthContext";

// Pages
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import ScheduledEmails from "./pages/ScheduledEmails";
import SentEmails from "./pages/SentEmails";
import FailedEmails from "./pages/FailedEmails";
import NotFound from "./pages/NotFound";
import IntegrationsSettings from "./pages/IntegrationsSettings";
import Senders from "./pages/Senders";
// Layout
import DashboardLayout from "./components/layout/DashboardLayout";

// Common
import Loader from "./components/common/Loader";


/* =========================================
   PROTECTED ROUTE
========================================= */

const ProtectedRoute = () => {
  const {
    isAuthenticated,
    loading,
    user,
    logout,
  } = useAuth();

  // Wait until authentication check completes.
  if (loading) {
    return (
      <Loader
        fullScreen
        message="Checking authentication..."
      />
    );
  }

  // Redirect unauthenticated users.
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <DashboardLayout
      user={user}
      onLogout={logout}
    >
      <Outlet />
      
    </DashboardLayout>
  );
};


/* =========================================
   PUBLIC ROUTE
========================================= */

const PublicRoute = () => {
  const {
    isAuthenticated,
    loading,
  } = useAuth();

  if (loading) {
    return (
      <Loader
        fullScreen
        message="Loading..."
      />
    );
  }

  // Authenticated users should not see Login.
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
};


/* =========================================
   APP COMPONENT
========================================= */

const App = () => {

  return (
    <Routes>

      {/* Public Routes */}
      <Route element={<PublicRoute />}>

        <Route
          path="/login"
          element={<Login />}
        />

      </Route>


      {/* Protected Routes */}
      <Route element={<ProtectedRoute />}>

        <Route
          path="/dashboard"
          element={<Dashboard />}
        />

        <Route
          path="/scheduled"
          element={<ScheduledEmails />}
        />

        <Route
          path="/sent"
          element={<SentEmails />}
        />

        <Route
          path="/failed"
          element={<FailedEmails />}
        />

      <Route
  path="/settings/integrations"
  element={<IntegrationsSettings />}
/>
<Route path="/senders" element={<Senders />} />
      </Route>


      {/* Default Route */}
      <Route
        path="/"
        element={<Navigate to="/dashboard" replace />}
      />


      {/* 404 Route */}
      <Route
        path="*"
        element={<NotFound />}
      />

    </Routes>
  );
};

export default App;
