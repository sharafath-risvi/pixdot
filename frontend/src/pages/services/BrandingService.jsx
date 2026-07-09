import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useServicePricing } from "../../context/PricingContext.jsx";
import { formatInr } from "../../lib/format.js";
import ServiceDotMenu from "./ServiceDotMenu.jsx";
import ProposalSummaryPanel from "../../components/ProposalSummaryPanel.jsx";

const getOptionKey = (lineId, optionId) => `${lineId}::${optionId}`;

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

function BackLink() {
  return (
    <Link
      to="/"
      className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-slate-900 md:mb-6"
    >
      <span className="text-lg leading-none" aria-hidden>
        ←
      </span>
      Back
    </Link>
  );
}

export default function BrandingService({
  onMultiDecision,
  selectedList,
  selectedTotal,
  removeMultiService,
  editMultiService,
  removeLineItem,
}) {
  const { services } = useServicePricing();
  const service = services.find((s) => s.id === "brand-creative");
  const d = service?.detail;
  const lineItems = d?.lineItems ?? [];
  const storedSelection = selectedList?.find((item) => item.serviceId === service?.id);
  const didInteractRef = useRef(false);
  const [qtyByOption, setQtyByOption] = useState(() =>
    computeQtyFromSelection(storedSelection, lineItems, getOptionKey)
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
    const next = computeQtyFromSelection(storedSelection, lineItems, getOptionKey);
    setQtyByOption((prev) => {
      if (JSON.stringify(prev) === JSON.stringify(next)) return prev;
      return next;
    });
  }, [storedSelection, lineItems]);

  const { total, displayLines } = useMemo(() => {
    let t = 0;
    const out = [];
    for (const row of lineItems) {
      for (const opt of row.options ?? []) {
        const q = qtyByOption[getOptionKey(row.id, opt.id)] ?? 0;
        if (q <= 0) continue;
        const amount = q * opt.price;
        t += amount;
        out.push({
          lineId: row.id,
          optionId: opt.id,
          qty: q,
          label: `${row.name} - ${opt.label}`,
          sub: [opt.unit, `Qty ${q}`, opt.note].filter(Boolean).join(" · "),
          price: amount,
        });
      }
    }
    return { total: t, displayLines: out };
  }, [lineItems, qtyByOption]);

  const body = useMemo(() => {
    const lines = displayLines.map((x) => `• ${x.label}: ${x.sub} — ${formatInr(x.price)}`).join("\n");
    return `${service?.name} — line items\n\nClient details\nName: ${clientName || "(not provided)"}\nEmail: ${clientEmail || "(not provided)"}\nPhone: ${clientPhone || "(not provided)"}\n\nSelected items\n${lines || "(none selected)"}\n\nIndicative subtotal: ${formatInr(total)}\n`;
  }, [clientEmail, clientName, clientPhone, displayLines, service?.name, total]);

  useEffect(() => {
    if (!service || !didInteractRef.current) return;
    if (displayLines.length > 0) {
      onMultiDecision?.("sync", { serviceId: service.id, serviceName: service.name, lines: displayLines, total });
    } else {
      onMultiDecision?.("sync", { serviceId: service.id, lines: [], total: 0 });
    }
  }, [displayLines, total, service, onMultiDecision]);

  if (!service) return null;

  const changeQty = (lineId, optionId, delta) => {
    didInteractRef.current = true;
    setQtyByOption((prev) => {
      const key = getOptionKey(lineId, optionId);
      const next = Math.max(0, Math.max(0, prev[key] ?? 0) + delta);
      if (next === 0) {
        const { [key]: _removed, ...rest } = prev;
        return rest;
      }
      return { ...prev, [key]: next };
    });
  };

  const email = d?.contactEmail ?? "hello@example.com";
  const mailto = `mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent(`[${service.name}] Price enquiry`)}&body=${encodeURIComponent(body)}`;
  const hasStoredSelection = Boolean(storedSelection?.lines?.length > 0);
  const hasSelection = displayLines.length > 0 || hasStoredSelection;
  const activeLines = displayLines.length > 0 ? displayLines : (storedSelection?.lines || []);
  const activeTotal = displayLines.length > 0 ? total : (storedSelection?.total || 0);
  const contactOk = clientName.trim() && clientEmail.trim() && clientPhone.trim();
  const handleStepNext = () => {
    if (step === 2 && hasSelection && onMultiDecision) {
      onMultiDecision("no", { serviceId: service.id, serviceName: service.name, lines: activeLines, total: activeTotal });
      return;
    }
    setStep((s) => Math.min(4, s + 1));
  };

  return (
    <div className="p-2 sm:p-4 lg:p-5">
      <BackLink />
      <article className="relative w-full overflow-hidden rounded-3xl border border-slate-200/90 bg-white shadow-xl shadow-slate-200/50">
        <ServiceDotMenu />
        <div className="relative">
          <div className="aspect-[5/2] min-h-[120px] w-full sm:aspect-[4/1] sm:min-h-[150px]"><img src={service.image} alt={service.name} className="h-full w-full object-cover" /></div>
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/50  px-4 pb-4 pt-14 sm:px-8 sm:pb-6 sm:pt-20">
            <p className="text-[0.65rem] font-bold uppercase tracking-[0.28em] text-white/75">Service</p>
            <h1 className="mt-1 text-xl font-semibold uppercase leading-tight tracking-tight text-white sm:text-2xl md:text-3xl">{service.name}</h1>
            {service.tagline ? <p className="mt-2 max-w-2xl text-sm font-medium leading-snug text-white/90 sm:text-base">{service.tagline}</p> : null}
          </div>
        </div>
        <div className="grid gap-5 border-t border-slate-100 p-3 sm:p-5 lg:grid-cols-5 lg:gap-8 lg:p-8">
          <div className="space-y-5 lg:col-span-3 lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto lg:pr-2">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs font-semibold text-slate-600">
              Step {step} of 4: {step === 1 ? "Choose items" : step === 2 ? "Preview" : step === 3 ? "Agreement" : "Contact & send"}
            </div>
            {step === 1 ? (
              <>
            {lineItems.map((row) => (
              <div key={row.id} className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4 sm:p-5">
                <div className="flex flex-wrap items-baseline justify-between gap-2"><h3 className="text-base font-bold text-slate-900">{row.name}</h3>{row.blurb ? <p className="text-xs text-slate-500 sm:text-right">{row.blurb}</p> : null}</div>
                <div className="mt-3 space-y-2">
                  {(row.options ?? []).map((opt) => {
                    const key = getOptionKey(row.id, opt.id);
                    const q = qtyByOption[key] ?? 0;
                    return (
                      <div key={opt.id} className={["flex flex-wrap items-center justify-between gap-3 rounded-xl border px-3 py-2 text-left text-sm font-medium transition", q > 0 ? "border-violet-500 bg-violet-50 text-violet-900 shadow-sm" : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"].join(" ")}>
                        <div><p>{opt.label}</p><p className="text-xs font-semibold text-slate-600">{formatInr(opt.price)}{opt.unit ? ` · ${opt.unit}` : ""}{opt.note ? ` · ${opt.note}` : ""}</p></div>
                        <div className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-2 py-1">
                          <button type="button" onClick={() => changeQty(row.id, opt.id, -1)} className="h-7 w-7 rounded-md border border-slate-300 text-sm font-bold text-slate-700 hover:bg-slate-100">-</button>
                          <span className="w-8 text-center text-sm font-semibold text-slate-900">{q}</span>
                          <button type="button" onClick={() => changeQty(row.id, opt.id, 1)} className="h-7 w-7 rounded-md border border-slate-300 text-sm font-bold text-slate-700 hover:bg-slate-100">+</button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
              </>
            ) : null}
            {step === 2 ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <h3 className="text-lg font-bold text-slate-900">Preview selected items</h3>
                {activeLines.length === 0 ? <p className="mt-2 text-sm text-slate-500">No items selected.</p> : <ul className="mt-4 space-y-2 text-sm text-slate-700">{activeLines.map((k, i) => <li key={i} className="flex justify-between gap-2 border-b border-slate-100 pb-2 last:border-0"><span><span className="font-medium text-slate-900">{k.label}</span>{k.sub ? <span className="mt-0.5 block text-xs text-slate-500">{k.sub}</span> : null}</span><span className="shrink-0 font-semibold text-slate-800">{formatInr(k.price)}</span></li>)}</ul>}
                {activeLines.length > 0 ? (
                  <div className="mt-4 rounded-xl border border-violet-200 bg-violet-50 p-3">
                    <p className="text-sm font-semibold text-violet-900">Need another service?</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          onMultiDecision?.("yes", { serviceId: service.id, serviceName: service.name, lines: activeLines, total: activeTotal })
                        }
                        className="rounded-lg border border-violet-300 bg-white px-3 py-1.5 text-sm font-semibold text-violet-700 hover:bg-violet-100"
                      >
                        Yes, add more
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          onMultiDecision?.("no", { serviceId: service.id, serviceName: service.name, lines: activeLines, total: activeTotal })
                        }
                        className="rounded-lg bg-violet-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-violet-700"
                      >
                        No, continue
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>
            ) : null}
            {step === 3 ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <h3 className="text-lg font-bold text-slate-900">Agreement</h3>
                <label className="mt-3 flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                  <input type="checkbox" className="mt-0.5 h-4 w-4 rounded border-slate-300 text-violet-600" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} />
                  <span>{d?.agreementText}</span>
                </label>
              </div>
            ) : null}
            {step === 4 ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <h3 className="text-lg font-bold text-slate-900">Contact details</h3>
                <div className="mt-4 grid gap-3">
                  <input value={clientName} onChange={(e) => setClientName(e.target.value)} placeholder="Your name" className="rounded-lg border border-slate-200 px-3 py-2 text-sm" />
                  <input value={clientEmail} onChange={(e) => setClientEmail(e.target.value)} placeholder="Your email" type="email" className="rounded-lg border border-slate-200 px-3 py-2 text-sm" />
                  <input value={clientPhone} onChange={(e) => setClientPhone(e.target.value)} placeholder="Your phone number" className="rounded-lg border border-slate-200 px-3 py-2 text-sm" />
                </div>
                <p className="mt-3 text-xs text-slate-500">After clicking send, your mail app opens with selected items + your contact details.</p>
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
                currentSelection={{ serviceId: service.id, serviceName: service.name, lines: displayLines, total }}
                onClearCurrentSelection={() => {
                  didInteractRef.current = true;
                  setQtyByOption({});
                }}
              />
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => setStep((s) => Math.max(1, s - 1))} className={["flex-1 rounded-xl border py-2.5 text-sm font-semibold", step === 1 ? "cursor-not-allowed border-slate-200 text-slate-400" : "border-slate-300 text-slate-700 hover:bg-slate-50"].join(" ")} disabled={step === 1}>Back</button>
                {step < 4 ? (
                  <button
                    type="button"
                    onClick={handleStepNext}
                    className={["flex-1 rounded-xl py-2.5 text-sm font-semibold text-white", (step === 1 && !hasSelection) || (step === 3 && !agreed) ? "cursor-not-allowed bg-slate-300" : "bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700"].join(" ")}
                    disabled={(step === 1 && !hasSelection) || (step === 3 && !agreed)}
                  >
                    Next
                  </button>
                ) : (
                  <a href={mailto} onClick={(e) => { if (!contactOk || !agreed || !hasSelection) e.preventDefault(); }} className={["flex flex-1 items-center justify-center rounded-xl py-2.5 text-sm font-semibold text-white", !contactOk || !agreed || !hasSelection ? "cursor-not-allowed bg-slate-300" : "bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700"].join(" ")} aria-disabled={!contactOk || !agreed || !hasSelection}>Send</a>
                )}
              </div>
            </div>
          </div>
        </div>
      </article>
    </div>
  );
}
