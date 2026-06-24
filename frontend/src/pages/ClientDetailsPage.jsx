import { useState } from "react";
import ClientDetails from "../components/admin/ClientDetails.jsx";
import styles from "../components/admin/Admin.module.css";

const dummyClients = [
  {
    id: "cd1",
    name: "Globe Logistics",
    logo: "https://via.placeholder.com/80x80.png?text=G",
    businessType: "Logistics",
    services: ["Branding", "Website", "Meta Ads"],
    coreValues: "Reliable and transparent",
    gstNumber: "33AAAAA1111A1Z1",
    phone: "9000033333",
    email: "globe@example.com",
    address: "Coimbatore",
  },
];

export default function ClientDetailsPage() {
  const [client] = useState(dummyClients[0]);

  return (
    <div className={styles.page}>
      <section className={styles.card}>
        <h1 className={styles.cardTitle}>Client Details Page</h1>
        <p className={styles.cardSub}>Standalone page for viewing client company profile.</p>
      </section>
      <ClientDetails client={client} />
    </div>
  );
}
