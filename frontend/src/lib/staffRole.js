/** Format staff job-title / role for display */

const ROLE_LABELS = {
  designer: "Designer",
  video_editor: "Video Editor",
  "video editor": "Video Editor",
  team_manager: "Team Manager",
  "team manager": "Team Manager",
  director: "Director",
  client_manager: "Client Manager",
  "client manager": "Client Manager",
  freelancer: "Freelancer",
};

export function formatStaffRole(role) {
  if (!role || !String(role).trim()) return "—";
  const key = String(role).trim().toLowerCase().replace(/-/g, "_");
  if (ROLE_LABELS[key]) return ROLE_LABELS[key];
  // Title-case freeform values already stored as "Video Editor"
  return String(role)
    .trim()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function formatDisplayDate(isoDate) {
  if (!isoDate) return "—";
  const parts = String(isoDate).split("-").map(Number);
  if (parts.length !== 3) return isoDate;
  const d = new Date(parts[0], parts[1] - 1, parts[2]);
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}
