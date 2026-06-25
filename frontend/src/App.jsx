import { Navigate, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar.jsx";
import Home from "./pages/Home.jsx";
import ServiceDetails from "./pages/ServiceDetails.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import AdminDashboardPage from "./pages/AdminDashboardPage.jsx";
import StaffDashboardPage from "./pages/StaffDashboardPage.jsx";
import StaffClientsPage from "./pages/staff/StaffClientsPage.jsx";
import StaffClientDetailPage, {
  StaffClientContentView,
  StaffClientMetaView,
  StaffClientProfileView,
} from "./pages/staff/StaffClientDetailPage.jsx";
import StaffProfilePage from "./pages/StaffProfilePage.jsx";
import StaffNotesPage from "./pages/StaffNotesPage.jsx";
import ClientDashboardPage from "./pages/ClientDashboardPage.jsx";
import ClientDetailsPage from "./pages/ClientDetailsPage.jsx";
import ClientDashboardSection from "./components/client/ClientDashboardSection.jsx";
import ClientProfile from "./components/client/ClientProfile.jsx";
import ClientCalendar from "./components/client/ClientCalendar.jsx";
import ClientMetaCalendar from "./components/client/ClientMetaCalendar.jsx";
import ClientNotes from "./components/client/ClientNotes.jsx";
import ClientProfilePage from "./pages/ClientProfilePage.jsx";
import { PricingProvider } from "./context/PricingContext.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";
import { WorkspaceProvider } from "./context/WorkspaceContext.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";

import { ToastProvider } from "./context/ToastContext.jsx";

function Shell({ children, fullWidth = false, hideNavbar = false }) {
  return (
    <div className="flex min-h-screen flex-col bg-transparent text-slate-900">
      {!hideNavbar ? <Navbar /> : null}
      <main className={fullWidth ? "w-full flex-1 px-0 py-0" : "mx-auto w-full flex-1"}>
        {children}
      </main>
    </div>
  );
}

import { Toaster } from "react-hot-toast";

export default function App() {
  return (
    <ToastProvider>
      <Toaster position="bottom-right" />
      <AuthProvider>
        <WorkspaceProvider>
          <PricingProvider>
            <Routes>
              <Route
                path="/"
                element={
                  <Shell>
                    <Home />
                  </Shell>
                }
              />
              <Route
                path="/services"
                element={
                  <Shell>
                    <Home />
                  </Shell>
                }
              />
              <Route
                path="/login"
                element={
                  <Shell fullWidth>
                    <LoginPage />
                  </Shell>
                }
              />
              <Route
                path="/signup"
                element={
                  <Shell>
                    <p className="text-slate-600">Sign up page — connect your form here.</p>
                  </Shell>
                }
              />
              <Route
                path="/services/:serviceId"
                element={
                  <Shell fullWidth>
                    <ServiceDetails />
                  </Shell>
                }
              />

              <Route
                path="/admin-dashboard/*"
                element={
                  <ProtectedRoute role="admin">
                    <Shell fullWidth hideNavbar>
                      <AdminDashboardPage />
                    </Shell>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/service-pricing"
                element={<Navigate to="/admin-dashboard/pricing" replace />}
              />

              <Route
                path="/staff"
                element={
                  <ProtectedRoute role="staff">
                    <Shell fullWidth hideNavbar>
                      <StaffDashboardPage />
                    </Shell>
                  </ProtectedRoute>
                }
              >
                <Route index element={<Navigate to="clients" replace />} />
                <Route path="clients" element={<StaffClientsPage />} />
                <Route path="client/:clientSlug" element={<StaffClientDetailPage />}>
                  <Route index element={<StaffClientProfileView />} />
                  <Route path="content" element={<StaffClientContentView />} />
                  <Route path="meta" element={<StaffClientMetaView />} />
                </Route>
                <Route path="profile" element={<StaffProfilePage />} />
                <Route path="notes" element={<StaffNotesPage />} />
                <Route path="dashboard" element={<Navigate to="/staff/clients" replace />} />
                <Route path="dashboard/*" element={<Navigate to="/staff/clients" replace />} />
              </Route>
              <Route path="/staff-dashboard" element={<Navigate to="/staff/clients" replace />} />
              <Route
                path="/client"
                element={
                  <ProtectedRoute role="client">
                    <Shell fullWidth hideNavbar>
                      <ClientDashboardPage />
                    </Shell>
                  </ProtectedRoute>
                }
              >
                <Route index element={<Navigate to="dashboard" replace />} />
                <Route path="dashboard" element={<ClientDashboardSection />}>
                  <Route index element={<ClientProfile />} />
                  <Route path="content" element={<ClientCalendar />} />
                  <Route path="meta" element={<ClientMetaCalendar />} />
                </Route>
                <Route path="profile" element={<ClientProfilePage />} />
                <Route path="notes" element={<ClientNotes />} />
              </Route>
              <Route path="/client-dashboard" element={<Navigate to="/client/dashboard" replace />} />
              <Route
                path="/client-details-page"
                element={
                  <ProtectedRoute role="admin">
                    <Shell fullWidth hideNavbar>
                      <ClientDetailsPage />
                    </Shell>
                  </ProtectedRoute>
                }
              />

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </PricingProvider>
        </WorkspaceProvider>
      </AuthProvider>
    </ToastProvider>
  );
}
