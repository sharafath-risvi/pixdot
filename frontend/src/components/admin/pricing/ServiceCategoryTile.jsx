import { useMemo } from "react";
import { Link } from "react-router-dom";
import { FaArrowRight } from "react-icons/fa6";
import { pricingServicePath } from "../../../lib/adminSlugs.js";
import styles from "../Admin.module.css";

export default function ServiceCategoryTile({ service }) {
  const isDigital = service?.detail?.type === "digital_marketing";
  const lineItems = service?.detail?.lineItems ?? [];

  const headerMeta = useMemo(() => {
    if (isDigital) {
      const plans = service.detail?.fixedPlans?.length ?? 0;
      const ala = service.detail?.alaCarte?.length ?? 0;
      return `${plans + ala} packages`;
    }
    const count = lineItems.length;
    return `${count} line item${count === 1 ? "" : "s"}`;
  }, [isDigital, lineItems.length, service.detail]);

  return (
    <Link to={pricingServicePath(service.id)} className={styles.serviceCategoryTile}>
      <div className={styles.serviceCategoryTileTop}>
        <span className={styles.serviceCategoryTileTitle}>{service.name}</span>
        <span className={styles.serviceCategoryTileMeta}>{headerMeta}</span>
      </div>
      {service.tagline ? <p className={styles.serviceCategoryTileDesc}>{service.tagline}</p> : null}
      <span className={styles.serviceCategoryTileHint}>
        Open service <FaArrowRight aria-hidden />
      </span>
    </Link>
  );
}
