/**
 * Shared helpers for API services.
 * Backend envelope: { success, data?, message? }
 */

export function unwrapData(res) {
  return res?.data?.data;
}

export function unwrapMessage(res) {
  return res?.data?.message || "";
}

/** Normalize Mongo `_id` → `id` without dropping `_id`. */
export function withId(entity) {
  if (!entity || typeof entity !== "object") return entity;
  const id = entity.id ?? entity._id;
  return id != null ? { ...entity, id: String(id) } : { ...entity };
}

export function withIds(list) {
  return Array.isArray(list) ? list.map(withId) : [];
}

/**
 * User-facing message from axios/API errors (never dump raw stack).
 */
export function getErrorMessage(err, fallback = "Something went wrong. Please try again.") {
  const status = err?.response?.status;
  const apiMsg = err?.response?.data?.message;

  if (status === 401) return "Session expired. Please sign in again.";
  if (status === 403) return "You do not have permission for this action.";
  if (status === 404) return apiMsg || "Not found.";
  if (status === 409) return apiMsg || "Conflict — this record already exists.";
  if (status === 422 || status === 400) return apiMsg || "Please check your input and try again.";
  if (status >= 500) return "Server error. Please try again later.";

  if (typeof apiMsg === "string" && apiMsg.trim()) return apiMsg.trim();
  if (err?.code === "ERR_NETWORK") return "Network error. Check your connection.";
  return fallback;
}

export function isNotFound(err) {
  return err?.response?.status === 404;
}
