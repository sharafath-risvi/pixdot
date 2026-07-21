import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { FaEllipsisVertical, FaXmark } from "react-icons/fa6";
import services from "../../data/servicesData.json";

export default function ServiceDotMenu() {
  const [open, setOpen] = useState(false);
  const panelRef = useRef(null);
  const location = useLocation();

  const items = useMemo(
    () =>
      (services ?? []).map((s) => ({
        id: s.id,
        label: s.name,
        to: `/services/${s.id}`,
      })),
    [],
  );

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    const onDown = (e) => {
      if (!panelRef.current) return;
      if (panelRef.current.contains(e.target)) return;
      setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("pointerdown", onDown, { capture: true });
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("pointerdown", onDown, { capture: true });
    };
  }, [open]);

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  return (
    <>
      {/* Trigger stays on the banner */}
      <div className="absolute right-3 top-3 z-40 xl:hidden">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/95 text-slate-900 shadow-md shadow-black/15 ring-1 ring-black/5 backdrop-blur transition hover:bg-white"
          aria-label={open ? "Close services menu" : "Open services menu"}
          aria-expanded={open}
        >
          <FaEllipsisVertical className="h-4 w-4" />
        </button>
      </div>

      {/* Fixed overlay — sits above sticky rail / page content on mobile */}
      {open ? (
        <div
          className="fixed inset-0 z-[70] xl:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Services menu"
        >
          <button
            type="button"
            className="absolute inset-0 bg-slate-900/45 backdrop-blur-[2px]"
            aria-label="Close services menu"
            onClick={() => setOpen(false)}
          />

          <div
            ref={panelRef}
            className="absolute right-3 top-[4.75rem] flex max-h-[min(70vh,28rem)] w-[min(88vw,20rem)] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl shadow-black/25 ring-1 ring-black/10 sm:right-4 sm:top-[5rem]"
          >
            <div className="flex shrink-0 items-center justify-between border-b border-slate-200 px-4 py-3">
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-slate-500">Services</p>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-900 transition hover:bg-slate-200"
                aria-label="Close"
              >
                <FaXmark className="h-4 w-4" />
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-2">
              {items.map((it) => (
                <Link
                  key={it.id}
                  to={it.to}
                  onClick={() => {
                    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
                    document.querySelectorAll(".service-workspace, .service-dashboard-main .scrollbar-hide").forEach((el) => {
                      el.scrollTo({ top: 0, left: 0, behavior: "auto" });
                    });
                  }}
                  className={[
                    "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition",
                    location.pathname === it.to
                      ? "border border-brand-200 bg-brand-50 text-brand-900"
                      : "text-slate-800 hover:bg-slate-50",
                  ].join(" ")}
                >
                  {it.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
