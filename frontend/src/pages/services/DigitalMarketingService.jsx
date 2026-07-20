// cspell:ignore customised
import { useEffect, useMemo, useRef, useState } from "react";
import { useServicePricing } from "../../context/PricingContext.jsx";
import { formatInr } from "../../lib/format.js";
import ProposalSummaryPanel from "../../components/ProposalSummaryPanel.jsx";
import ServiceWorkspace from "./ServiceWorkspace.jsx";

const computeDigitalMarketingState = (storedSelection, fixed, ala, ph) => {
  const lines = storedSelection?.lines || [];
  if (lines.length === 0) {
    return { mode: null, withContent: true, alaQty: {}, metaCount: 0 };
  }
  for (const line of lines) {
    if (line.mode === "page" || (ph && line.label === ph.name)) {
      return { mode: "page", withContent: true, alaQty: {}, metaCount: 0 };
    }
    const matchedPlan = (fixed || []).find((p) => p.id === line.mode || p.id === line.planId || p.name === line.label);
    if (matchedPlan) {
      return { mode: matchedPlan.id, withContent: true, alaQty: {}, metaCount: 0 };
    }
  }
  const nextAlaQty = {};
  let nextMetaCount = 0;
  let nextWithContent = true;
  for (const line of lines) {
    if (line.withContent !== undefined) {
      nextWithContent = Boolean(line.withContent);
    } else if (line.sub && line.sub.toLowerCase().includes("without content")) {
      nextWithContent = false;
    }
    if (line.isMeta || line.label?.startsWith("Meta ad setup")) {
      let c = line.count;
      if (c === undefined || c === null) {
        const match = line.label?.match(/Meta ad setup(?: x |\s+)(\d+)/i);
        c = match ? Number(match[1]) : 1;
      }
      nextMetaCount = c;
    } else {
      for (const item of (ala || [])) {
        if (line.itemId === item.id || line.label?.startsWith(item.name)) {
          let q = line.qty;
          if (q === undefined || q === null) {
            const regex = new RegExp(`${item.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?: x |\\s+)(\\d+)`, "i");
            const match = line.label?.match(regex);
            q = match ? Number(match[1]) : 1;
          }
          if (q > 0) {
            nextAlaQty[item.id] = q;
          }
        }
      }
    }
  }
  return { mode: "custom", withContent: nextWithContent, alaQty: nextAlaQty, metaCount: nextMetaCount };
};

export default function DigitalMarketingService({
  onMultiDecision,
  selectedList,
  selectedTotal,
  removeMultiService,
  editMultiService,
  removeLineItem,
}) {
  const { services } = useServicePricing();
  const service = services.find((s) => s.id === "digital-marketing");
  const d = service?.detail;
  const fixed = d?.fixedPlans ?? [];
  const ala = d?.alaCarte ?? [];
  const ph = d?.pageHandling;
  const metaUnit = d?.metaAdUnitPrice ?? 2499;
  const storedSelection = selectedList?.find((item) => item.serviceId === service?.id);
  const didInteractRef = useRef(false);

  const [mode, setMode] = useState(() => computeDigitalMarketingState(storedSelection, fixed, ala, ph).mode);
  const [withContent, setWithContent] = useState(() => computeDigitalMarketingState(storedSelection, fixed, ala, ph).withContent);
  const [alaQty, setAlaQty] = useState(() => computeDigitalMarketingState(storedSelection, fixed, ala, ph).alaQty);
  const [metaCount, setMetaCount] = useState(() => computeDigitalMarketingState(storedSelection, fixed, ala, ph).metaCount);
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
    const next = computeDigitalMarketingState(storedSelection, fixed, ala, ph);
    setMode((prev) => (prev === next.mode ? prev : next.mode));
    setWithContent((prev) => (prev === next.withContent ? prev : next.withContent));
    setAlaQty((prev) => (JSON.stringify(prev) === JSON.stringify(next.alaQty) ? prev : next.alaQty));
    setMetaCount((prev) => (prev === next.metaCount ? prev : next.metaCount));
  }, [storedSelection, fixed, ala, ph]);

  const qty = (id) => Math.max(0, alaQty[id] ?? 0);
  const updateQty = (id, delta) => {
    didInteractRef.current = true;
    setAlaQty((prev) => ({ ...prev, [id]: Math.max(0, (prev[id] ?? 0) + delta) }));
  };
  const plan = fixed.find((x) => x.id === mode);

  const { total, lines } = useMemo(() => {
    let t = 0;
    const out = [];
    if (plan) {
      t += plan.price;
      out.push({ mode: plan.id, planId: plan.id, label: plan.name, price: plan.price, sub: "With content (bundle)" });
    } else if (mode === "page" && ph) {
      t += ph.price;
      out.push({ mode: "page", label: ph.name, price: ph.price, sub: ph.description });
    } else if (mode === "custom") {
      for (const item of ala) {
        const q = Math.max(0, alaQty[item.id] ?? 0);
        if (!q) continue;
        const unit = withContent ? item.withContent : item.withoutContent;
        const amount = unit * q;
        t += amount;
        out.push({ mode: "custom", itemId: item.id, qty: q, withContent, label: `${item.name} x ${q}`, price: amount, sub: withContent ? "With content" : "Without content" });
      }
      if (metaCount > 0) {
        const m = metaCount * metaUnit;
        t += m;
        out.push({ mode: "custom", isMeta: true, count: metaCount, label: `Meta ad setup x ${metaCount}`, price: m, sub: "Custom plan" });
      }
    }
    return { total: t, lines: out };
  }, [plan, mode, ph, ala, alaQty, metaCount, metaUnit, withContent]);

  useEffect(() => {
    if (!service || !didInteractRef.current) return;
    if (lines.length > 0) {
      onMultiDecision?.("sync", { serviceId: service.id, serviceName: service.name, lines, total });
    } else {
      onMultiDecision?.("sync", { serviceId: service.id, lines: [], total: 0 });
    }
  }, [lines, total, service, onMultiDecision]);

  if (!service) return null;

  const hasStoredSelection = Boolean(storedSelection?.lines?.length > 0);
  const hasSelection = (!!mode && total > 0) || hasStoredSelection;
  const activeLines = lines.length > 0 ? lines : (storedSelection?.lines || []);
  const activeTotal = lines.length > 0 ? total : (storedSelection?.total || 0);
  const contactOk = clientName.trim() && clientEmail.trim() && clientPhone.trim();
  const body = `${service.name}\n\nClient details\nName: ${clientName || "(not provided)"}\nEmail: ${clientEmail || "(not provided)"}\nPhone: ${clientPhone || "(not provided)"}\n\n${lines.map((x) => `• ${x.label}: ${x.sub} — ${formatInr(x.price)}`).join("\n")}\n\nIndicative subtotal: ${formatInr(total)}\n`;
  const mailto = `mailto:${encodeURIComponent(d?.contactEmail ?? "hello@example.com")}?subject=${encodeURIComponent(`[${service.name}] Digital marketing enquiry`)}&body=${encodeURIComponent(body)}`;
  const handleStepNext = () => {
    if (step === 2 && hasSelection && onMultiDecision) {
      onMultiDecision("no", { serviceId: service.id, serviceName: service.name, lines: activeLines, total: activeTotal });
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
          <ProposalSummaryPanel selectedList={selectedList} selectedTotal={selectedTotal} removeMultiService={removeMultiService} editMultiService={editMultiService} removeLineItem={removeLineItem} currentSelection={{ serviceId: service.id, serviceName: service.name, lines, total }} onClearCurrentSelection={() => { didInteractRef.current = true; setMode(null); setAlaQty({}); setMetaCount(0); }} />
          <div className="flex flex-wrap gap-2"><button type="button" onClick={() => setStep((s) => Math.max(1, s - 1))} className="btn-outline" disabled={step === 1}>Back</button>{step < 4 ? <button type="button" onClick={handleStepNext} className="btn-cta" disabled={(step === 1 && !hasSelection) || (step === 3 && !agreed)}>Next <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden><path fillRule="evenodd" d="M3 10a.75.75 0 01.75-.75h10.638L10.23 5.29a.75.75 0 111.04-1.08l5.5 5.25a.75.75 0 010 1.08l-5.5 5.25a.75.75 0 11-1.04-1.08l4.158-3.96H3.75A.75.75 0 013 10z" clipRule="evenodd" /></svg></button> : <a href={mailto} onClick={(e) => { if (!contactOk || !agreed || !hasSelection) e.preventDefault(); }} className={["btn-cta", !contactOk || !agreed || !hasSelection ? "is-disabled" : ""].join(" ")} aria-disabled={!contactOk || !agreed || !hasSelection}>Send</a>}</div>
        </>
      }
    >
      {step === 1 ? (
        <div className="space-y-4">
          <div className="space-y-2">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Main plan</p>
            <div className="flex flex-wrap gap-2">
              {fixed.map((p) => <button key={p.id} type="button" onClick={() => { didInteractRef.current = true; setMode(mode === p.id ? null : p.id); }} className={["rounded-full border px-4 py-2 text-sm font-semibold transition", mode === p.id ? "border-brand-500 bg-brand-50 text-brand-900" : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"].join(" ")}>{p.name} — {formatInr(p.price)}</button>)}
              {ph ? <button type="button" onClick={() => { didInteractRef.current = true; setMode(mode === "page" ? null : "page"); }} className={["rounded-full border px-4 py-2 text-sm font-semibold transition", mode === "page" ? "border-brand-500 bg-brand-50 text-brand-900" : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"].join(" ")}>{ph.name} — {formatInr(ph.price)}</button> : null}
              <button type="button" onClick={() => { didInteractRef.current = true; setMode(mode === "custom" ? null : "custom"); }} className={["rounded-full border px-4 py-2 text-sm font-semibold transition", mode === "custom" ? "border-amber-500 bg-amber-50 text-amber-900" : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"].join(" ")}>Custom (ala carte)</button>
            </div>
          </div>
          {plan ? <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4 text-sm text-slate-600"><p className="font-semibold text-slate-800">Plan inclusions</p><ul className="mt-2 list-inside list-disc">{(plan.includes ?? []).map((line) => <li key={line}>{line}</li>)}</ul></div> : null}
          {mode === "custom" ? <div className="space-y-4 rounded-2xl border border-amber-200/80 bg-amber-50/30 p-4 sm:p-5"><div className="inline-flex rounded-lg border border-slate-200 bg-white p-0.5 text-xs font-semibold"><button type="button" onClick={() => { didInteractRef.current = true; setWithContent(true); }} className={["rounded-md px-3 py-1.5", withContent ? "bg-brand-600 text-white" : "text-slate-600"].join(" ")}>With content</button><button type="button" onClick={() => { didInteractRef.current = true; setWithContent(false); }} className={["rounded-md px-3 py-1.5", !withContent ? "bg-brand-600 text-white" : "text-slate-600"].join(" ")}>Without content</button></div><div className="space-y-2">{ala.map((item) => <div key={item.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-left text-sm"><span className="font-medium text-slate-800">{item.name}</span><div className="inline-flex items-center gap-2"><span className="text-sm font-bold text-slate-700">{formatInr(withContent ? item.withContent : item.withoutContent)}</span><button type="button" onClick={() => updateQty(item.id, -1)} className="h-7 w-7 rounded-md border border-slate-300">-</button><span className="w-8 text-center">{qty(item.id)}</span><button type="button" onClick={() => updateQty(item.id, 1)} className="h-7 w-7 rounded-md border border-slate-300">+</button></div></div>)}</div><div><label className="block text-sm font-semibold text-slate-800" htmlFor="meta-c">Meta ad setup count</label><input id="meta-c" type="number" min={0} inputMode="numeric" className="mt-1 w-full max-w-[12rem] rounded-lg border border-slate-200 px-3 py-2 text-sm" value={metaCount} onChange={(e) => { didInteractRef.current = true; setMetaCount(Math.max(0, Number(e.target.value) || 0)); }} /></div></div> : null}
        </div>
      ) : null}
      {step === 2 ? <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">{activeLines.length === 0 ? <p className="text-sm text-slate-500">No selection yet.</p> : <><ul className="space-y-2 text-sm text-slate-700">{activeLines.map((x, i) => <li key={i} className="flex justify-between gap-2 border-b border-slate-100 pb-2"><span>{x.label}</span><span>{formatInr(x.price)}</span></li>)}</ul><div className="mt-4 rounded-xl border border-brand-200 bg-brand-50 p-3"><p className="text-sm font-semibold text-brand-900">Need another service?</p><div className="mt-2 flex flex-wrap gap-2"><button type="button" onClick={() => onMultiDecision?.("yes", { serviceId: service.id, serviceName: service.name, lines: activeLines, total: activeTotal })} className="rounded-lg border border-brand-300 bg-white px-3 py-1.5 text-sm font-semibold text-brand-700 hover:bg-brand-100">Yes, add more</button><button type="button" onClick={() => onMultiDecision?.("no", { serviceId: service.id, serviceName: service.name, lines: activeLines, total: activeTotal })} className="btn-cta" style={{ flex: "0 0 auto", minHeight: "2.25rem", fontSize: "0.8125rem", padding: "0.4rem 0.75rem" }}>No, continue</button></div></div></>}</div> : null}
      {step === 3 ? <label className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700 flex items-start gap-3"><input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} /><span>{d?.agreementText}</span></label> : null}
      {step === 4 ? <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm grid gap-3"><input value={clientName} onChange={(e) => setClientName(e.target.value)} placeholder="Your name" className="rounded-lg border border-slate-200 px-3 py-2 text-sm" /><input value={clientEmail} onChange={(e) => setClientEmail(e.target.value)} placeholder="Your email" type="email" className="rounded-lg border border-slate-200 px-3 py-2 text-sm" /><input value={clientPhone} onChange={(e) => setClientPhone(e.target.value)} placeholder="Your phone number" className="rounded-lg border border-slate-200 px-3 py-2 text-sm" /></div> : null}
    </ServiceWorkspace>
  );
}
