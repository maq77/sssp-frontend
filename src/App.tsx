// src/App.tsx
import { Routes, Route, Navigate, useParams } from "react-router-dom";
import { useAuthStore } from "./store/authStore";
import { UserRole } from "./types";

// Layouts
import { MainLayout } from "./components/layout/MainLayout";
import { MarketingLayout } from "./components/layout/MarketingLayout";

// Auth Pages
import { LoginPage } from "./pages/auth/LoginPage";
import { SignUpPage } from "./pages/auth/SignUpPage";
import { ForgotPasswordPage } from "./pages/auth/ForgotPasswordPage";

// Marketing Pages (Public)
import { HomePage } from "./pages/home/HomePage";
import { CapabilitiesPage } from "./pages/home/CapabilitiesPage";
import { TechnologyPage } from "./pages/home/TechnologyPage";
import { PricingPage } from "./pages/home/PricingPage";
import { AboutPage } from "./pages/home/AboutPage";
import { WhyUsPage } from "./pages/home/WhyUsPage";
import { UseCasesPage } from "./pages/home/UseCasesPage";


// v2 home page — commented out to exclude from build
// import V2HomePage from './pages/v2/V2HomePage';
// import ScenarioSelector from './pages/v2/scenarios/ScenarioSelector';
// import AirportScenarios from './pages/v2/scenarios/airport/AirportScenarios';

// Operator Pages (Protected)
import { DashboardPage } from "./pages/operator/DashboardPage";
import { IncidentsPage } from "./pages/incidents/IncidentsPage";
import { AlertsPage } from "./pages/alerts/AlertsPage";
import { CamerasOverviewPage } from "./pages/camera/CamerasOverviewPage";
import CameraDetailsPage from "./pages/camera/CameraDetailsPage";
import WhepDiagnostics from "./pages/camera/whep-test";
import WhepTestMinimal from "./pages/camera/whep-minimal";
import MapPage from "./pages/map/MapPage";
import { UsersPage } from "./pages/users/UsersPage";
import { ZonesPage } from "./pages/zones/ZonesPage";
import { SettingsPage } from "./pages/settings/SettingsPage";

// Admin Pages (Protected)
import AdminDashboard from "./pages/admin/AdminDashboard";

// Environment / AQI Dashboard
import EnvironmentDashboardPage from "./pages/environment/EnvironmentDashboardPage";

// SOC
import { SocPage } from "./pages/soc/SocPage";

// Watchlist
import { WatchlistPage } from "./pages/watchlist/WatchlistPage";

// ============================================
// Route Guards
// ============================================
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
const isAuthenticated = useAuthStore((s) => s.isAuthenticated);


if (!isAuthenticated) {
const returnUrl = encodeURIComponent(window.location.pathname + window.location.search);
return <Navigate to={`/login?returnUrl=${returnUrl}`} replace />;
}


return <>{children}</>;
};

const CameraDetailsRedirect = () => {
  const { id } = useParams();
  return <Navigate to={id ? `/app/cameras/${id}` : "/app/cameras"} replace />;
};

const RoleBasedRoute = ({
  children,
  allowedRoles,
}: {
  children: React.ReactNode;
  allowedRoles: UserRole[];
}) => {
  const user = useAuthStore((s) => s.user);

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(user.role)) {
    if (user.role === UserRole.Admin) return <Navigate to="/app/admin" replace />;
    return <Navigate to="/app/dashboard" replace />;
  }

  return <>{children}</>;
};

// ============================================
// Main App Component
// ============================================
function App() {
  const user = useAuthStore((s) => s.user);

  const getDefaultRedirect = () => {
    if (!user) return "/";
    if (user.role === UserRole.Admin) return "/app/admin";
    return "/app/dashboard";
  };

  return (
    <Routes>
      {/* ==================== V2 3D DEMO ROUTES (commented out) ==================== */}
      {/* <Route path="/v2">
        <Route index element={<V2HomePage />} />
        <Route path="scenarios/:industryId" element={<ScenarioSelector />} />
        <Route path="scenarios/airport/:scenarioId" element={<AirportScenarios />} />
        <Route path="scenarios/smartcity/:scenarioId" element={<div>Smart City Scenario</div>} />
        <Route path="scenarios/facility/:scenarioId" element={<div>Facility Scenario</div>} />
        <Route path="scenarios/campus/:scenarioId" element={<div>Campus Scenario</div>} />
      </Route> */}



      {/* ==================== PUBLIC MARKETING ROUTES ==================== */}
      <Route element={<MarketingLayout />}>
        <Route index element={<HomePage />} />
        <Route path="/why-us" element={<WhyUsPage />} />
        <Route path="/use-cases" element={<UseCasesPage />} />
        <Route path="/capabilities" element={<CapabilitiesPage />} />
        <Route path="/technology" element={<TechnologyPage />} />
        <Route path="/pricing" element={<PricingPage />} />
        <Route path="/about" element={<AboutPage />} />
      </Route>

      {/* ==================== AUTH ROUTES ==================== */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignUpPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />

      <Route path="/dashboard" element={<Navigate to="/app/dashboard" replace />} />
      <Route path="/admin" element={<Navigate to="/app/admin" replace />} />
      <Route path="/incidents" element={<Navigate to="/app/incidents" replace />} />
      <Route path="/alerts" element={<Navigate to="/app/alerts" replace />} />
      <Route path="/cameras" element={<Navigate to="/app/cameras" replace />} />
      <Route path="/cameras/:id" element={<CameraDetailsRedirect />} />
      <Route path="/map" element={<Navigate to="/app/map" replace />} />
      <Route path="/zones" element={<Navigate to="/app/zones" replace />} />
      <Route path="/users" element={<Navigate to="/app/users" replace />} />
      <Route path="/settings" element={<Navigate to="/app/settings" replace />} />
      <Route path="/environment" element={<Navigate to="/app/environment" replace />} />
      <Route path="/soc" element={<Navigate to="/app/soc" replace />} />
      <Route path="/watchlist" element={<Navigate to="/app/watchlist" replace />} />
      <Route path="/whep-test" element={<Navigate to="/app/whep-test" replace />} />
      <Route path="/whep-minimal" element={<Navigate to="/app/whep-minimal" replace />} />
      <Route path="/user/dashboard" element={<Navigate to="/app/dashboard" replace />} />
      {/* ==================== PROTECTED DASHBOARD ROUTES ==================== */}
      <Route
        path="/app"
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to={getDefaultRedirect()} replace />} />

        {/* Admin Routes */}
        <Route
          path="admin"
          element={
            <RoleBasedRoute allowedRoles={[UserRole.Admin]}>
              <AdminDashboard />
            </RoleBasedRoute>
          }
        />

        {/* Operator Routes */}
        <Route
          path="dashboard"
          element={
            <RoleBasedRoute allowedRoles={[UserRole.Operator, UserRole.Admin, UserRole.User]}>
              <DashboardPage />
            </RoleBasedRoute>
          }
        />

        <Route
          path="alerts"
          element={
            <RoleBasedRoute allowedRoles={[UserRole.Operator, UserRole.Admin]}>
              <AlertsPage />
            </RoleBasedRoute>
          }
        />

        <Route
          path="incidents"
          element={
            <RoleBasedRoute allowedRoles={[UserRole.Operator, UserRole.Admin]}>
              <IncidentsPage />
            </RoleBasedRoute>
          }
        />

        <Route
          path="cameras"
          element={
            <RoleBasedRoute allowedRoles={[UserRole.Operator, UserRole.Admin]}>
              <CamerasOverviewPage />
            </RoleBasedRoute>
          }
        />

        <Route
          path="cameras/:id"
          element={
            <RoleBasedRoute allowedRoles={[UserRole.Operator, UserRole.Admin]}>
              <CameraDetailsPage />
            </RoleBasedRoute>
          }
        />

        <Route
          path="map"
          element={
            <RoleBasedRoute allowedRoles={[UserRole.Operator, UserRole.Admin]}>
              <MapPage />
            </RoleBasedRoute>
          }
        />

        <Route
          path="whep-test"
          element={
            <RoleBasedRoute allowedRoles={[UserRole.Operator, UserRole.Admin]}>
              <WhepDiagnostics />
            </RoleBasedRoute>
          }
        />

        <Route
          path="whep-minimal"
          element={
            <RoleBasedRoute allowedRoles={[UserRole.Operator, UserRole.Admin]}>
              <WhepTestMinimal />
            </RoleBasedRoute>
          }
        />

        <Route
          path="zones"
          element={
            <RoleBasedRoute allowedRoles={[UserRole.Operator, UserRole.Admin]}>
              <ZonesPage />
            </RoleBasedRoute>
          }
        />

        <Route
          path="users"
          element={
            <RoleBasedRoute allowedRoles={[UserRole.Operator, UserRole.Admin]}>
              <UsersPage />
            </RoleBasedRoute>
          }
        />

        {/* Environment Dashboard */}
        <Route
          path="environment"
          element={
            <RoleBasedRoute allowedRoles={[UserRole.Operator, UserRole.Admin]}>
              <EnvironmentDashboardPage />
            </RoleBasedRoute>
          }
        />

        {/* SOC */}
        <Route
          path="soc"
          element={
            <RoleBasedRoute allowedRoles={[UserRole.Operator, UserRole.Admin]}>
              <SocPage />
            </RoleBasedRoute>
          }
        />

        {/* Watchlist */}
        <Route
          path="watchlist"
          element={
            <RoleBasedRoute allowedRoles={[UserRole.Operator, UserRole.Admin]}>
              <WatchlistPage />
            </RoleBasedRoute>
          }
        />

        {/* Shared Routes */}
        <Route path="settings" element={<SettingsPage />} />

        {/* 404 Fallback */}
        <Route path="*" element={<Navigate to={getDefaultRedirect()} replace />} />
      </Route>

      {/* Global 404 - redirect to home */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
