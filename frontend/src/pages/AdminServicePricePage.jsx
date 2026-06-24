import { useMemo, useState } from "react";
import { FaFloppyDisk, FaMagnifyingGlass } from "react-icons/fa6";
import styles from "../components/admin/Admin.module.css";
import { AGENCY_SERVICES } from "../lib/agencyServices.js";
import { useServicePricing } from "../context/PricingContext.jsx";
import { formatSavedLabel } from "../lib/format.js";
import ServicePriceList from "../components/admin/pricing/ServicePriceList.jsx";

export default function AdminServicePricePage() {
  const { services, save, lastSavedAt } = useServicePricing();
  const [query, setQuery] = useState("");

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
