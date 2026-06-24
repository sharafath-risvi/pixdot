import ServiceCategoryTile from "./ServiceCategoryTile.jsx";
import styles from "../Admin.module.css";

export default function ServicePriceList({ services }) {
  if (services.length === 0) {
    return (
      <div className={styles.pricingGridEmptyState}>
        <p>No services match your search.</p>
      </div>
    );
  }

  return (
    <div className={styles.pricingGridServices}>
      {services.map((service) => (
        <div key={service.id} className={styles.pricingGridCell}>
          <ServiceCategoryTile service={service} />
        </div>
      ))}
    </div>
  );
}
