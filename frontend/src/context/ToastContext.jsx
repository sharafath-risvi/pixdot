import { createContext, useContext, useState, useCallback } from "react";
import { FaCheckCircle, FaExclamationCircle, FaTimes, FaInfoCircle } from "react-icons/fa";
import styles from "./Toast.module.css";

const ToastContext = createContext(null);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = "info") => {
    const id = Date.now() + Math.random().toString(36).substr(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);

    // Auto remove after 4 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = {
    success: (message) => addToast(message, "success"),
    error: (message) => addToast(message, "error"),
    warning: (message) => addToast(message, "warning"),
    info: (message) => addToast(message, "info"),
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className={styles.toastContainer}>
        {toasts.map((t) => (
          <div key={t.id} className={`${styles.toast} ${styles[t.type]}`}>
            <div className={styles.toastIcon}>
              {t.type === "success" && <FaCheckCircle />}
              {t.type === "error" && <FaExclamationCircle />}
              {t.type === "warning" && <FaExclamationCircle />}
              {t.type === "info" && <FaInfoCircle />}
            </div>
            <div className={styles.toastContent}>
              <p className={styles.toastMessage}>{t.message}</p>
            </div>
            <button
              className={styles.toastClose}
              onClick={() => removeToast(t.id)}
              aria-label="Close"
            >
              <FaTimes />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};
