import { useCallback, useEffect, useMemo, useState } from "react";
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

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [serviceId, multiStep]);
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

  const handleMultiDecision = useCallback((decision, payload) => {
    if (!payload?.serviceId) return;
    setMultiSelections((prev) => {
      if (decision === "sync" || decision === "replace") {
        if (!payload.lines || payload.lines.length === 0) {
          if (!prev[payload.serviceId]) return prev;
          const { [payload.serviceId]: _, ...rest } = prev;
          return rest;
        }
        const existing = prev[payload.serviceId];
        if (existing && JSON.stringify(existing) === JSON.stringify(payload)) {
          return prev;
        }
        return { ...prev, [payload.serviceId]: payload };
      }
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
      const updated = {
        ...existing,
        ...payload,
        lines: mergedLines,
        total: mergedTotal,
      };
      if (existing && JSON.stringify(existing) === JSON.stringify(updated)) {
        return prev;
      }
      return {
        ...prev,
        [payload.serviceId]: updated,
      };
    });
    if (decision === "no") {
      setMultiStep("agreement");
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    }
    if (decision === "yes") {
      setMultiStep("service");
      navigate("/");
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    }
  }, [navigate]);

  const removeLineItem = useCallback((serviceId, lineIndex) => {
    setMultiSelections((prev) => {
      const existing = prev[serviceId];
      if (!existing || !existing.lines) return prev;
      const newLines = existing.lines.filter((_, idx) => idx !== lineIndex);
      if (newLines.length === 0) {
        const { [serviceId]: _, ...rest } = prev;
        return rest;
      }
      const newTotal = newLines.reduce((sum, item) => sum + (item.price ?? 0), 0);
      return {
        ...prev,
        [serviceId]: {
          ...existing,
          lines: newLines,
          total: newTotal,
        },
      };
    });
  }, []);

  const removeMultiService = useCallback((serviceIdToRemove) => {
    setMultiSelections((prev) => {
      if (!prev[serviceIdToRemove]) return prev;
      const { [serviceIdToRemove]: _, ...rest } = prev;
      return rest;
    });
  }, []);
  const editMultiService = useCallback((serviceIdToEdit) => {
    setMultiStep("service");
    navigate(`/services/${serviceIdToEdit}`);
  }, [navigate]);

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
        className="mt-8 inline-flex rounded-xl bg-brand-800 px-6 py-2.5 text-sm font-semibold text-white shadow-soft transition hover:bg-brand-900"
      >
        Back to home
      </Link>
    </div>
  ) : (
    <ServiceDetailContent
      key={service.id}
      service={service}
      onMultiDecision={handleMultiDecision}
      selectedList={selectedList}
      selectedTotal={selectedTotal}
      removeMultiService={removeMultiService}
      editMultiService={editMultiService}
      removeLineItem={removeLineItem}
    />
  );

  // Removed old mailto logic, using submitQuote via API.

  return (
    <div className="service-dashboard">
      <aside className="service-dashboard-sidebar scrollbar-hide">
        <div className="flex flex-col gap-4 p-4 sm:p-5">
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-800 transition hover:border-slate-300 hover:bg-white"
          >
            <FaHouse className="h-4 w-4 shrink-0 text-[#0a4174]" aria-hidden />
            Home
          </Link>

          <div className="rounded-2xl border border-line bg-white p-3 shadow-soft">
            <p className="mb-2 px-1 text-[0.65rem] font-bold uppercase tracking-[0.22em] text-slate-400">
              Services
            </p>
            <nav className="flex flex-col gap-1.5 pb-1" aria-label="All services">
              {services.map((s) => {
                const iconName = s.icon ?? defaultIconName;
                return (
                  <NavLink
                    key={s.id}
                    to={`/services/${s.id}`}
                    className="rounded-xl outline-none ring-brand-400 ring-offset-2 focus-visible:ring-2"
                  >
                    {({ isActive }) => (
                      <div
                        className={[
                          "group flex min-h-[3.2rem] items-center gap-2 rounded-xl border px-2.5 py-2 text-left text-sm font-medium transition-all duration-200",
                          isActive
                            ? "border-brand-700 bg-brand-50 text-brand-900 shadow-soft"
                            : "border-transparent bg-white text-slate-800 hover:border-slate-200 hover:bg-slate-100",
                        ].join(" ")}
                      >
                        <span
                          className={[
                            "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition",
                            isActive
                              ? "bg-[#0a4174] text-[#7bbde8]"
                              : "bg-slate-200 text-[#0a4174]",
                          ].join(" ")}
                        >
                          <ServiceIcon
                            name={iconName}
                            className="h-4 w-4 shrink-0"
                          />
                        </span>
                        <span className="min-w-0 flex-1 text-[13px] leading-snug text-inherit">{s.name}</span>
                      </div>
                    )}
                  </NavLink>
                );
              })}
            </nav>
          </div>
        </div>
      </aside>

      <div className="service-dashboard-main">
        {multiStep === "service" ? rightPanel : (
          <div className="scrollbar-hide h-full overflow-y-auto scroll-smooth p-3 sm:p-4 lg:p-5">
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
                              <p className="font-bold text-brand-700 text-sm">{formatInr(item.total)}</p>
                            </div>
                            {item.lines && item.lines.length > 0 && (
                              <ul className="mt-2 pl-2 space-y-1 text-xs text-slate-600 border-l-2 border-brand-300">
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
                      className={["btn-cta", !allAgreed || selectedList.length === 0 ? "is-disabled" : ""].join(" ")}
                      style={{ flex: "0 0 auto" }}
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
                    className="mt-6 rounded-xl bg-brand-800 px-6 py-2 text-sm font-semibold text-white shadow-soft transition hover:bg-brand-900"
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
                    <input value={clientName} onChange={(e) => setClientName(e.target.value)} placeholder="Your name" className={["w-full rounded-xl border px-4 py-2.5 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-brand-500/20", validationErrors.name ? "border-red-300 focus:border-red-500 focus:ring-red-500/20" : "border-slate-200 focus:border-brand-500"].join(" ")} />
                    {validationErrors.name && <p className="mt-1.5 text-xs font-medium text-red-500">{validationErrors.name}</p>}
                  </div>
                  <div>
                    <input value={clientEmail} onChange={(e) => setClientEmail(e.target.value)} placeholder="Your email" type="email" className={["w-full rounded-xl border px-4 py-2.5 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-brand-500/20", validationErrors.email ? "border-red-300 focus:border-red-500 focus:ring-red-500/20" : "border-slate-200 focus:border-brand-500"].join(" ")} />
                    {validationErrors.email && <p className="mt-1.5 text-xs font-medium text-red-500">{validationErrors.email}</p>}
                  </div>
                  <div>
                    <input value={clientPhone} onChange={(e) => setClientPhone(e.target.value)} placeholder="Your phone number" className={["w-full rounded-xl border px-4 py-2.5 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-brand-500/20", validationErrors.phone ? "border-red-300 focus:border-red-500 focus:ring-red-500/20" : "border-slate-200 focus:border-brand-500"].join(" ")} />
                    {validationErrors.phone && <p className="mt-1.5 text-xs font-medium text-red-500">{validationErrors.phone}</p>}
                  </div>
                  <div className="flex flex-wrap gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setMultiStep("agreement")}
                      disabled={isSubmitting}
                      className="btn-outline"
                      style={{ flex: "0 0 auto", minWidth: "7rem" }}
                    >
                      Back
                    </button>
                    <button
                      type="button"
                      onClick={submitQuote}
                      disabled={isSubmitting || selectedList.length === 0 || !allAgreed}
                      className="btn-cta"
                      style={{ flex: "0 0 auto", minWidth: "8rem" }}
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

function ServiceDetailContent({
  service,
  onMultiDecision,
  selectedList,
  selectedTotal,
  removeMultiService,
  editMultiService,
  removeLineItem,
}) {
  const commonProps = {
    onMultiDecision,
    selectedList,
    selectedTotal,
    removeMultiService,
    editMultiService,
    removeLineItem,
  };

  switch (service.id) {
    case "brand-creative":
      return <BrandingService {...commonProps} />;
    case "digital-marketing":
      return <DigitalMarketingService {...commonProps} />;
    case "personal-branding":
      return <PersonalBrandingService {...commonProps} />;
    case "packaging":
    case "website":
    case "app":
      return <LineItemServicePage serviceId={service.id} {...commonProps} />;
    default:
      return (
        <div className="p-4 sm:p-6 lg:p-8">
          <p className="text-slate-600">This service page is not configured.</p>
        </div>
      );
  }
}

