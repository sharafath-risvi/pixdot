import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useAuth } from "./AuthContext.jsx";
import { useWorkspace } from "./WorkspaceContext.jsx";
import { usePersonalNotes } from "../hooks/usePersonalNotes.js";

const NOTES_STORAGE_KEY = "lp_client_notes_v1";

const ClientPersonalContext = createContext(null);

export function ClientPersonalProvider({ children }) {
  const { role, clientId } = useAuth();
  const { clients } = useWorkspace();

  const [fetchedClient, setFetchedClient] = useState(null);

  useEffect(() => {
    if (role !== "client" || !clientId) return;
    const existing = clients.find((c) => c.id === clientId);
    if (existing) {
      setFetchedClient(existing);
      return;
    }
    
    // On refresh, 'clients' is empty for a client. Fetch their profile directly.
    import("../services/clientService.js").then(({ clientService }) => {
      clientService.getClientById(clientId)
        .then((data) => setFetchedClient(data))
        .catch((err) => console.error("Failed to load client profile:", err));
    });
  }, [role, clientId, clients]);

  const currentClient = fetchedClient;

  const { notes, addNote, updateNote, deleteNote, loading, error, clearError } = usePersonalNotes(NOTES_STORAGE_KEY, clientId, "cn");

  const value = useMemo(
    () => ({
      currentClient,
      clientId,
      notes,
      addNote,
      updateNote,
      deleteNote,
      loading,
      error,
      clearError,
    }),
    [currentClient, clientId, notes, addNote, updateNote, deleteNote, loading, error, clearError],
  );

  return <ClientPersonalContext.Provider value={value}>{children}</ClientPersonalContext.Provider>;
}

export function useClientPersonal() {
  const ctx = useContext(ClientPersonalContext);
  if (!ctx) throw new Error("useClientPersonal must be used within ClientPersonalProvider");
  return ctx;
}
