import { createContext, useContext, useCallback } from "react";
import toast from "react-hot-toast";

const ToastContext = createContext(null);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
};

export const ToastProvider = ({ children }) => {
  const toastAPI = {
    success: (message) => toast.success(message),
    error: (message) => toast.error(message),
    warning: (message) => toast(message, { icon: '⚠️' }),
    info: (message) => toast(message, { icon: 'ℹ️' }),
  };

  return (
    <ToastContext.Provider value={toastAPI}>
      {children}
    </ToastContext.Provider>
  );
};
