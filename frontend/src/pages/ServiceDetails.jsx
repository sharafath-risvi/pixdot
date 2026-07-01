import { useEffect, useMemo, useState } from "react";
import { Link, NavLink, useNavigate, useParams } from "react-router-dom";
import { FaHouse } from "react-icons/fa6";
import ServiceIcon from "../components/ServiceIcon.jsx";
import BrandingService from "./services/BrandingService.jsx";
import DigitalMarketingService from "./services/DigitalMarketingService.jsx";
import PersonalBrandingService from "./services/PersonalBrandingService.jsx";
import LineItemServicePage from "./services/LineItemServicePage.jsx";
import { useServicePricing } from "../context/PricingContext.jsx";
import { formatInr } from "../lib/format.js";
import api from "../lib/api.js";
export default function ServiceDetails() {
  const { serviceId } = useParams();
  const navigate = useNavigate();
  const { services } = useServicePricing();
  const service = services.find((s) => s.id === serviceId);
  const defaultIconName = services[0]?.icon;
  const [multiSelections, setMultiSelections] = useState(() => {
    try {
      const saved = localStorage.getItem("pixdot_cart_selections") || sessionStorage.getItem("pixdot_cart_selections");
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  useEffect(() => {
    try {
      if (Object.keys(multiSelections).length > 0) {
        localStorage.setItem("pixdot_cart_selections", JSON.stringify(multiSelections));
        sessionStorage.setItem("pixdot_cart_selections", JSON.stringify(multiSelections));
      } else {
        localStorage.removeItem("pixdot_cart_selections");
        sessionStorage.removeItem("pixdot_cart_selections");
      }
    } catch (e) {
      console.error("Failed to save cart to storage", e);
    }
  }, [multiSelections]);

  const [multiStep, setMultiStep] = useState("service");
  const [allAgreed, setAllAgreed] = useState(false);
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [validationErrors, setValidationErrors] = useState({});

  const selectedList = useMemo(() => Object.values(multiSelections), [multiSelections]);
  const selectedTotal = useMemo(
    () => selectedList.reduce((sum, item) => sum + (item.total ?? 0), 0),
    [selectedList],
  );

  const getLineKey = (label, svcId) => {
    if (!label) return "";
    if (svcId === "personal-branding") return "personal-branding-bundle";
    if (svcId === "digital-marketing") {
      if (label.includes(" x ")) return label.split(" x ")[0].trim();
      if (label.includes(" - ")) return label.split(" - ")[0].trim();
      if (label === "With content (bundle)") return "digital-marketing-plan";
      return label.trim();
    }
    if (label.includes(" - ")) {
      return label.split(" - ")[0].trim();
    }
    if (label.includes(" x ")) {
      return label.split(" x ")[0].trim();
    }
    return label.trim();
  };

  const handleMultiDecision = (decision, payload) => {
    if (!payload?.serviceId) return;
    setMultiSelections((prev) => {
      const existing = prev[payload.serviceId];
      if (!existing || !existing.lines || existing.lines.length === 0) {
        return { ...prev, [payload.serviceId]: payload };
      }
      const newLines = payload.lines || [];
      const mergedLines = [...existing.lines];
      for (const newLine of newLines) {
        const key = getLineKey(newLine.label, payload.serviceId);
        const index = mergedLines.findIndex((item) => getLineKey(item.label, payload.serviceId) === key);
        if (index !== -1) {
          mergedLines[index] = newLine;
        } else {
          mergedLines.push(newLine);
        }
      }
      const mergedTotal = mergedLines.reduce((sum, item) => sum + (item.price ?? 0), 0);
      return {
        ...prev,
        [payload.serviceId]: {
          ...existing,
          ...payload,
          lines: mergedLines,
          total: mergedTotal,
        },
      };
    });
    if (decision === "no") {
      setMultiStep("agreement");
    }
  };

  const removeMultiService = (serviceIdToRemove) => {
    setMultiSelections((prev) => {
      const { [serviceIdToRemove]: _, ...rest } = prev;
      return rest;
    });
  };
  const editMultiService = (serviceIdToEdit) => {
    setMultiStep("service");
    navigate(`/services/${serviceIdToEdit}`);
  };

  const submitQuote = async () => {
    setValidationErrors({});
    setSubmitError("");
    
    let errs = {};
    if (!clientName.trim()) errs.name = "Name is required.";
    if (!clientEmail.trim() || !/^\S+@\S+\.\S+$/.test(clientEmail.trim())) errs.email = "Valid email is required.";
    if (!clientPhone.trim()) errs.phone = "Phone number is required.";
    
    if (Object.keys(errs).length > 0) {
      setValidationErrors(errs);
      return;
    }
    
    setIsSubmitting(true);
    try {
      const payload = {
        customerName: clientName.trim(),
        customerEmail: clientEmail.trim(),
        customerPhone: clientPhone.trim(),
        selectedServices: selectedList,
        totalPrice: selectedTotal,
      };
      
      const res = await api.post("/api/quotes", payload);
      if (res.data?.success) {
        setSubmitSuccess(true);
      } else {
        setSubmitError(res.data?.message || "Failed to submit quote request.");
      }
    } catch (err) {
      console.error(err);
      setSubmitError(err.response?.data?.message || "An error occurred while submitting.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const rightPanel = !service ? (
    <div className="flex min-h-[50vh] flex-col items-center justify-center px-6 text-center">
      <h1 className="text-2xl font-bold text-slate-900">Service not found</h1>
      <p className="mt-2 max-w-md text-slate-600">
        This service may have been removed or the link is invalid. Pick a service from the list.
      </p>
      <Link
        to="/"
        className="mt-8 inline-flex rounded-full bg-slate-900 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
      >
        Back to home
      </Link>
    </div>
  ) : (
    <ServiceDetailContent service={service} onMultiDecision={handleMultiDecision} />
  );

  // Removed old mailto logic, using submitQuote via API.

  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] w-full flex-col bg-slate-100/50 xl:flex-row">
      <aside className="hidden w-full shrink-0 border-b border-slate-200 bg-white xl:block xl:w-80 xl:min-h-0 xl:border-b-0 xl:border-r">
        <div className="z-10 flex flex-col gap-4 p-4 sm:p-5 xl:sticky xl:top-0 xl:max-h-[min(100vh-3.5rem,100%)]">
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-white"
          >
            <FaHouse className="h-4 w-4 shrink-0" aria-hidden />
            Home
          </Link>

          <div className="rounded-2xl border border-slate-200 bg-gradient-to-b from-slate-50 to-white p-3 shadow-sm">
            <p className="mb-2 px-1 text-[0.65rem] font-bold uppercase tracking-[0.22em] text-slate-400">
              Services
            </p>
            <nav className="flex flex-col gap-1.5 overflow-y-auto pb-2 pr-1 xl:max-h-[68vh]" aria-label="All services">
              {services.map((s) => {
                const iconName = s.icon ?? defaultIconName;
                return (
                  <NavLink
                    key={s.id}
                    to={`/services/${s.id}`}
                    className="rounded-xl outline-none ring-violet-400 ring-offset-2 focus-visible:ring-2"
                  >
                    {({ isActive }) => (
                      <div
                        className={[
                          "group flex min-h-[3.2rem] items-center gap-2 rounded-xl border px-2.5 py-2 text-left text-sm font-medium transition-all duration-200",
                          isActive
                            ? "border-slate-900 bg-slate-900 text-white shadow-md"
                            : "border-transparent bg-white text-slate-700 hover:border-slate-200 hover:bg-slate-100",
                        ].join(" ")}
                      >
                        <span
                          className={[
                            "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition",
                            isActive
                              ? "bg-white/15 text-white"
                                : "bg-slate-200 text-slate-800",
                          ].join(" ")}
                        >
                          <ServiceIcon
                            name={iconName}
                            className="h-4 w-4 shrink-0"
                          />
                        </span>
                        <span className="min-w-0 flex-1 text-[13px] leading-snug">{s.name}</span>
                      </div>
                    )}
                  </NavLink>
                );
              })}
            </nav>
            {selectedList.length > 0 ? (
              <div className="mt-3 rounded-xl border border-violet-200 bg-violet-50/70 p-2.5">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-violet-700">
                  Selected services
                </p>
                <ul className="mt-2 space-y-1.5 text-xs text-violet-900">
                  {selectedList.map((item) => (
                    <li key={item.serviceId} className="rounded-lg bg-white/80 p-2 shadow-sm">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold text-violet-950 truncate">{item.serviceName}</span>
                        <span className="inline-flex gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => editMultiService(item.serviceId)}
                            className="rounded-md border border-violet-200 px-1.5 py-0.5 text-[10px] font-semibold hover:bg-violet-100"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => removeMultiService(item.serviceId)}
                            className="rounded-md border border-violet-200 px-1.5 py-0.5 text-[10px] font-semibold hover:bg-violet-100"
                          >
                            Remove
                          </button>
                        </span>
                      </div>
                      {item.lines && item.lines.length > 0 && (
                        <ul className="mt-1.5 pl-1 space-y-1 text-[11px] text-violet-900 font-medium border-t border-violet-100/60 pt-1.5">
                          {item.lines.map((line, idx) => (
                            <li key={idx} className="flex items-center justify-between gap-2">
                              <span className="truncate">- {line.label}</span>
                              <span className="shrink-0 font-semibold">{formatInr(line.price)}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </li>
                  ))}
                </ul>
                <p className="mt-2 border-t border-violet-200 pt-2 text-sm font-bold text-violet-900">
                  Total: {formatInr(selectedTotal)}
                </p>
              </div>
            ) : null}
          </div>
        </div>
      </aside>

      <div className="min-w-0 flex-1 overflow-y-auto">
        {multiStep === "service" ? rightPanel : (
          <div className="p-3 sm:p-4 lg:p-5">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">
                Multi service checkout
              </p>
              {multiStep === "agreement" ? (
                <div className="mt-4 space-y-4">
                  <ul className="space-y-2">
                    {selectedList.map((item) => (
                      <li key={item.serviceId} className="rounded-xl border border-slate-200 p-3 shadow-sm">
                        <div className="flex items-start justify-between gap-3">
                          <div className="w-full min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <p className="font-bold text-slate-900 text-base">{item.serviceName}</p>
                              <p className="font-bold text-violet-700 text-sm">{formatInr(item.total)}</p>
                            </div>
                            {item.lines && item.lines.length > 0 && (
                              <ul className="mt-2 pl-2 space-y-1 text-xs text-slate-600 border-l-2 border-violet-300">
                                {item.lines.map((line, idx) => (
                                  <li key={idx} className="flex justify-between gap-2">
                                    <span className="truncate font-medium">- {line.label}</span>
                                    <span className="shrink-0 text-slate-800 font-semibold">{formatInr(line.price)}</span>
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>
                          <div className="inline-flex gap-1 shrink-0 ml-2">
                            <button
                              type="button"
                              onClick={() => editMultiService(item.serviceId)}
                              className="rounded-md border border-slate-200 px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => removeMultiService(item.serviceId)}
                              className="rounded-md border border-rose-200 px-2 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-50"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                  <label className="flex items-start gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
                    <input
                      type="checkbox"
                      checked={allAgreed}
                      onChange={(e) => setAllAgreed(e.target.checked)}
                      className="mt-0.5"
                    />
                    <span>I agree to proceed with all selected services and pricing discussion.</span>
                  </label>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setMultiStep("service")}
                      className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700"
                    >
                      Add more services
                    </button>
                    <button
                      type="button"
                      disabled={!allAgreed || selectedList.length === 0}
                      onClick={() => setMultiStep("contact")}
                      className={["rounded-xl px-4 py-2 text-sm font-semibold text-white", !allAgreed || selectedList.length === 0 ? "cursor-not-allowed bg-slate-300" : "bg-violet-600 hover:bg-violet-700"].join(" ")}
                    >
                      Continue
                    </button>
                  </div>
                </div>
              ) : submitSuccess ? (
                <div className="mt-4 flex flex-col items-center justify-center p-6 text-center">
                  <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-slate-900">Quote Request Submitted Successfully</h3>
                  <p className="mt-2 text-sm text-slate-600">
                    Thank you for contacting Pixdot.<br /><br />
                    Your enquiry has been submitted successfully.<br /><br />
                    Our team will contact you shortly.
                  </p>
                  <button
                    onClick={() => {
                      setSubmitSuccess(false);
                      setMultiStep("service");
                      setMultiSelections({});
                      setClientName("");
                      setClientEmail("");
                      setClientPhone("");
                      setAllAgreed(false);
                      try {
                        localStorage.removeItem("pixdot_cart_selections");
                        sessionStorage.removeItem("pixdot_cart_selections");
                      } catch {}
                    }}
                    className="mt-6 rounded-xl bg-slate-900 px-6 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
                  >
                    Done
                  </button>
                </div>
              ) : (
                <div className="mt-4 space-y-3">
                  {submitError && (
                    <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
                      {submitError}
                    </div>
                  )}
                  <div>
                    <input value={clientName} onChange={(e) => setClientName(e.target.value)} placeholder="Your name" className={["w-full rounded-xl border px-4 py-2.5 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-violet-500/20", validationErrors.name ? "border-red-300 focus:border-red-500 focus:ring-red-500/20" : "border-slate-200 focus:border-violet-500"].join(" ")} />
                    {validationErrors.name && <p className="mt-1.5 text-xs font-medium text-red-500">{validationErrors.name}</p>}
                  </div>
                  <div>
                    <input value={clientEmail} onChange={(e) => setClientEmail(e.target.value)} placeholder="Your email" type="email" className={["w-full rounded-xl border px-4 py-2.5 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-violet-500/20", validationErrors.email ? "border-red-300 focus:border-red-500 focus:ring-red-500/20" : "border-slate-200 focus:border-violet-500"].join(" ")} />
                    {validationErrors.email && <p className="mt-1.5 text-xs font-medium text-red-500">{validationErrors.email}</p>}
                  </div>
                  <div>
                    <input value={clientPhone} onChange={(e) => setClientPhone(e.target.value)} placeholder="Your phone number" className={["w-full rounded-xl border px-4 py-2.5 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-violet-500/20", validationErrors.phone ? "border-red-300 focus:border-red-500 focus:ring-red-500/20" : "border-slate-200 focus:border-violet-500"].join(" ")} />
                    {validationErrors.phone && <p className="mt-1.5 text-xs font-medium text-red-500">{validationErrors.phone}</p>}
                  </div>
                  <div className="flex flex-wrap gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setMultiStep("agreement")}
                      disabled={isSubmitting}
                      className="rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition-all hover:bg-slate-50 disabled:opacity-50"
                    >
                      Back
                    </button>
                    <button
                      type="button"
                      onClick={submitQuote}
                      disabled={isSubmitting || selectedList.length === 0 || !allAgreed}
                      className={["rounded-xl px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all", (isSubmitting || selectedList.length === 0 || !allAgreed) ? "cursor-not-allowed bg-slate-300" : "bg-gradient-to-b from-violet-500 to-violet-600 hover:from-violet-600 hover:to-violet-700 hover:shadow-md hover:-translate-y-0.5"].join(" ")}
                    >
                      {isSubmitting ? "Sending..." : "Send Mail"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ServiceDetailContent({ service, onMultiDecision }) {
  switch (service.id) {
    case "brand-creative":
      return <BrandingService onMultiDecision={onMultiDecision} />;
    case "digital-marketing":
      return <DigitalMarketingService onMultiDecision={onMultiDecision} />;
    case "personal-branding":
      return <PersonalBrandingService onMultiDecision={onMultiDecision} />;
    case "packaging":
    case "website":
    case "app":
      return <LineItemServicePage serviceId={service.id} onMultiDecision={onMultiDecision} />;
    default:
      return (
        <div className="p-4 sm:p-6 lg:p-8">
          <p className="text-slate-600">This service page is not configured.</p>
        </div>
      );
  }
}

