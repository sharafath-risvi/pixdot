import { useMemo } from "react";
import { Navigate, useParams } from "react-router-dom";
import ServiceEditorForm from "../../components/admin/pricing/ServiceEditorForm.jsx";
import PricingPageShell from "../../components/admin/pricing/PricingPageShell.jsx";
import styles from "../../components/admin/Admin.module.css";
import { findServiceById, pricingServicePath } from "../../lib/adminSlugs.js";
import { useServicePricing } from "../../context/PricingContext.jsx";
import { formatSavedLabel } from "../../lib/format.js";

export default function AdminServiceDigitalPricingPage() {
  const { serviceId } = useParams();
  const { services, setServices, save, lastSavedAt } = useServicePricing();

  const service = useMemo(() => findServiceById(services, serviceId), [services, serviceId]);

  if (!service) {
    return <Navigate to="/admin-dashboard/pricing" replace />;
  }
  if (service?.detail?.type !== "digital_marketing") {
    return <Navigate to={pricingServicePath(service.id)} replace />;
  }

  return (
    <PricingPageShell
      title="Digital marketing pricing"
      subtitle="Edit plans, a-la-carte items, and meta ad settings"
      backTo={pricingServicePath(service.id)}
      backLabel={`Back to ${service.name}`}
      savedLabel={formatSavedLabel(lastSavedAt)}
      onSave={save}
      saveLabel="Save changes"
    >
      <article className={styles.pricingPanel}>
        <div className={styles.pricingPanelBody}>
          <ServiceEditorForm service={service} setServices={setServices} digitalOnly />
        </div>
      </article>
    </PricingPageShell>
  );
}
