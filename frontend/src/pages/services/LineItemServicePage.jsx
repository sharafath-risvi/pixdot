import { useEffect, useMemo, useRef, useState } from "react";
import { useServicePricing } from "../../context/PricingContext.jsx";
import { formatInr } from "../../lib/format.js";
import ProposalSummaryPanel from "../../components/ProposalSummaryPanel.jsx";
import ServiceWorkspace from "./ServiceWorkspace.jsx";

const optionKey = (lineId, optionId) => `${lineId}::${optionId}`;

const computeQtyFromSelection = (storedSelection, lineItems, getKey) => {
  const nextQty = {};
  const lines = storedSelection?.lines || [];
  for (const line of lines) {
    if (line.lineId && line.optionId && line.qty > 0) {
      nextQty[getKey(line.lineId, line.optionId)] = line.qty;
    } else {
      for (const row of (lineItems || [])) {
        for (const opt of (row.options ?? [])) {
          const expectedLabel = `${row.name} - ${opt.label}`;
          if (line.label === expectedLabel || line.label?.startsWith(expectedLabel)) {
            let q = line.qty;
            if (q === undefined || q === null) {
              const match = line.sub?.match(/Qty\s+(\d+)/i);
              q = match ? Number(match[1]) : (line.price && opt.price ? Math.round(line.price / opt.price) : 1);
            }
            if (q > 0) {
              nextQty[getKey(row.id, opt.id)] = q;
            }
          }
        }
      }
    }
  }
  return nextQty;
};

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
  const storedSelection = selectedList?.find((item) => item.serviceId === service?.id);
  const didInteractRef = useRef(false);

  const [qtyByOption, setQtyByOption] = useState(() =>
    computeQtyFromSelection(storedSelection, lineItems, optionKey)
  );
  const [agreed, setAgreed] = useState(false);
  const [step, setStep] = useState(1);
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientPhone, setClientPhone] = useState("");

  useEffect(() => {
    didInteractRef.current = false;
    setAgreed(false);
    setStep(1);
    setClientName("");
    setClientEmail("");
    setClientPhone("");
  }, [service?.id]);

  useEffect(() => {
    const next = computeQtyFromSelection(storedSelection, lineItems, optionKey);
    setQtyByOption((prev) => {
      if (JSON.stringify(prev) === JSON.stringify(next)) return prev;
      return next;
    });
  }, [storedSelection, lineItems]);

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
          lineId: row.id,
          optionId: opt.id,
          qty,
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

  const hasStoredSelection = Boolean(storedSelection?.lines?.length > 0);
  const hasSelection = lines.length > 0 || hasStoredSelection;
  const activeLines = lines.length > 0 ? lines : (storedSelection?.lines || []);
  const activeTotal = lines.length > 0 ? total : (storedSelection?.total || 0);
  const contactOk = clientName.trim() && clientEmail.trim() && clientPhone.trim();
  const selectionPayload = { serviceId: service.id, serviceName: service.name, lines: activeLines, total: activeTotal };

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
    <ServiceWorkspace
      service={service}
      step={step}
      stepLabel={`Step ${step} of 4`}
      proposal={
        <>
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
              className="btn-outline"
              disabled={step === 1}
            >
              Back
            </button>
            {step < 4 ? (
              <button
                type="button"
                onClick={handleStepNext}
                className="btn-cta"
                disabled={(step === 1 && !hasSelection) || (step === 3 && !agreed)}
              >
                Next
                <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
                  <path fillRule="evenodd" d="M3 10a.75.75 0 01.75-.75h10.638L10.23 5.29a.75.75 0 111.04-1.08l5.5 5.25a.75.75 0 010 1.08l-5.5 5.25a.75.75 0 11-1.04-1.08l4.158-3.96H3.75A.75.75 0 013 10z" clipRule="evenodd" />
                </svg>
              </button>
            ) : (
              <a
                href={mailto}
                onClick={(e) => {
                  if (!contactOk || !agreed || !hasSelection) e.preventDefault();
                }}
                className={["btn-cta", !contactOk || !agreed || !hasSelection ? "is-disabled" : ""].join(" ")}
                aria-disabled={!contactOk || !agreed || !hasSelection}
              >
                Send
              </a>
            )}
          </div>
        </>
      }
    >
      {step === 1
        ? lineItems.map((row) => (
            <div key={row.id} className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4 sm:p-5">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h3 className="text-base font-bold text-slate-900">{row.name}</h3>
                {row.blurb ? <p className="text-xs text-slate-500 sm:text-right">{row.blurb}</p> : null}
              </div>
              <div className="mt-3 space-y-2">
                {(row.options ?? []).map((opt) => {
                  const qty = qtyByOption[optionKey(row.id, opt.id)] ?? 0;
                  return (
                    <div
                      key={opt.id}
                      className={[
                        "flex flex-wrap items-center justify-between gap-3 rounded-xl border px-3 py-2 text-left text-sm font-medium transition",
                        qty > 0
                          ? "border-brand-500 bg-brand-50 text-brand-900 shadow-sm"
                          : "border-slate-200 bg-white text-slate-700 hover:border-slate-300",
                      ].join(" ")}
                    >
                      <div>
                        <p>{opt.label}</p>
                        <p className="text-xs font-semibold text-slate-600">
                          {formatInr(opt.price)}
                          {opt.unit ? ` · ${opt.unit}` : ""}
                          {opt.note ? ` · ${opt.note}` : ""}
                        </p>
                      </div>
                      <div className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-2 py-1">
                        <button
                          type="button"
                          onClick={() => bump(row.id, opt.id, -1)}
                          className="h-7 w-7 rounded-md border border-slate-300 text-sm font-bold text-slate-700 hover:bg-slate-100"
                        >
                          -
                        </button>
                        <span className="w-8 text-center text-sm font-semibold text-slate-900">{qty}</span>
                        <button
                          type="button"
                          onClick={() => bump(row.id, opt.id, 1)}
                          className="h-7 w-7 rounded-md border border-slate-300 text-sm font-bold text-slate-700 hover:bg-slate-100"
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
          {activeLines.length === 0 ? (
            <p className="text-sm text-slate-500">No items selected.</p>
          ) : (
            <>
              <ul className="space-y-2 text-sm text-slate-700">
                {activeLines.map((x, i) => (
                  <li key={i} className="flex justify-between gap-2 border-b border-slate-100 pb-2">
                    <span>{x.label}</span>
                    <span>{formatInr(x.price)}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-4 rounded-xl border border-brand-200 bg-brand-50 p-3">
                <p className="text-sm font-semibold text-brand-900">Need another service?</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => onMultiDecision?.("yes", selectionPayload)}
                    className="rounded-lg border border-brand-300 bg-white px-3 py-1.5 text-sm font-semibold text-brand-700 hover:bg-brand-100"
                  >
                    Yes, add more
                  </button>
                  <button
                    type="button"
                    onClick={() => onMultiDecision?.("no", selectionPayload)}
                    className="btn-cta"
                    style={{ flex: "0 0 auto", minHeight: "2.25rem", fontSize: "0.8125rem", padding: "0.4rem 0.75rem" }}
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
    </ServiceWorkspace>
  );
}
