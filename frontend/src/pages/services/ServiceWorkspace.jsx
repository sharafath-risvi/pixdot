import { Link } from "react-router-dom";
import ServiceDotMenu from "./ServiceDotMenu.jsx";
import ServiceStickyRail from "./ServiceStickyRail.jsx";

/**
 * Third-image layout:
 * - Banner spans full width (center + right)
 * - Main area scrolls (banner leaves, yellow bar sticks)
 * - Proposal column sticky on the right with internal scroll
 * - Left sidebar stays fixed outside this workspace
 */
export default function ServiceWorkspace({
  service,
  step = 1,
  totalSteps = 4,
  stepLabel,
  children,
  proposal,
}) {
  return (
    <div className="service-workspace scrollbar-hide">
      <div className="p-2 sm:p-4 lg:p-5">
        <Link
          to="/"
          className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-slate-900 md:mb-6"
        >
          <span className="text-lg leading-none" aria-hidden>
            ←
          </span>
          Back
        </Link>

        <article className="relative w-full rounded-3xl border border-slate-200/90 bg-white shadow-xl shadow-slate-200/50">
          <ServiceDotMenu />

          {/* Full-width banner — extends across to the right edge */}
          <div className="relative overflow-hidden rounded-t-3xl">
            <div className="aspect-[5/2] min-h-[140px] w-full sm:aspect-[21/5] sm:min-h-[180px]">
              <img src={service.image} alt={service.name} className="h-full w-full object-cover" />
            </div>
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/55 px-4 pb-4 pt-14 sm:px-8 sm:pb-6 sm:pt-20">
              <p className="text-[0.65rem] font-bold uppercase tracking-[0.28em] text-white/75">Service</p>
              <h1 className="mt-1 text-xl font-semibold uppercase leading-tight tracking-tight text-white sm:text-2xl md:text-3xl">
                {service.name}
              </h1>
              {service.tagline ? (
                <p className="mt-2 max-w-3xl text-sm font-medium leading-snug text-white/90 sm:text-base">
                  {service.tagline}
                </p>
              ) : null}
            </div>
          </div>

          {/* Yellow bar — sticks when banner scrolls away */}
          <ServiceStickyRail serviceName={service.name} stepLabel={stepLabel} />

          <div className="grid gap-5 border-t border-slate-100 p-3 sm:p-5 lg:grid-cols-[minmax(0,1fr)_22rem] lg:gap-6 lg:p-6 xl:grid-cols-[minmax(0,1fr)_24rem] xl:gap-8 xl:p-8">
            <div className="min-w-0 space-y-5">{children}</div>

            <aside className="service-proposal-sticky scrollbar-hide">
              <div className="flex flex-col gap-4">{proposal}</div>
            </aside>
          </div>
        </article>
      </div>
    </div>
  );
}
