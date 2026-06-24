import styles from "./Admin.module.css";
import { serviceLabel } from "../../lib/agencyServices.js";

export default function ClientDetails({ client }) {
  if (!client) {
    return (
      <section className={styles.card}>
        <h2 className={styles.cardTitle}>Client Details</h2>
        <p className={styles.cardSub}>Select a client from sidebar or client list.</p>
      </section>
    );
  }

  return (
    <section className={styles.card}>
      <div className={styles.row}>
        <div>
          <h2 className={styles.cardTitle}>{client.name}</h2>
          <p className={styles.cardSub}>Company and contact profile</p>
        </div>
        {client.logo ? <img src={client.logo} alt={client.name} className={styles.logo} /> : null}
      </div>
      <ul className={styles.detailsListStack}>
        <li className={styles.detailsItemStack}><strong>Name:</strong> {client.name}</li>
        <li className={styles.detailsItemStack}><strong>Phone:</strong> {client.phone}</li>
        <li className={styles.detailsItemStack}><strong>Email:</strong> {client.email}</li>
        <li className={styles.detailsItemStack}><strong>GST:</strong> {client.gstNumber}</li>
        <li className={styles.detailsItemStack}><strong>Address:</strong> {client.address}</li>
        <li className={styles.detailsItemStack}><strong>Business:</strong> {client.businessType}</li>
        <li className={styles.detailsItemStack}>
          <strong>Services:</strong> {(client.services || []).map(serviceLabel).filter(Boolean).join(", ")}
        </li>
      </ul>
    </section>
  );
}
