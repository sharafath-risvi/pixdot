// cspell:ignore customised
import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useServicePricing } from "../../context/PricingContext.jsx";
import { formatInr } from "../../lib/format.js";
import ServiceDotMenu from "./ServiceDotMenu.jsx";
import ProposalSummaryPanel from "../../components/ProposalSummaryPanel.jsx";

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
  const didInteractRef = useRef(false);

  const [mode, setMode] = useState(null);
  const [withContent, setWithContent] = useState(true);
  const [alaQty, setAlaQty] = useState(() => ({}));
  const [metaCount, setMetaCount] = useState(0);
  const [agreed, setAgreed] = useState(false);
  const [step, setStep] = useState(1);
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientPhone, setClientPhone] = useState("");

  useEffect(() => {
    didInteractRef.current = false;
    setMode(null);
    setWithContent(true);
    setAlaQty({});
    setMetaCount(0);
    setAgreed(false);
    setStep(1);
    setClientName("");
    setClientEmail("");
    setClientPhone("");
  }, [service?.id]);

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
      out.push({ label: plan.name, price: plan.price, sub: "With content (bundle)" });
    } else if (mode === "page" && ph) {
      t += ph.price;
      out.push({ label: ph.name, price: ph.price, sub: ph.description });
    } else if (mode === "custom") {
      for (const item of ala) {
        const q = Math.max(0, alaQty[item.id] ?? 0);
        if (!q) continue;
        const unit = withContent ? item.withContent : item.withoutContent;
        const amount = unit * q;
        t += amount;
        out.push({ label: `${item.name} x ${q}`, price: amount, sub: withContent ? "With content" : "Without content" });
      }
      if (metaCount > 0) {
        const m = metaCount * metaUnit;
        t += m;
        out.push({ label: `Meta ad setup x ${metaCount}`, price: m, sub: "Custom plan" });
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

  const hasSelection = !!mode && total > 0;
  const contactOk = clientName.trim() && clientEmail.trim() && clientPhone.trim();
  const body = `${service.name}\n\nClient details\nName: ${clientName || "(not provided)"}\nEmail: ${clientEmail || "(not provided)"}\nPhone: ${clientPhone || "(not provided)"}\n\n${lines.map((x) => `• ${x.label}: ${x.sub} — ${formatInr(x.price)}`).join("\n")}\n\nIndicative subtotal: ${formatInr(total)}\n`;
  const mailto = `mailto:${encodeURIComponent(d?.contactEmail ?? "hello@example.com")}?subject=${encodeURIComponent(`[${service.name}] Digital marketing enquiry`)}&body=${encodeURIComponent(body)}`;
  const handleStepNext = () => {
    if (step === 2 && hasSelection && onMultiDecision) {
      onMultiDecision("no", { serviceId: service.id, serviceName: service.name, lines, total });
      return;
    }
    setStep((s) => Math.min(4, s + 1));
  };

  return (
    <div className="p-2 sm:p-4 lg:p-5">
      <Link to="/" className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-slate-900 md:mb-6"><span className="text-lg leading-none" aria-hidden>←</span>Back</Link>
      <article className="relative w-full overflow-hidden rounded-3xl border border-slate-200/90 bg-white shadow-xl shadow-slate-200/50">
        <ServiceDotMenu />
        <div className="relative">
          <div className="aspect-[5/2] min-h-[120px] w-full sm:aspect-[4/1] sm:min-h-[150px]">
            <img src={service.image} alt={service.name} className="h-full w-full object-cover" />
          </div>
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/50 px-4 pb-4 pt-14 sm:px-8 sm:pb-6 sm:pt-20">
            <p className="text-[0.65rem] font-bold uppercase tracking-[0.28em] text-white/75">Service</p>
            <h1 className="mt-1 text-xl font-semibold uppercase leading-tight tracking-tight text-white sm:text-2xl md:text-3xl">{service.name}</h1>
            {service.tagline ? <p className="mt-2 max-w-2xl text-sm font-medium leading-snug text-white/90 sm:text-base">{service.tagline}</p> : null}
          </div>
        </div>
        <div className="grid gap-5 border-t border-slate-100 p-3 sm:p-5 lg:grid-cols-5 lg:gap-8 lg:p-8">
          <div className="space-y-5 lg:col-span-3 lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto lg:pr-2">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs font-semibold text-slate-600">Step {step} of 4</div>
            {step === 1 ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Main plan</p>
                  <div className="flex flex-wrap gap-2">
                    {fixed.map((p) => <button key={p.id} type="button" onClick={() => { didInteractRef.current = true; setMode(mode === p.id ? null : p.id); }} className={["rounded-full border px-4 py-2 text-sm font-semibold transition", mode === p.id ? "border-violet-500 bg-violet-50 text-violet-900" : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"].join(" ")}>{p.name} — {formatInr(p.price)}</button>)}
                    {ph ? <button type="button" onClick={() => { didInteractRef.current = true; setMode(mode === "page" ? null : "page"); }} className={["rounded-full border px-4 py-2 text-sm font-semibold transition", mode === "page" ? "border-violet-500 bg-violet-50 text-violet-900" : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"].join(" ")}>{ph.name} — {formatInr(ph.price)}</button> : null}
                    <button type="button" onClick={() => { didInteractRef.current = true; setMode(mode === "custom" ? null : "custom"); }} className={["rounded-full border px-4 py-2 text-sm font-semibold transition", mode === "custom" ? "border-amber-500 bg-amber-50 text-amber-900" : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"].join(" ")}>Custom (ala carte)</button>
                  </div>
                </div>
                {plan ? <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4 text-sm text-slate-600"><p className="font-semibold text-slate-800">Plan inclusions</p><ul className="mt-2 list-inside list-disc">{(plan.includes ?? []).map((line) => <li key={line}>{line}</li>)}</ul></div> : null}
                {mode === "custom" ? <div className="space-y-4 rounded-2xl border border-amber-200/80 bg-amber-50/30 p-4 sm:p-5"><div className="inline-flex rounded-lg border border-slate-200 bg-white p-0.5 text-xs font-semibold"><button type="button" onClick={() => { didInteractRef.current = true; setWithContent(true); }} className={["rounded-md px-3 py-1.5", withContent ? "bg-violet-600 text-white" : "text-slate-600"].join(" ")}>With content</button><button type="button" onClick={() => { didInteractRef.current = true; setWithContent(false); }} className={["rounded-md px-3 py-1.5", !withContent ? "bg-violet-600 text-white" : "text-slate-600"].join(" ")}>Without content</button></div><div className="space-y-2">{ala.map((item) => <div key={item.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-left text-sm"><span className="font-medium text-slate-800">{item.name}</span><div className="inline-flex items-center gap-2"><span className="text-sm font-bold text-slate-700">{formatInr(withContent ? item.withContent : item.withoutContent)}</span><button type="button" onClick={() => updateQty(item.id, -1)} className="h-7 w-7 rounded-md border border-slate-300">-</button><span className="w-8 text-center">{qty(item.id)}</span><button type="button" onClick={() => updateQty(item.id, 1)} className="h-7 w-7 rounded-md border border-slate-300">+</button></div></div>)}</div><div><label className="block text-sm font-semibold text-slate-800" htmlFor="meta-c">Meta ad setup count</label><input id="meta-c" type="number" min={0} inputMode="numeric" className="mt-1 w-full max-w-[12rem] rounded-lg border border-slate-200 px-3 py-2 text-sm" value={metaCount} onChange={(e) => { didInteractRef.current = true; setMetaCount(Math.max(0, Number(e.target.value) || 0)); }} /></div></div> : null}
              </div>
            ) : null}
            {step === 2 ? <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">{lines.length === 0 ? <p className="text-sm text-slate-500">No selection yet.</p> : <><ul className="space-y-2 text-sm text-slate-700">{lines.map((x, i) => <li key={i} className="flex justify-between gap-2 border-b border-slate-100 pb-2"><span>{x.label}</span><span>{formatInr(x.price)}</span></li>)}</ul><div className="mt-4 rounded-xl border border-violet-200 bg-violet-50 p-3"><p className="text-sm font-semibold text-violet-900">Need another service?</p><div className="mt-2 flex flex-wrap gap-2"><button type="button" onClick={() => onMultiDecision?.("yes", { serviceId: service.id, serviceName: service.name, lines, total })} className="rounded-lg border border-violet-300 bg-white px-3 py-1.5 text-sm font-semibold text-violet-700 hover:bg-violet-100">Yes, add more</button><button type="button" onClick={() => onMultiDecision?.("no", { serviceId: service.id, serviceName: service.name, lines, total })} className="rounded-lg bg-violet-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-violet-700">No, continue</button></div></div></>}</div> : null}
            {step === 3 ? <label className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700 flex items-start gap-3"><input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} /><span>{d?.agreementText}</span></label> : null}
            {step === 4 ? <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm grid gap-3"><input value={clientName} onChange={(e) => setClientName(e.target.value)} placeholder="Your name" className="rounded-lg border border-slate-200 px-3 py-2 text-sm" /><input value={clientEmail} onChange={(e) => setClientEmail(e.target.value)} placeholder="Your email" type="email" className="rounded-lg border border-slate-200 px-3 py-2 text-sm" /><input value={clientPhone} onChange={(e) => setClientPhone(e.target.value)} placeholder="Your phone number" className="rounded-lg border border-slate-200 px-3 py-2 text-sm" /></div> : null}
          </div>
          <div className="lg:col-span-2 lg:self-start"><div className="space-y-4 lg:sticky lg:top-20 lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto"><ProposalSummaryPanel selectedList={selectedList} selectedTotal={selectedTotal} removeMultiService={removeMultiService} editMultiService={editMultiService} removeLineItem={removeLineItem} currentSelection={{ serviceId: service.id, serviceName: service.name, lines, total }} onClearCurrentSelection={() => { didInteractRef.current = true; setMode(null); setAlaQty({}); setMetaCount(0); }} /><div className="flex flex-wrap gap-2"><button type="button" onClick={() => setStep((s) => Math.max(1, s - 1))} className={["flex-1 rounded-xl border py-2.5 text-sm font-semibold", step === 1 ? "cursor-not-allowed border-slate-200 text-slate-400" : "border-slate-300 text-slate-700 hover:bg-slate-50"].join(" ")} disabled={step === 1}>Back</button>{step < 4 ? <button type="button" onClick={handleStepNext} className={["flex-1 rounded-xl py-2.5 text-sm font-semibold text-white", (step === 1 && !hasSelection) || (step === 3 && !agreed) ? "cursor-not-allowed bg-slate-300" : "bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700"].join(" ")} disabled={(step === 1 && !hasSelection) || (step === 3 && !agreed)}>Next</button> : <a href={mailto} onClick={(e) => { if (!contactOk || !agreed || !hasSelection) e.preventDefault(); }} className={["flex flex-1 items-center justify-center rounded-xl py-2.5 text-sm font-semibold text-white", !contactOk || !agreed || !hasSelection ? "cursor-not-allowed bg-slate-300" : "bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700"].join(" ")}>Send</a>}</div></div></div>
        </div>
      </article>
    </div>
  );
}
