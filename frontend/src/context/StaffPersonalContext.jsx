import { createContext, useCallback, useContext, useMemo } from "react";
import { useAuth } from "./AuthContext.jsx";
import { useWorkspace } from "./WorkspaceContext.jsx";
import { usePersonalNotes } from "../hooks/usePersonalNotes.js";

const NOTES_STORAGE_KEY = "lp_staff_notes_v1";

const StaffPersonalContext = createContext(null);

export function StaffPersonalProvider({ children }) {
  const { role, staffUsername } = useAuth();
  const { staffMembers, updateStaffMember, staffSalaryVisibleToSelf } = useWorkspace();

  const currentStaff = useMemo(() => {
    if (role !== "staff" || !staffUsername) return null;
    const username = staffUsername.trim().toLowerCase();
    const member = staffMembers.find((m) => String(m.username || "").trim().toLowerCase() === username);
    if (member) {
      return { ...member, profileImage: member.profileImage ?? "", isVirtual: false };
    }
    // Logged-in staff without a workspace record (e.g. account removed by admin).
    return {
      id: `virtual-${username}`,
      name: staffUsername,
      email: "",
      phone: "",
      role: "Staff",
      salary: "",
      username,
      profileImage: "",
      isVirtual: true,
    };
  }, [role, staffUsername, staffMembers]);

  const staffNotesKey = currentStaff?.id ?? null;
  const { notes, addNote, updateNote, deleteNote, loading, error, clearError } = usePersonalNotes(NOTES_STORAGE_KEY, staffNotesKey, "note");

  const updateMyProfile = useCallback(
    (patch) => {
      if (!currentStaff?.id || currentStaff.isVirtual) return false;
      updateStaffMember(currentStaff.id, {
        phone: patch.phone != null ? String(patch.phone) : undefined,
        profileImage: patch.profileImage != null ? String(patch.profileImage) : undefined,
      });
      return true;
    },
    [currentStaff, updateStaffMember],
  );

  const showSalary = Boolean(staffSalaryVisibleToSelf && currentStaff?.salary);

  const value = useMemo(
    () => ({
      currentStaff,
      staffNotesKey,
      notes,
      addNote,
      updateNote,
      deleteNote,
      loading,
      error,
      clearError,
      updateMyProfile,
      showSalary,
    }),
    [currentStaff, staffNotesKey, notes, addNote, updateNote, deleteNote, loading, error, clearError, updateMyProfile, showSalary],
  );

  return <StaffPersonalContext.Provider value={value}>{children}</StaffPersonalContext.Provider>;
}

export function useStaffPersonal() {
  const ctx = useContext(StaffPersonalContext);
  if (!ctx) throw new Error("useStaffPersonal must be used within StaffPersonalProvider");
  return ctx;
}
