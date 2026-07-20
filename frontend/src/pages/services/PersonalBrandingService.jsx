import { useEffect, useRef, useState } from "react";
import { useServicePricing } from "../../context/PricingContext.jsx";
import { formatInr } from "../../lib/format.js";
import ProposalSummaryPanel from "../../components/ProposalSummaryPanel.jsx";
import ServiceWorkspace from "./ServiceWorkspace.jsx";

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
    <ServiceWorkspace
      service={service}
      step={step}
      stepLabel={`Step ${step} of 4`}
      proposal={
        <>
          <ProposalSummaryPanel selectedList={selectedList} selectedTotal={selectedTotal} removeMultiService={removeMultiService} editMultiService={editMultiService} removeLineItem={removeLineItem} currentSelection={plan ? { serviceId: service.id, serviceName: service.name, lines: [{ label: plan.name, sub: "Selected plan", price: total }], total } : null} onClearCurrentSelection={() => { didInteractRef.current = true; setBundleId(null); }} />
          <div className="flex flex-wrap gap-2"><button type="button" onClick={() => setStep((s) => Math.max(1, s - 1))} className="btn-outline" disabled={step === 1}>Back</button>{step < 4 ? <button type="button" onClick={handleStepNext} className="btn-cta" disabled={(step === 1 && !hasSelection) || (step === 3 && !agreed)}>Next <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden><path fillRule="evenodd" d="M3 10a.75.75 0 01.75-.75h10.638L10.23 5.29a.75.75 0 111.04-1.08l5.5 5.25a.75.75 0 010 1.08l-5.5 5.25a.75.75 0 11-1.04-1.08l4.158-3.96H3.75A.75.75 0 013 10z" clipRule="evenodd" /></svg></button> : <a href={mailto} onClick={(e) => { if (!contactOk || !agreed || !hasSelection) e.preventDefault(); }} className={["btn-cta", !contactOk || !agreed || !hasSelection ? "is-disabled" : ""].join(" ")} aria-disabled={!contactOk || !agreed || !hasSelection}>Send</a>}</div>
        </>
      }
    >
      {step === 1 ? bundles.map((p) => <button key={p.id} type="button" onClick={() => { didInteractRef.current = true; setBundleId(bundleId === p.id ? null : p.id); }} className={["w-full rounded-2xl border p-4 text-left transition", bundleId === p.id ? "border-brand-500 bg-brand-50 shadow-sm" : "border-slate-200 bg-slate-50/60 hover:border-slate-300"].join(" ")}><div className="flex flex-wrap items-center justify-between gap-2"><span className="text-lg font-bold text-slate-900">{p.name}</span><span className="text-base font-bold text-brand-700">{formatInr(p.price)}</span></div><ul className="mt-2 list-inside list-disc text-sm text-slate-600">{(p.includes ?? []).map((line, idx) => <li key={`${p.id}-${idx}`}>{line}</li>)}</ul></button>) : null}
      {step === 2 ? <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">{activeLines.length > 0 ? <><p className="text-base font-bold text-slate-900">{activeLines[0].label}</p><ul className="mt-2 list-inside list-disc text-sm text-slate-600">{(plan?.includes ?? []).map((line) => <li key={line}>{line}</li>)}</ul><div className="mt-4 rounded-xl border border-brand-200 bg-brand-50 p-3"><p className="text-sm font-semibold text-brand-900">Need another service?</p><div className="mt-2 flex flex-wrap gap-2"><button type="button" onClick={() => onMultiDecision?.("yes", { serviceId: service.id, serviceName: service.name, lines: activeLines, total: activeTotal })} className="rounded-lg border border-brand-300 bg-white px-3 py-1.5 text-sm font-semibold text-brand-700 hover:bg-brand-100">Yes, add more</button><button type="button" onClick={() => onMultiDecision?.("no", { serviceId: service.id, serviceName: service.name, lines: activeLines, total: activeTotal })} className="btn-cta" style={{ flex: "0 0 auto", minHeight: "2.25rem", fontSize: "0.8125rem", padding: "0.4rem 0.75rem" }}>No, continue</button></div></div></> : <p className="text-sm text-slate-500">No plan selected.</p>}</div> : null}
      {step === 3 ? <label className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700"><input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} /><span>{d?.agreementText}</span></label> : null}
      {step === 4 ? <div className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><input value={clientName} onChange={(e) => setClientName(e.target.value)} placeholder="Your name" className="rounded-lg border border-slate-200 px-3 py-2 text-sm" /><input value={clientEmail} onChange={(e) => setClientEmail(e.target.value)} placeholder="Your email" type="email" className="rounded-lg border border-slate-200 px-3 py-2 text-sm" /><input value={clientPhone} onChange={(e) => setClientPhone(e.target.value)} placeholder="Your phone number" className="rounded-lg border border-slate-200 px-3 py-2 text-sm" /></div> : null}
    </ServiceWorkspace>
  );
}
