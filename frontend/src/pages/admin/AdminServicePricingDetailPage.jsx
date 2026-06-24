import { useMemo, useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { FaArrowRight, FaPen, FaPlus } from "react-icons/fa6";
import styles from "../../components/admin/Admin.module.css";
import PricingPageShell from "../../components/admin/pricing/PricingPageShell.jsx";
import {
  findServiceById,
  pricingLinePath,
  pricingPath,
  pricingServicePath,
} from "../../lib/adminSlugs.js";
import { useServicePricing } from "../../context/PricingContext.jsx";
import { formatSavedLabel } from "../../lib/format.js";

function formatPrice(n) {
  const v = Number(n);
  if (!Number.isFinite(v)) return "—";
  return `₹${v.toLocaleString("en-IN")}`;
}

function lineItemSummary(line) {
  const options = line.options ?? [];
  if (!options.length) return "No price tiers yet";
  const prices = options.map((o) => Number(o.price)).filter(Number.isFinite);
  const min = prices.length ? Math.min(...prices) : 0;
  const max = prices.length ? Math.max(...prices) : 0;
  const range = min === max ? formatPrice(min) : `${formatPrice(min)} – ${formatPrice(max)}`;
  return `${options.length} tier${options.length === 1 ? "" : "s"} · ${range}`;
}

export default function AdminServicePricingDetailPage() {
  const { serviceId } = useParams();
  const navigate = useNavigate();
  const { services, setServices, save, lastSavedAt } = useServicePricing();
  const [addName, setAddName] = useState("");
  const [addBlurb, setAddBlurb] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);

  const service = useMemo(() => findServiceById(services, serviceId), [services, serviceId]);

  if (!service) {
    return <Navigate to={pricingPath()} replace />;
  }

  const isDigital = service?.detail?.type === "digital_marketing";
  const lineItems = service?.detail?.lineItems ?? [];
  const fixedPlans = service?.detail?.fixedPlans ?? [];
  const alaCarte = service?.detail?.alaCarte ?? [];

  const addLineItem = () => {
    const name = addName.trim();
    if (!name) return;
    const id = `line-${Date.now()}`;
    setServices((prev) =>
      prev.map((s) =>
        s.id === service.id
          ? {
              ...s,
              detail: {
                ...s.detail,
                lineItems: [...(s.detail?.lineItems ?? []), { id, name, blurb: addBlurb.trim(), options: [] }],
              },
            }
          : s,
      ),
    );
    setAddName("");
    setAddBlurb("");
    setShowAddForm(false);
    navigate(pricingLinePath(service.id, id));
  };

  return (
    <PricingPageShell
      title={service.name}
      subtitle={service.tagline || "Manage line items and price tiers for this service."}
      backTo={pricingPath()}
      backLabel="All services"
      savedLabel={formatSavedLabel(lastSavedAt)}
      onSave={save}
      saveLabel="Save service"
    >
      <article className={styles.pricingPanel}>
        <div className={styles.pricingServiceHero}>
          <div>
            <p className={styles.pricingServiceHeroLabel}>Service category</p>
            <h3>{service.name}</h3>
            {service.tagline ? <p>{service.tagline}</p> : null}
          </div>
          <Link to={`${pricingServicePath(service.id)}/settings`} className={styles.pricingHeroEditBtn}>
            <FaPen aria-hidden />
            Edit details
          </Link>
        </div>

        <div className={styles.pricingPanelBody}>
          {isDigital ? (
            <>
              <h4 className={styles.pricingSectionTitle}>Fixed plans</h4>
              <div className={styles.pricingItemGrid}>
                {fixedPlans.map((plan) => (
                  <Link
                    key={plan.id}
                    to={`${pricingServicePath(service.id)}/digital`}
                    className={styles.pricingItemCard}
                  >
                    <span className={styles.pricingItemCardTitle}>{plan.name}</span>
                    <span className={styles.pricingItemCardMeta}>{formatPrice(plan.price)}</span>
                    <span className={styles.pricingItemCardAction}>
                      Edit plan <FaArrowRight aria-hidden />
                    </span>
                  </Link>
                ))}
              </div>
              <h4 className={styles.pricingSectionTitle}>A-la-carte</h4>
              <div className={styles.pricingItemGrid}>
                {alaCarte.map((item) => (
                  <Link
                    key={item.id}
                    to={`${pricingServicePath(service.id)}/digital`}
                    className={styles.pricingItemCard}
                  >
                    <span className={styles.pricingItemCardTitle}>{item.name}</span>
                    <span className={styles.pricingItemCardMeta}>
                      With: {formatPrice(item.withContent)} · Without: {formatPrice(item.withoutContent)}
                    </span>
                    <span className={styles.pricingItemCardAction}>
                      Edit item <FaArrowRight aria-hidden />
                    </span>
                  </Link>
                ))}
              </div>
              <Link
                to={`${pricingServicePath(service.id)}/digital`}
                className={styles.pricingFullEditLink}
              >
                Open full digital marketing editor
                <FaArrowRight aria-hidden />
              </Link>
            </>
          ) : (
            <>
              <div className={styles.pricingPanelBarInner}>
                <strong>{lineItems.length} line items</strong>
                <span>Select a line to edit prices and tiers</span>
                <button
                  type="button"
                  className={styles.buttonGhost}
                  onClick={() => setShowAddForm((v) => !v)}
                >
                  <FaPlus aria-hidden />
                  Add line item
                </button>
              </div>

              {showAddForm ? (
                <div className={styles.pricingInlineForm}>
                  <input
                    className={styles.input}
                    placeholder="Line item name (e.g. Logo)"
                    value={addName}
                    onChange={(e) => setAddName(e.target.value)}
                  />
                  <input
                    className={styles.input}
                    placeholder="Short description (optional)"
                    value={addBlurb}
                    onChange={(e) => setAddBlurb(e.target.value)}
                  />
                  <div className={styles.pricingInlineFormActions}>
                    <button type="button" className={styles.buttonGhost} onClick={() => setShowAddForm(false)}>
                      Cancel
                    </button>
                    <button type="button" className={styles.buttonPrimary} onClick={addLineItem}>
                      Add & edit
                    </button>
                  </div>
                </div>
              ) : null}

              <div className={styles.pricingItemGrid}>
                {lineItems.map((line) => (
                  <Link
                    key={line.id}
                    to={pricingLinePath(service.id, line.id)}
                    className={styles.pricingItemCard}
                  >
                    <span className={styles.pricingItemCardTitle}>{line.name}</span>
                    <span className={styles.pricingItemCardMeta}>{lineItemSummary(line)}</span>
                    {line.blurb ? <p className={styles.pricingItemCardDesc}>{line.blurb}</p> : null}
                    <span className={styles.pricingItemCardAction}>
                      Edit & modify <FaArrowRight aria-hidden />
                    </span>
                  </Link>
                ))}
              </div>

              {lineItems.length === 0 && !showAddForm ? (
                <p className={styles.pricingGridEmptyState}>No line items yet. Add one to set prices.</p>
              ) : null}
            </>
          )}
        </div>

        <footer className={styles.pricingPanelFooter}>
          <span className={styles.muted}>Changes apply to the public site after you save.</span>
          <button type="button" className={styles.buttonPrimary} onClick={save}>
            Save all services
          </button>
        </footer>
      </article>
    </PricingPageShell>
  );
}
