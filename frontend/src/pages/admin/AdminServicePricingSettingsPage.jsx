import { useMemo } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import PricingPageShell from "../../components/admin/pricing/PricingPageShell.jsx";
import styles from "../../components/admin/Admin.module.css";
import { findServiceById, pricingServicePath } from "../../lib/adminSlugs.js";
import { useServicePricing } from "../../context/PricingContext.jsx";
import { formatSavedLabel } from "../../lib/format.js";
import ConfirmDeleteModal from "../../components/admin/pricing/ConfirmDeleteModal.jsx";
import { useState } from "react";

export default function AdminServicePricingSettingsPage() {
  const [showConfirm, setShowConfirm] = useState(false);
  const { serviceId } = useParams();
  const navigate = useNavigate();
  const { services, setServices, save, lastSavedAt } = useServicePricing();

  const service = useMemo(() => findServiceById(services, serviceId), [services, serviceId]);

  if (!service) {
    return <Navigate to="/admin-dashboard/pricing" replace />;
  }

  const patch = (fields) => {
    setServices((prev) => prev.map((s) => (s.id === service.id ? { ...s, ...fields } : s)));
  };

  return (
    <PricingPageShell
      title="Service details"
      subtitle={`Update name and description for ${service.name}`}
      backTo={pricingServicePath(service.id)}
      backLabel={`Back to ${service.name}`}
      savedLabel={formatSavedLabel(lastSavedAt)}
      onSave={save}
      saveLabel="Save details"
    >
      <article className={styles.pricingPanel}>
        <div className={styles.pricingPanelBody}>
          <form className={styles.pricingFormStack} onSubmit={(e) => e.preventDefault()}>
            <label className={styles.pricingField}>
              <span>Service name</span>
              <input className={styles.input} value={service.name} onChange={(e) => patch({ name: e.target.value })} />
            </label>
            <label className={styles.pricingField}>
              <span>Tagline / short description</span>
              <textarea
                className={styles.textarea}
                rows={3}
                value={service.tagline ?? ""}
                onChange={(e) => patch({ tagline: e.target.value })}
              />
            </label>
          </form>
          <button
            type="button"
            className={styles.buttonDanger}
            onClick={() => setShowConfirm(true)}
          >
            Delete this service
          </button>
        </div>
      </article>

      <ConfirmDeleteModal
        open={showConfirm}
        title="Delete Service"
        message={`Are you sure you want to delete ${service.name}? This action cannot be undone.`}
        onCancel={() => setShowConfirm(false)}
        onConfirm={() => {
          setServices((prev) => prev.filter((s) => s.id !== service.id));
          setShowConfirm(false);
          navigate("/admin-dashboard/pricing");
        }}
      />
    </PricingPageShell>
  );
}
