import { Navigate, Route, Routes } from "react-router-dom";
import AdminLayout from "../components/admin/AdminLayout.jsx";
import AdminOverviewPage from "./admin/AdminOverviewPage.jsx";
import AdminServicesPage from "./admin/AdminServicesPage.jsx";
import AdminClientsPage from "./admin/AdminClientsPage.jsx";
import AdminClientDetailPage, {
  AdminClientContentView,
  AdminClientMetaView,
  AdminClientProfileView,
} from "./admin/AdminClientDetailPage.jsx";
import AdminTeamPage from "./admin/AdminTeamPage.jsx";
import AdminStaffDetailPage from "./admin/AdminStaffDetailPage.jsx";
import AdminSettingsPage from "./admin/AdminSettingsPage.jsx";
import AdminServicePricePage from "./AdminServicePricePage.jsx";
import AdminServicePricingDetailPage from "./admin/AdminServicePricingDetailPage.jsx";
import AdminServiceLineItemEditPage from "./admin/AdminServiceLineItemEditPage.jsx";
import AdminServicePricingSettingsPage from "./admin/AdminServicePricingSettingsPage.jsx";
import AdminServiceDigitalPricingPage from "./admin/AdminServiceDigitalPricingPage.jsx";

export default function AdminDashboardPage() {
  return (
    <Routes>
      <Route element={<AdminLayout />}>
        <Route index element={<AdminOverviewPage />} />
        <Route path="services" element={<AdminServicesPage />} />
        <Route path="clients" element={<AdminClientsPage />} />
        <Route path="client/:clientSlug" element={<AdminClientDetailPage />}>
          <Route index element={<AdminClientProfileView />} />
          <Route path="content" element={<AdminClientContentView />} />
          <Route path="meta" element={<AdminClientMetaView />} />
        </Route>
        <Route path="team" element={<AdminTeamPage />} />
        <Route path="staff/:staffSlug" element={<AdminStaffDetailPage />} />
        <Route path="settings" element={<AdminSettingsPage />} />
        <Route path="pricing" element={<AdminServicePricePage />} />
        <Route path="pricing/:serviceId" element={<AdminServicePricingDetailPage />} />
        <Route path="pricing/:serviceId/settings" element={<AdminServicePricingSettingsPage />} />
        <Route path="pricing/:serviceId/line/:lineId" element={<AdminServiceLineItemEditPage />} />
        <Route path="pricing/:serviceId/digital" element={<AdminServiceDigitalPricingPage />} />
        <Route path="*" element={<Navigate to="/admin-dashboard" replace />} />
      </Route>
    </Routes>
  );
}
