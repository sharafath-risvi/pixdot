/** Sticky yellow-bar header — matches first image: service name + step, sticks after banner scrolls away. */
export default function ServiceStickyRail({ serviceName, stepLabel }) {
  return (
    <div className="sticky top-0 z-30 border-b-2 border-[#E8B84A] bg-white/95 backdrop-blur-sm">
      <div className="px-3 py-3 sm:px-5 lg:px-8">
        <p className="text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-[#0a4174]">
          {serviceName}
        </p>
        <p className="mt-0.5 text-xs font-semibold text-slate-600 sm:text-sm">{stepLabel}</p>
      </div>
    </div>
  );
}
