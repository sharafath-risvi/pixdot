import { normalizeServiceName, serviceLabel } from "./agencyServices.js";

function currentMonthKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function nextMonthKey() {
  const d = new Date();
  d.setMonth(d.getMonth() + 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function clientServiceNames(client) {
  const names = (client?.services || [])
    .map((s) => normalizeServiceName(serviceLabel(s)))
    .filter(Boolean);
  return [...new Set(names)];
}

export function buildServiceConfigFromClient(client, servicePriceSettings) {
  const settings = Array.isArray(servicePriceSettings) ? servicePriceSettings : [];
  const byName = new Map();

  for (const item of client?.services || []) {
    const name = normalizeServiceName(serviceLabel(item));
    if (!name) continue;
    byName.set(name, item);
  }

  return Object.fromEntries(
    settings.map((item) => {
      const existing = byName.get(item.serviceName);
      const currentPrice =
        typeof existing === "object" && existing?.currentPrice != null
          ? Number(existing.currentPrice)
          : Number(item.price || 0);
      return [item.serviceName, { currentPrice, nextMonthPrice: "" }];
    }),
  );
}

export function buildClientServicesPayload(servicesSelected, serviceConfig) {
  const nowMonth = currentMonthKey();
  const upcomingMonth = nextMonthKey();

  return servicesSelected.map((serviceName) => {
    const conf = serviceConfig[serviceName];
    const currentPrice = Number(conf?.currentPrice || 0);
    const nextPriceRaw = conf?.nextMonthPrice;
    const history = [{ month: nowMonth, price: currentPrice }];
    if (nextPriceRaw !== "" && Number(nextPriceRaw) >= 0) {
      history.push({ month: upcomingMonth, price: Number(nextPriceRaw) });
    }
    return {
      serviceName,
      currentPrice,
      priceHistory: history,
    };
  });
}

export function clientFormFromRecord(client) {
  return {
    name: client.name || "",
    logo: client.logo || "",
    businessType: client.businessType || "",
    gstNumber: client.gstNumber || "",
    phone: client.phone || "",
    email: client.email || "",
    address: client.address || "",
    coreValues: client.coreValues || "",
    portalUsername: client.portalUsername || "",
    portalPassword: client.portalPassword || "123456",
    servicesSelected: clientServiceNames(client),
  };
}
