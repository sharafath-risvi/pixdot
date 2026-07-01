import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useServicePricing } from "../../context/PricingContext.jsx";
import { formatInr } from "../../lib/format.js";
import ServiceDotMenu from "./ServiceDotMenu.jsx";
import ProposalSummaryPanel from "../../components/ProposalSummaryPanel.jsx";

const optionKey = (lineId, optionId) => `${lineId}::${optionId}`;

/**
 * Four-step quote wizard for services priced as line items with quantities
 * (packaging, website, and mobile app). Step 1: pick quantities, step 2:
 * preview + multi-service prompt, step 3: agreement, step 4: contact + email.
 */
export default function LineItemServicePage({
  serviceId,
  onMultiDecision,
  selectedList,
  selectedTotal,
  removeMultiService,
  editMultiService,
  removeLineItem,
}) {
  const { services } = useServicePricing();
  const service = services.find((s) => s.id === serviceId);
  const detail = service?.detail;
  const lineItems = detail?.lineItems ?? [];
  const didInteractRef = useRef(false);

  const [qtyByOption, setQtyByOption] = useState({});
  const [agreed, setAgreed] = useState(false);
  const [step, setStep] = useState(1);
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientPhone, setClientPhone] = useState("");

  useEffect(() => {
    didInteractRef.current = false;
    setQtyByOption({});
    setAgreed(false);
    setStep(1);
    setClientName("");
    setClientEmail("");
    setClientPhone("");
  }, [service?.id]);

  const { total, lines } = useMemo(() => {
    let sum = 0;
    const out = [];
    for (const row of lineItems) {
      for (const opt of row.options ?? []) {
        const qty = qtyByOption[optionKey(row.id, opt.id)] ?? 0;
        if (!qty) continue;
        const price = qty * opt.price;
        sum += price;
        out.push({
          label: `${row.name} - ${opt.label}`,
          sub: [opt.unit, `Qty ${qty}`, opt.note].filter(Boolean).join(" · "),
          price,
        });
      }
    }
    return { total: sum, lines: out };
  }, [lineItems, qtyByOption]);

  useEffect(() => {
    if (!service || !didInteractRef.current) return;
    if (lines.length > 0) {
      onMultiDecision?.("sync", { serviceId: service.id, serviceName: service.name, lines, total });
    } else {
      onMultiDecision?.("sync", { serviceId: service.id, lines: [], total: 0 });
    }
  }, [lines, total, service, onMultiDecision]);

  if (!service) return null;

  const bump = (lineId, optionId, delta) => {
    didInteractRef.current = true;
    setQtyByOption((prev) => {
      const k = optionKey(lineId, optionId);
      const next = Math.max(0, (prev[k] ?? 0) + delta);
      if (!next) {
        const { [k]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [k]: next };
    });
  };

  const hasSelection = lines.length > 0;
  const contactOk = clientName.trim() && clientEmail.trim() && clientPhone.trim();
  const selectionPayload = { serviceId: service.id, serviceName: service.name, lines, total };

  const body = `${service.name}\n\nClient details\nName: ${clientName || "(not provided)"}\nEmail: ${clientEmail || "(not provided)"}\nPhone: ${clientPhone || "(not provided)"}\n\n${lines.map((x) => `• ${x.label}: ${x.sub} — ${formatInr(x.price)}`).join("\n")}\n\nIndicative subtotal: ${formatInr(total)}\n`;
  const mailto = `mailto:${encodeURIComponent(detail?.contactEmail ?? "hello@example.com")}?subject=${encodeURIComponent(`[${service.name}] Price enquiry`)}&body=${encodeURIComponent(body)}`;

  const handleStepNext = () => {
    if (step === 2 && hasSelection && onMultiDecision) {
      onMultiDecision("no", selectionPayload);
      return;
    }
    setStep((s) => Math.min(4, s + 1));
  };

  return (
    <div className="p-2 sm:p-4 lg:p-5">
      <Link
        to="/"
        className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-slate-900 md:mb-6"
      >
        <span className="text-lg leading-none" aria-hidden>
          ←
        </span>
        Back
      </Link>
      <article className="relative w-full overflow-hidden rounded-3xl border border-slate-200/90 bg-white shadow-xl shadow-slate-200/50">
        <ServiceDotMenu />
        <div className="relative">
          <div className="aspect-[5/2] min-h-[120px] w-full sm:aspect-[4/1] sm:min-h-[150px]">
            <img src={service.image} alt={service.name} className="h-full w-full object-cover" />
          </div>
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/50 px-4 pb-4 pt-14 sm:px-8 sm:pb-6 sm:pt-20">
            <p className="text-[0.65rem] font-bold uppercase tracking-[0.28em] text-white/75">Service</p>
            <h1 className="mt-1 text-xl font-semibold uppercase leading-tight tracking-tight text-white sm:text-2xl md:text-3xl">
              {service.name}
            </h1>
            {service.tagline ? (
              <p className="mt-2 max-w-2xl text-sm font-medium leading-snug text-white/90 sm:text-base">
                {service.tagline}
              </p>
            ) : null}
          </div>
        </div>

        <div className="grid gap-5 border-t border-slate-100 p-3 sm:p-5 lg:grid-cols-5 lg:gap-8 lg:p-8">
          <div className="space-y-5 lg:col-span-3 lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto lg:pr-2">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs font-semibold text-slate-600">
              Step {step} of 4
            </div>

            {step === 1
              ? lineItems.map((row) => (
                  <div key={row.id} className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4 sm:p-5">
                    <h3 className="text-base font-bold text-slate-900">{row.name}</h3>
                    <div className="mt-3 space-y-2">
                      {(row.options ?? []).map((opt) => {
                        const qty = qtyByOption[optionKey(row.id, opt.id)] ?? 0;
                        return (
                          <div
                            key={opt.id}
                            className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2"
                          >
                            <div>
                              <p>{opt.label}</p>
                              <p className="text-xs font-semibold text-slate-600">{formatInr(opt.price)}</p>
                            </div>
                            <div className="inline-flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => bump(row.id, opt.id, -1)}
                                className="h-7 w-7 rounded-md border border-slate-300"
                              >
                                -
                              </button>
                              <span className="w-8 text-center">{qty}</span>
                              <button
                                type="button"
                                onClick={() => bump(row.id, opt.id, 1)}
                                className="h-7 w-7 rounded-md border border-slate-300"
                              >
                                +
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))
              : null}

            {step === 2 ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                {lines.length === 0 ? (
                  <p className="text-sm text-slate-500">No items selected.</p>
                ) : (
                  <>
                    <ul className="space-y-2 text-sm text-slate-700">
                      {lines.map((x, i) => (
                        <li key={i} className="flex justify-between gap-2 border-b border-slate-100 pb-2">
                          <span>{x.label}</span>
                          <span>{formatInr(x.price)}</span>
                        </li>
                      ))}
                    </ul>
                    <div className="mt-4 rounded-xl border border-violet-200 bg-violet-50 p-3">
                      <p className="text-sm font-semibold text-violet-900">Need another service?</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => onMultiDecision?.("yes", selectionPayload)}
                          className="rounded-lg border border-violet-300 bg-white px-3 py-1.5 text-sm font-semibold text-violet-700 hover:bg-violet-100"
                        >
                          Yes, add more
                        </button>
                        <button
                          type="button"
                          onClick={() => onMultiDecision?.("no", selectionPayload)}
                          className="rounded-lg bg-violet-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-violet-700"
                        >
                          No, continue
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ) : null}

            {step === 3 ? (
              <label className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} />
                <span>{detail?.agreementText}</span>
              </label>
            ) : null}

            {step === 4 ? (
              <div className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <input
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="Your name"
                  className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                />
                <input
                  value={clientEmail}
                  onChange={(e) => setClientEmail(e.target.value)}
                  placeholder="Your email"
                  type="email"
                  className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                />
                <input
                  value={clientPhone}
                  onChange={(e) => setClientPhone(e.target.value)}
                  placeholder="Your phone number"
                  className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                />
              </div>
            ) : null}
          </div>

          <div className="lg:col-span-2 lg:self-start">
            <div className="space-y-4 lg:sticky lg:top-20 lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto">
              <ProposalSummaryPanel
                selectedList={selectedList}
                selectedTotal={selectedTotal}
                removeMultiService={removeMultiService}
                editMultiService={editMultiService}
                removeLineItem={removeLineItem}
                currentSelection={{ serviceId: service.id, serviceName: service.name, lines, total }}
                onClearCurrentSelection={() => {
                  didInteractRef.current = true;
                  setQtyByOption({});
                }}
              />
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setStep((s) => Math.max(1, s - 1))}
                  className={[
                    "flex-1 rounded-xl border py-2.5 text-sm font-semibold",
                    step === 1
                      ? "cursor-not-allowed border-slate-200 text-slate-400"
                      : "border-slate-300 text-slate-700 hover:bg-slate-50",
                  ].join(" ")}
                  disabled={step === 1}
                >
                  Back
                </button>
                {step < 4 ? (
                  <button
                    type="button"
                    onClick={handleStepNext}
                    className={[
                      "flex-1 rounded-xl py-2.5 text-sm font-semibold text-white",
                      (step === 1 && !hasSelection) || (step === 3 && !agreed)
                        ? "cursor-not-allowed bg-slate-300"
                        : "bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700",
                    ].join(" ")}
                    disabled={(step === 1 && !hasSelection) || (step === 3 && !agreed)}
                  >
                    Next
                  </button>
                ) : (
                  <a
                    href={mailto}
                    onClick={(e) => {
                      if (!contactOk || !agreed || !hasSelection) e.preventDefault();
                    }}
                    className={[
                      "flex flex-1 items-center justify-center rounded-xl py-2.5 text-sm font-semibold text-white",
                      !contactOk || !agreed || !hasSelection
                        ? "cursor-not-allowed bg-slate-300"
                        : "bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700",
                    ].join(" ")}
                  >
                    Send
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </article>
    </div>
  );
}
