import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { filterToAgencyServices } from "../lib/agencyServices.js";
import defaultServices from "../data/serviceDetailsPricelist.json";

const canonicalDefaults = filterToAgencyServices(defaultServices);

const PricingContext = createContext(null);

export function PricingProvider({ children }) {
  const [services, setServicesState] = useState(canonicalDefaults);
  const [lastSavedAt, setLastSavedAt] = useState(null);

  // Fetch pricing from backend on mount
  const fetchPricing = useCallback(async () => {
    try {
      const api = (await import("../lib/api.js")).default;
      const res = await api.get("/api/pricing");
      if (res.data?.success && res.data?.data?.length > 0) {
        // Map backend _id or serviceId to id
        const mapped = res.data.data.map(s => ({ ...s, id: s.serviceId || s.id }));
        setServicesState(filterToAgencyServices(mapped));
      } else {
        // Fallback to canonical defaults if DB is empty
        setServicesState(canonicalDefaults);
      }
    } catch (err) {
      console.error("Failed to fetch pricing from backend:", err);
    }
  }, []);

  useEffect(() => {
    fetchPricing();
  }, [fetchPricing]);

  const setServices = useCallback((updater) => {
    setServicesState((prev) => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      return filterToAgencyServices(next);
    });
  }, []);

  // Save specific service to MongoDB
  const saveService = useCallback(async (serviceId, payloadOverride) => {
    try {
      const api = (await import("../lib/api.js")).default;
      const svc = payloadOverride || services.find((s) => s.id === serviceId);
      if (!svc) return;

      const payload = { ...svc, serviceId: svc.id };
      await api.put(`/api/pricing/${serviceId}`, payload);
      setLastSavedAt(Date.now());
    } catch (err) {
      console.error("Failed to save service:", err);
      throw err;
    }
  }, [services]);

  // Backward compatibility for Save section (bulk)
  const save = useCallback(async () => {
    try {
      const api = (await import("../lib/api.js")).default;
      await Promise.all(
        services.map((svc) => api.put(`/api/pricing/${svc.id}`, { ...svc, serviceId: svc.id }))
      );
      setLastSavedAt(Date.now());
    } catch (err) {
      console.error("Failed to save all services:", err);
    }
  }, [services]);

  const value = useMemo(
    () => ({ services, setServices, save, saveService, lastSavedAt }),
    [services, setServices, save, saveService, lastSavedAt],
  );

  return <PricingContext.Provider value={value}>{children}</PricingContext.Provider>;
}

export function useServicePricing() {
  const ctx = useContext(PricingContext);
  if (!ctx) throw new Error("useServicePricing must be used within PricingProvider");
  return ctx;
}
