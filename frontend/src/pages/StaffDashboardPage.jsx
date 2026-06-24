import { StaffPersonalProvider } from "../context/StaffPersonalContext.jsx";
import StaffLayout from "../components/staff/StaffLayout.jsx";

export default function StaffDashboardPage() {
  return (
    <StaffPersonalProvider>
      <StaffLayout />
    </StaffPersonalProvider>
  );
}
