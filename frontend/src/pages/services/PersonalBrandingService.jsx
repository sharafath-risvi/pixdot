import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useServicePricing } from "../../context/PricingContext.jsx";
import { formatInr } from "../../lib/format.js";
import ServiceDotMenu from "./ServiceDotMenu.jsx";
import ProposalSummaryPanel from "../../components/ProposalSummaryPanel.jsx";

const computePersonalBrandingState = (storedSelection, bundles) => {
  const lines = storedSelection?.lines || [];
  if (lines.length === 0) return null;
  const line = lines[0];
  if (line.bundleId) return line.bundleId;
  const match = (bundles || []).find((b) => b.name === line.label || b.id === line.bundleId);
  return match ? match.id : null;
};

export default function PersonalBrandingService({
  onMultiDecision,
  selectedList,
  selectedTotal,
  removeMultiService,
  editMultiService,
  removeLineItem,
}) {
  const { services } = useServicePricing();
  const service = services.find((s) => s.id === "personal-branding");
  const d = service?.detail;
  const bundles = d?.bundles ?? [];
  const storedSelection = selectedList?.find((item) => item.serviceId === service?.id);
  const didInteractRef = useRef(false);
  const [bundleId, setBundleId] = useState(() => computePersonalBrandingState(storedSelection, bundles));
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
    const next = computePersonalBrandingState(storedSelection, bundles);
    setBundleId((prev) => (prev === next ? prev : next));
  }, [storedSelection, bundles]);

  const plan = bundles.find((x) => x.id === bundleId);
  const total = plan?.price ?? 0;

  useEffect(() => {
    if (!service || !didInteractRef.current) return;
    if (plan) {
      onMultiDecision?.("sync", { serviceId: service.id, serviceName: service.name, lines: [{ bundleId: plan.id, label: plan.name, sub: "Selected plan", price: total }], total });
    } else {
      onMultiDecision?.("sync", { serviceId: service.id, lines: [], total: 0 });
    }
  }, [plan, total, service, onMultiDecision]);

  if (!service) return null;
  const hasStoredSelection = Boolean(storedSelection?.lines?.length > 0);
  const hasSelection = !!plan || hasStoredSelection;
  const activeLines = plan ? [{ label: plan.name, sub: "Selected plan", price: total }] : (storedSelection?.lines || []);
  const activeTotal = plan ? total : (storedSelection?.total || 0);
  const contactOk = clientName.trim() && clientEmail.trim() && clientPhone.trim();
  const body = `${service.name}\n\nClient details\nName: ${clientName || "(not provided)"}\nEmail: ${clientEmail || "(not provided)"}\nPhone: ${clientPhone || "(not provided)"}\n\nPlan: ${plan?.name ?? "(none selected)"}\nPrice: ${formatInr(plan?.price ?? 0)}\n\nIncludes:\n${(plan?.includes ?? []).map((x) => `• ${x}`).join("\n")}\n`;
  const mailto = `mailto:${encodeURIComponent(d?.contactEmail ?? "hello@example.com")}?subject=${encodeURIComponent(`[${service.name}] ${plan?.name ?? "Enquiry"}`)}&body=${encodeURIComponent(body)}`;
  const handleStepNext = () => {
    if (step === 2 && hasSelection && onMultiDecision && activeLines.length > 0) {
      onMultiDecision("no", { serviceId: service.id, serviceName: service.name, lines: activeLines, total: activeTotal });
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
            {step === 1 ? bundles.map((p) => <button key={p.id} type="button" onClick={() => { didInteractRef.current = true; setBundleId(bundleId === p.id ? null : p.id); }} className={["w-full rounded-2xl border p-4 text-left transition", bundleId === p.id ? "border-violet-500 bg-violet-50 shadow-sm" : "border-slate-200 bg-slate-50/60 hover:border-slate-300"].join(" ")}><div className="flex flex-wrap items-center justify-between gap-2"><span className="text-lg font-bold text-slate-900">{p.name}</span><span className="text-base font-bold text-violet-700">{formatInr(p.price)}</span></div><ul className="mt-2 list-inside list-disc text-sm text-slate-600">{(p.includes ?? []).map((line, idx) => <li key={`${p.id}-${idx}`}>{line}</li>)}</ul></button>) : null}
            {step === 2 ? <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">{activeLines.length > 0 ? <><p className="text-base font-bold text-slate-900">{activeLines[0].label}</p><ul className="mt-2 list-inside list-disc text-sm text-slate-600">{(plan?.includes ?? []).map((line) => <li key={line}>{line}</li>)}</ul><div className="mt-4 rounded-xl border border-violet-200 bg-violet-50 p-3"><p className="text-sm font-semibold text-violet-900">Need another service?</p><div className="mt-2 flex flex-wrap gap-2"><button type="button" onClick={() => onMultiDecision?.("yes", { serviceId: service.id, serviceName: service.name, lines: activeLines, total: activeTotal })} className="rounded-lg border border-violet-300 bg-white px-3 py-1.5 text-sm font-semibold text-violet-700 hover:bg-violet-100">Yes, add more</button><button type="button" onClick={() => onMultiDecision?.("no", { serviceId: service.id, serviceName: service.name, lines: activeLines, total: activeTotal })} className="rounded-lg bg-violet-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-violet-700">No, continue</button></div></div></> : <p className="text-sm text-slate-500">No plan selected.</p>}</div> : null}
            {step === 3 ? <label className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700"><input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} /><span>{d?.agreementText}</span></label> : null}
            {step === 4 ? <div className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><input value={clientName} onChange={(e) => setClientName(e.target.value)} placeholder="Your name" className="rounded-lg border border-slate-200 px-3 py-2 text-sm" /><input value={clientEmail} onChange={(e) => setClientEmail(e.target.value)} placeholder="Your email" type="email" className="rounded-lg border border-slate-200 px-3 py-2 text-sm" /><input value={clientPhone} onChange={(e) => setClientPhone(e.target.value)} placeholder="Your phone number" className="rounded-lg border border-slate-200 px-3 py-2 text-sm" /></div> : null}
          </div>
          <div className="lg:col-span-2 lg:self-start"><div className="space-y-4 lg:sticky lg:top-20 lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto"><ProposalSummaryPanel selectedList={selectedList} selectedTotal={selectedTotal} removeMultiService={removeMultiService} editMultiService={editMultiService} removeLineItem={removeLineItem} currentSelection={plan ? { serviceId: service.id, serviceName: service.name, lines: [{ label: plan.name, sub: "Selected plan", price: total }], total } : null} onClearCurrentSelection={() => { didInteractRef.current = true; setBundleId(null); }} /><div className="flex flex-wrap gap-2"><button type="button" onClick={() => setStep((s) => Math.max(1, s - 1))} className={["flex-1 rounded-xl border py-2.5 text-sm font-semibold", step === 1 ? "cursor-not-allowed border-slate-200 text-slate-400" : "border-slate-300 text-slate-700 hover:bg-slate-50"].join(" ")} disabled={step === 1}>Back</button>{step < 4 ? <button type="button" onClick={handleStepNext} className={["flex-1 rounded-xl py-2.5 text-sm font-semibold text-white", (step === 1 && !hasSelection) || (step === 3 && !agreed) ? "cursor-not-allowed bg-slate-300" : "bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700"].join(" ")} disabled={(step === 1 && !hasSelection) || (step === 3 && !agreed)}>Next</button> : <a href={mailto} onClick={(e) => { if (!contactOk || !agreed || !hasSelection) e.preventDefault(); }} className={["flex flex-1 items-center justify-center rounded-xl py-2.5 text-sm font-semibold text-white", !contactOk || !agreed || !hasSelection ? "cursor-not-allowed bg-slate-300" : "bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700"].join(" ")}>Send</a>}</div></div></div>
        </div>
      </article>
    </div>
  );
}
