import { useMemo, useState } from "react";
import { FaFloppyDisk, FaMagnifyingGlass, FaPlus } from "react-icons/fa6";
import styles from "../components/admin/Admin.module.css";
import { AGENCY_SERVICES } from "../lib/agencyServices.js";
import { useServicePricing } from "../context/PricingContext.jsx";
import { formatSavedLabel } from "../lib/format.js";
import ServicePriceList from "../components/admin/pricing/ServicePriceList.jsx";

export default function AdminServicePricePage() {
  const { services, setServices, save, saveService, lastSavedAt } = useServicePricing();
  const [query, setQuery] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [addName, setAddName] = useState("");

  const handleAddService = async () => {
    const name = addName.trim();
    if (!name) return;
    const id = name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const newService = {
      id,
      name,
      detail: { type: "digital_marketing", fixedPlansTitle: "Fixed Plans", alaCarteTitle: "A-la-carte", customSections: [] }
    };
    setServices((prev) => [...prev, newService]);
    setAddName("");
    setShowAdd(false);
    try {
      await saveService(id, newService);
    } catch (err) {
      console.error(err);
    }
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return services;
    return services.filter((s) => `${s.name} ${s.tagline}`.toLowerCase().includes(q));
  }, [query, services]);

  return (
    <section className={styles.adminPageSection}>
      <header className={styles.pricingPageHead}>
        <div className={styles.pageHeading}>
          <h2 className={styles.pageHeadingTitle}>Service pricing</h2>
          <p className={styles.pageHeadingSub}>
            Edit prices for each service category. Changes apply to public service pages after you save.
          </p>
          <p className={styles.pricingSaveStatus}>{formatSavedLabel(lastSavedAt)}</p>
        </div>
        <div className={styles.pricingPageActions}>
          <button type="button" className={styles.buttonGhost} onClick={() => setShowAdd(!showAdd)}>
            <FaPlus aria-hidden />
            Add Service
          </button>
          <button type="button" className={styles.buttonPrimary} onClick={save}>
            <FaFloppyDisk aria-hidden />
            Save all
          </button>
        </div>
      </header>

      <article className={styles.pricingPanel}>
        <div className={styles.pricingPanelBar}>
          <div className={styles.pricingPanelBarText}>
            <strong>{AGENCY_SERVICES.length} service categories</strong>
            <span>Click a service to view and edit all prices</span>
          </div>
          <label className={styles.pricingSearchWrap}>
            <FaMagnifyingGlass className={styles.pricingSearchIcon} aria-hidden />
            <input
              className={styles.pricingSearchInput}
              type="search"
              placeholder="Search services…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </label>
        </div>

        {showAdd && (
          <div style={{ padding: "1rem", borderBottom: "1px solid var(--slate-200)", background: "var(--slate-50)" }}>
            <div style={{ display: "flex", gap: "0.5rem", maxWidth: "400px" }}>
              <input
                className={styles.input}
                placeholder="Service name (e.g. SEO)"
                value={addName}
                onChange={(e) => setAddName(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") handleAddService(); }}
              />
              <button type="button" className={styles.buttonPrimary} onClick={handleAddService}>Add</button>
            </div>
          </div>
        )}

        <ServicePriceList services={filtered} />

        <footer className={styles.pricingPanelFooter}>
          <span className={styles.muted}>Open a service, edit line items, then save.</span>
          <button type="button" className={styles.buttonPrimary} onClick={save}>
            <FaFloppyDisk aria-hidden />
            Save all
          </button>
        </footer>
      </article>
    </section>
  );
}
