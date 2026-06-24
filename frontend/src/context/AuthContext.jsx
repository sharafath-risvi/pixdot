import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { readJson, writeJson } from "../lib/storage.js";

const STORAGE_KEY = "lp_auth_v1";

const LOGGED_OUT = { 
  isAuthenticated: false, 
  role: null, 
  staffUsername: null, 
  clientId: null,
  staffId: null,
  userId: null,
  token: null
};

function readStoredAuth() {
  const stored = readJson(STORAGE_KEY);
  if (!stored || stored.isAuthenticated !== true) return LOGGED_OUT;

  const staffUsername =
    typeof stored.staffUsername === "string" && stored.staffUsername.trim()
      ? stored.staffUsername.trim().toLowerCase()
      : null;
  const clientId = typeof stored.clientId === "string" && stored.clientId.trim() ? stored.clientId.trim() : null;
  const staffId = typeof stored.staffId === "string" && stored.staffId.trim() ? stored.staffId.trim() : null;
  const userId = typeof stored.userId === "string" && stored.userId.trim() ? stored.userId.trim() : null;
  const token = typeof stored.token === "string" && stored.token.trim() ? stored.token.trim() : null;

  return {
    isAuthenticated: true,
    role: typeof stored.role === "string" ? stored.role : null,
    staffUsername,
    clientId,
    staffId,
    userId,
    token,
  };
}

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState(readStoredAuth);

  useEffect(() => {
    writeJson(STORAGE_KEY, auth);
  }, [auth]);

  const login = (payload) => {
    setAuth({
      isAuthenticated: true,
      role: payload.role,
      staffUsername: payload.role === "staff" ? payload.staffUsername : null,
      clientId: payload.clientId || null,
      staffId: payload.staffId || null,
      userId: payload.userId || null,
      token: payload.token || null,
    });
  };

  const logout = () => {
    setAuth(LOGGED_OUT);
  };

  const value = useMemo(() => ({ ...auth, login, logout }), [auth]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
