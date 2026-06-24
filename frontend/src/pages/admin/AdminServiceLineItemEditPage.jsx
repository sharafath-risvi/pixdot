import { useMemo, useState } from "react";
import { Navigate, useParams } from "react-router-dom";
import LineItemEditor from "../../components/admin/pricing/LineItemEditor.jsx";
import PricingPageShell from "../../components/admin/pricing/PricingPageShell.jsx";
import styles from "../../components/admin/Admin.module.css";
import { findServiceById, pricingServicePath } from "../../lib/adminSlugs.js";
import { useServicePricing } from "../../context/PricingContext.jsx";
import { formatSavedLabel } from "../../lib/format.js";
import ConfirmDeleteModal from "../../components/admin/pricing/ConfirmDeleteModal.jsx";

export default function AdminServiceLineItemEditPage() {
  const { serviceId, lineId } = useParams();
  const { services, setServices, save, saveService, lastSavedAt } = useServicePricing();
  const [newOptLabel, setNewOptLabel] = useState("");
  const [newOptPrice, setNewOptPrice] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);

  const service = useMemo(() => findServiceById(services, serviceId), [services, serviceId]);
  const line = useMemo(
    () => service?.detail?.lineItems?.find((l) => l.id === lineId) ?? null,
    [service, lineId],
  );

  if (!service) {
    return <Navigate to="/admin-dashboard/pricing" replace />;
  }
  if (!line) {
    return <Navigate to={pricingServicePath(service.id)} replace />;
  }

  const patchLine = (nextLine) => {
    setServices((prev) =>
      prev.map((s) =>
        s.id === service.id
          ? {
              ...s,
              detail: {
                ...s.detail,
                lineItems: (s.detail?.lineItems ?? []).map((x) => (x.id === line.id ? nextLine : x)),
              },
            }
          : s,
      ),
    );
  };

  const addOption = () => {
    const label = newOptLabel.trim() || "New tier";
    const price = Number(newOptPrice);
    patchLine({
      ...line,
      options: [
        ...(line.options ?? []),
        { id: `opt-${Date.now()}`, label, price: Number.isFinite(price) ? price : 0, unit: "", note: "" },
      ],
    });
    setNewOptLabel("");
    setNewOptPrice("");
  };

  return (
    <PricingPageShell
      title={line.name}
      subtitle={`Edit price tiers for ${service.name}`}
      backTo={pricingServicePath(service.id)}
      backLabel={`Back to ${service.name}`}
      savedLabel={formatSavedLabel(lastSavedAt)}
      onSave={save}
      saveLabel="Save changes"
    >
      <article className={styles.pricingPanel}>
        <div className={styles.pricingPanelBody}>
          <LineItemEditor
            line={line}
            onChange={patchLine}
            onDelete={() => setShowConfirm(true)}
            onAddOption={addOption}
            inlineAddOption
          />

          <ConfirmDeleteModal
            open={showConfirm}
            title="Delete Line Item"
            message={`Are you sure you want to delete this line item? This action cannot be undone.`}
            onCancel={() => setShowConfirm(false)}
            onConfirm={async () => {
              const updatedService = {
                ...service,
                detail: {
                  ...service.detail,
                  lineItems: (service.detail?.lineItems ?? []).filter((x) => x.id !== line.id),
                },
              };

              setServices((prev) =>
                prev.map((s) => (s.id === service.id ? updatedService : s))
              );

              await saveService(service.id, updatedService);

              setShowConfirm(false);
              window.history.back();
            }}
          />

          <div className={styles.pricingInlineForm}>
            <h4 className={styles.pricingSectionTitle}>Add price tier</h4>
            <div className={styles.pricingGrid2}>
              <input
                className={styles.input}
                placeholder="Tier name (e.g. Standard)"
                value={newOptLabel}
                onChange={(e) => setNewOptLabel(e.target.value)}
              />
              <input
                className={styles.input}
                inputMode="numeric"
                placeholder="Price (₹)"
                value={newOptPrice}
                onChange={(e) => setNewOptPrice(e.target.value)}
              />
            </div>
            <button type="button" className={styles.buttonPrimary} onClick={addOption}>
              Add tier
            </button>
          </div>
        </div>
      </article>
    </PricingPageShell>
  );
}
