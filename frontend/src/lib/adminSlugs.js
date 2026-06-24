export function toSlug(name) {
  return String(name || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function findClientBySlug(clients, slug) {
  if (!slug) return null;
  const normalized = slug.toLowerCase();
  return (
    clients.find((c) => toSlug(c.name) === normalized) ||
    clients.find((c) => c.id === slug) ||
    null
  );
}

export function findStaffBySlug(staffMembers, slug) {
  if (!slug) return null;
  const normalized = slug.toLowerCase();
  return (
    staffMembers.find((s) => toSlug(s.name) === normalized) ||
    staffMembers.find((s) => s.id === slug) ||
    null
  );
}

export function clientPath(client) {
  return `/admin-dashboard/client/${toSlug(client.name) || client.id}`;
}

export function staffClientPath(client) {
  return `/staff/client/${toSlug(client.name) || client.id}`;
}

export function staffPath(staff) {
  return `/admin-dashboard/staff/${toSlug(staff.name) || staff.id}`;
}

export function pricingPath() {
  return "/admin-dashboard/pricing";
}

export function pricingServicePath(serviceId) {
  return `${pricingPath()}/${serviceId}`;
}

export function pricingLinePath(serviceId, lineId) {
  return `${pricingServicePath(serviceId)}/line/${lineId}`;
}

export function findServiceById(services, serviceId) {
  if (!serviceId || !Array.isArray(services)) return null;
  return services.find((s) => s.id === serviceId) ?? null;
}
