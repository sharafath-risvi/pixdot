/** Canonical agency services — used on admin, staff, client, and public site. */
export const AGENCY_SERVICES = [
  { id: "brand-creative", name: "Branding & Creative" },
  { id: "packaging", name: "Packaging Design" },
  { id: "digital-marketing", name: "Digital Marketing" },
  { id: "personal-branding", name: "Personal Branding" },
  { id: "website", name: "Website Development" },
  { id: "app", name: "Mobile App Development" },
];

/** Map legacy / client-specific labels to a canonical service name. */
const LEGACY_SERVICE_NAME_MAP = {
  "Brand & creative": "Branding & Creative",
  Branding: "Branding & Creative",
  Design: "Branding & Creative",
  "Packaging design": "Packaging Design",
  "Digital marketing": "Digital Marketing",
  "Meta Ads": "Digital Marketing",
  "Performance Ads": "Digital Marketing",
  "Social Media": "Digital Marketing",
  Reels: "Digital Marketing",
  "Personal branding": "Personal Branding",
  "Website development": "Website Development",
  "Mobile app development": "Mobile App Development",
};

export function normalizeServiceName(name) {
  if (!name || typeof name !== "string") return "";
  const trimmed = name.trim();
  return LEGACY_SERVICE_NAME_MAP[trimmed] || trimmed;
}

/** Client services are stored either as plain names or as { serviceName, price } objects. */
export function serviceLabel(service) {
  return typeof service === "string" ? service : service?.serviceName || "";
}

export function filterToAgencyServices(services) {
  if (!Array.isArray(services)) return [];
  const byId = new Map(services.map((s) => [s.id, s]));
  return AGENCY_SERVICES.map(({ id, name }) => {
    const entry = byId.get(id);
    if (!entry) return null;
    return { ...entry, name };
  }).filter(Boolean);
}

function getServiceDefaultPrice(service) {
  const lineItems = service?.detail?.lineItems;
  if (!Array.isArray(lineItems) || !lineItems.length) return 0;
  const options = lineItems[0]?.options;
  if (!Array.isArray(options) || !options.length) return 0;
  return Number(options[0]?.price ?? 0);
}

export function buildServicePriceSettings(services) {
  return filterToAgencyServices(services).map((s) => ({
    serviceName: s.name,
    price: getServiceDefaultPrice(s),
  }));
}
