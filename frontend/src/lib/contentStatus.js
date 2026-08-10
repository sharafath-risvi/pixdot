/** Shared content calendar status config — single source of truth for UI colors/labels */

export const CONTENT_STATUS = {
  PENDING: "pending",
  COMPLETED: "completed",
  TEAM_ISSUES: "team_issues",
  WAITING_FOR_APPROVAL: "waiting_for_approval",
  APPROVAL_RECEIVED: "approval_received",
};

/** Legacy value still present in older MongoDB documents */
const LEGACY_ISSUE = "issue";

export const STATUS_OPTIONS = [
  { value: CONTENT_STATUS.PENDING, label: "Pending" },
  { value: CONTENT_STATUS.COMPLETED, label: "Completed" },
  { value: CONTENT_STATUS.TEAM_ISSUES, label: "Team Issues" },
  { value: CONTENT_STATUS.WAITING_FOR_APPROVAL, label: "Waiting for Approval" },
  { value: CONTENT_STATUS.APPROVAL_RECEIVED, label: "Approval Received" },
];

export const STATUS_COLORS = {
  [CONTENT_STATUS.PENDING]: "#FEF3C7",
  [CONTENT_STATUS.COMPLETED]: "#DCFCE7",
  [CONTENT_STATUS.TEAM_ISSUES]: "#FEE2E2",
  [CONTENT_STATUS.WAITING_FOR_APPROVAL]: "#DBEAFE",
  [CONTENT_STATUS.APPROVAL_RECEIVED]: "#EDE9FE",
  [LEGACY_ISSUE]: "#FEE2E2",
};

export const STATUS_BORDER_COLORS = {
  [CONTENT_STATUS.PENDING]: "#FCD34D",
  [CONTENT_STATUS.COMPLETED]: "#86EFAC",
  [CONTENT_STATUS.TEAM_ISSUES]: "#FCA5A5",
  [CONTENT_STATUS.WAITING_FOR_APPROVAL]: "#93C5FD",
  [CONTENT_STATUS.APPROVAL_RECEIVED]: "#C4B5FD",
  [LEGACY_ISSUE]: "#FCA5A5",
};

export const STATUS_LABELS = {
  [CONTENT_STATUS.PENDING]: "Pending",
  [CONTENT_STATUS.COMPLETED]: "Completed",
  [CONTENT_STATUS.TEAM_ISSUES]: "Team Issues",
  [CONTENT_STATUS.WAITING_FOR_APPROVAL]: "Waiting for Approval",
  [CONTENT_STATUS.APPROVAL_RECEIVED]: "Approval Received",
  [LEGACY_ISSUE]: "Team Issues",
};

export function normalizeStatus(status) {
  if (status === LEGACY_ISSUE) return CONTENT_STATUS.TEAM_ISSUES;
  if (STATUS_COLORS[status]) return status;
  return CONTENT_STATUS.PENDING;
}

export function getStatusColor(status) {
  return STATUS_COLORS[normalizeStatus(status)] || STATUS_COLORS.pending;
}

export function getStatusBorderColor(status) {
  return STATUS_BORDER_COLORS[normalizeStatus(status)] || STATUS_BORDER_COLORS.pending;
}

export function getStatusLabel(status) {
  return STATUS_LABELS[normalizeStatus(status)] || STATUS_LABELS.pending;
}

/** CSS module class name helper — returns key suffix used in Admin.module.css */
export function getStatusClassKey(status) {
  const s = normalizeStatus(status);
  const map = {
    pending: "dayPending",
    completed: "dayCompleted",
    team_issues: "dayTeamIssues",
    waiting_for_approval: "dayWaitingApproval",
    approval_received: "dayApprovalReceived",
  };
  return map[s] || "dayPending";
}

export const CONTENT_KINDS = ["Poster", "Reel", "Shoot", "Animation Reel", "Voice-Over Reel", "Creative", "Creative Ad"];
