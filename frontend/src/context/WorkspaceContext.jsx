import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useAuth } from "./AuthContext.jsx";

const WorkspaceContext = createContext(null);

export function WorkspaceProvider({ children }) {
  // Initial state for clients is an empty array until fetched from backend
  const [clients, setClients] = useState([]);
  const [clientsLoading, setClientsLoading] = useState(true);
  
  const [staffMembers, setStaffMembers] = useState([]);
  const [staffLoading, setStaffLoading] = useState(true);

  const [staffSalaryVisibleToSelf, setStaffSalaryVisibleToSelfState] = useState(true);

  const { isAuthenticated, role } = useAuth();

  // Fetch staff from backend
  const fetchStaff = useCallback(async () => {
    if (!isAuthenticated || role === "client") return;
    try {
      setStaffLoading(true);
      const api = (await import("../lib/api.js")).default;
      const response = await api.get("/staff");
      const fetchedStaff = response.data.data.map(s => ({...s, id: s._id}));
      setStaffMembers(fetchedStaff);
    } catch (err) {
      console.error("Failed to fetch staff from backend:", err);
    } finally {
      setStaffLoading(false);
    }
  }, [isAuthenticated, role]);

  // Fetch on auth change
  useEffect(() => {
    fetchStaff();
  }, [fetchStaff]);

  // Fetch clients from backend
  const fetchClients = useCallback(async () => {
    if (!isAuthenticated || role === "client") return;
    try {
      setClientsLoading(true);
      const api = (await import("../lib/api.js")).default;
      const response = await api.get("/clients");
      // Map MongoDB _id to id to match existing frontend code expectation
      const fetchedClients = response.data.data.map(c => ({...c, id: c._id}));
      setClients(fetchedClients);
    } catch (err) {
      console.error("Failed to fetch clients from backend:", err);
    } finally {
      setClientsLoading(false);
    }
  }, [isAuthenticated, role]);

  // Fetch on auth change
  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  // Fetch settings
  const fetchSettings = useCallback(async () => {
    if (!isAuthenticated || role !== "admin") return;
    try {
      const api = (await import("../lib/api.js")).default;
      const response = await api.get("/settings");
      if (response.data?.success && response.data?.data) {
        setStaffSalaryVisibleToSelfState(Boolean(response.data.data.staffSalaryVisibleToSelf));
      }
    } catch (err) {
      console.error("Failed to fetch settings:", err);
    }
  }, [isAuthenticated, role]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const setStaffSalaryVisibleToSelf = useCallback(async (value) => {
    try {
      // Optimistic update
      setStaffSalaryVisibleToSelfState(value);
      const api = (await import("../lib/api.js")).default;
      await api.put("/settings/staffSalaryVisibleToSelf", { value });
    } catch (err) {
      console.error("Failed to update setting:", err);
      // Revert on failure
      setStaffSalaryVisibleToSelfState(!value);
    }
  }, []);

  const updateClient = useCallback((clientId, patch) => {
    setClients((prev) => prev.map((c) => (c.id === clientId ? { ...c, ...patch } : c)));
  }, []);

  const updateStaffMember = useCallback((staffId, patch) => {
    setStaffMembers((prev) => prev.map((s) => (s.id === staffId ? { ...s, ...patch } : s)));
  }, []);

  const value = useMemo(
    () => ({
      clients,
      clientsLoading,
      fetchClients,
      updateClient,
      staffMembers,
      staffLoading,
      fetchStaff,
      setStaffMembers,
      updateStaffMember,
      staffSalaryVisibleToSelf,
      setStaffSalaryVisibleToSelf,
    }),
    [clients, clientsLoading, fetchClients, updateClient, staffMembers, staffLoading, fetchStaff, staffSalaryVisibleToSelf, setStaffSalaryVisibleToSelf, updateStaffMember],
  );

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}

export function useWorkspace() {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) throw new Error("useWorkspace must be used within WorkspaceProvider");
  return ctx;
}
