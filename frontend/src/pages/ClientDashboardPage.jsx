import { ClientPersonalProvider } from "../context/ClientPersonalContext.jsx";
import ClientLayout from "../components/client/ClientLayout.jsx";

export default function ClientDashboardPage() {
  return (
    <ClientPersonalProvider>
      <ClientLayout />
    </ClientPersonalProvider>
  );
}
