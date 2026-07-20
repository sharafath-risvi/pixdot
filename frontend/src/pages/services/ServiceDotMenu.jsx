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

  return (
    <div className="absolute right-3 top-3 z-30 xl:hidden" ref={panelRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-slate-900 shadow-md shadow-black/10 ring-1 ring-black/5 backdrop-blur transition hover:bg-white"
        aria-label={open ? "Close services menu" : "Open services menu"}
        aria-expanded={open}
      >
        <FaEllipsisVertical className="h-4 w-4" />
      </button>

      {/* Panel opens from dot (not full screen) */}
      <div
        className={[
          "absolute right-0 top-12 z-40 w-[min(84vw,320px)] origin-top-right rounded-2xl bg-white shadow-2xl shadow-black/15 ring-1 ring-black/5",
          "transition-all duration-300 ease-out",
          open ? "pointer-events-auto opacity-100 translate-x-0 scale-100" : "pointer-events-none opacity-0 translate-x-6 scale-[0.98]",
        ].join(" ")}
        role="dialog"
        aria-label="Services menu"
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
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

        <div className="max-h-[60vh] overflow-auto p-2">
          {items.map((it) => (
            <Link
              key={it.id}
              to={it.to}
              className={[
                "flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-semibold transition",
                location.pathname === it.to ? "bg-brand-50 text-brand-900 border border-brand-200" : "text-slate-800 hover:bg-surface-muted",
              ].join(" ")}
            >
              {it.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

