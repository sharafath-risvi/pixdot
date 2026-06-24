import { Link } from "react-router-dom";
import { FaArrowLeft, FaFloppyDisk } from "react-icons/fa6";
import { pricingPath } from "../../../lib/adminSlugs.js";
import styles from "../Admin.module.css";

export function PricingBackLink({ to, children }) {
  return (
    <Link to={to} className={styles.pricingBackLink}>
      <FaArrowLeft aria-hidden />
      {children}
    </Link>
  );
}

export default function PricingPageShell({
  title,
  subtitle,
  backTo,
  backLabel = "Back to pricing",
  savedLabel,
  onSave,
  saveLabel = "Save all",
  children,
}) {
  return (
    <section className={styles.adminPageSection}>
      <PricingBackLink to={backTo ?? pricingPath()}>{backLabel}</PricingBackLink>

      <header className={styles.pricingPageHead}>
        <div className={styles.pageHeading}>
          <h2 className={styles.pageHeadingTitle}>{title}</h2>
          {subtitle ? <p className={styles.pageHeadingSub}>{subtitle}</p> : null}
          {savedLabel ? <p className={styles.pricingSaveStatus}>{savedLabel}</p> : null}
        </div>
        {onSave ? (
          <div className={styles.pricingPageActions}>
            <button type="button" className={styles.buttonPrimary} onClick={onSave}>
              <FaFloppyDisk aria-hidden />
              {saveLabel}
            </button>
          </div>
        ) : null}
      </header>

      {children}
    </section>
  );
}
