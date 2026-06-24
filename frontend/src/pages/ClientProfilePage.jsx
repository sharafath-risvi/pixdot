import { Link } from "react-router-dom";
import { FiArrowLeft } from "react-icons/fi";
import ClientProfile from "../components/client/ClientProfile.jsx";
import styles from "../components/client/Client.module.css";

export default function ClientProfilePage() {
  return (
    <>
      <Link to="/client/dashboard" className={styles.clientBackLink}>
        <FiArrowLeft aria-hidden />
        Back to dashboard
      </Link>
      <ClientProfile />
    </>
  );
}
