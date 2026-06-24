import { createContext, useContext, useMemo } from "react";
import { useAuth } from "./AuthContext.jsx";
import { useWorkspace } from "./WorkspaceContext.jsx";
import { usePersonalNotes } from "../hooks/usePersonalNotes.js";

const NOTES_STORAGE_KEY = "lp_client_notes_v1";

const ClientPersonalContext = createContext(null);

export function ClientPersonalProvider({ children }) {
  const { role, clientId } = useAuth();
  const { clients } = useWorkspace();

  const currentClient = useMemo(() => {
    if (role !== "client" || !clientId) return null;
    return clients.find((c) => c.id === clientId) ?? null;
  }, [role, clientId, clients]);

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
