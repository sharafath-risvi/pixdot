import { Link } from "react-router-dom";
import services from "../data/servicesData.json";

export default function ServicesSection() {
  return (
    <section className="w-full bg-white">
      <div className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8 sm:py-24">
        <header className="mb-12 flex flex-col gap-4 sm:mb-16 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-sky-500">Our services</p>
            <h2 className="mt-3 text-pretty font-sans text-3xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
              Elevate your digital presence.
            </h2>
            <p className="mt-4 text-base leading-relaxed text-slate-600 sm:text-lg">
              Explore our premium services below. Each offering is crafted to accelerate your growth and deliver measurable results.
            </p>
          </div>
        </header>

        <div className="space-y-10 sm:space-y-14">
          {services.map((service, idx) => {
            const reverse = idx % 2 === 1;
            const bgFrom = service.pageBackground?.[0] ?? "#f8fafc";
            const bgTo = service.pageBackground?.[1] ?? "#ffffff";
            const image = service.image ?? "/vite.svg";

            return (
              <article
                key={service.id}
                className="overflow-hidden rounded-3xl border border-slate-200/70 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
                style={{ backgroundImage: `linear-gradient(135deg, ${bgFrom}, ${bgTo})` }}
              >
                <div className="grid grid-cols-1 items-center gap-0 md:grid-cols-2">
                  <div
                    className={
                      reverse
                        ? "order-2 px-5 py-8 sm:px-8 sm:py-10"
                        : "order-2 px-5 py-8 sm:px-8 sm:py-10 md:order-1"
                    }
                  >
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                      {service.options?.[0]?.label ?? "Service"}
                    </p>
                    <h3 className="mt-2 text-pretty font-sans text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                      {service.name}
                    </h3>
                    <p className="mt-3 text-sm leading-relaxed text-slate-600 sm:text-base">{service.tagline}</p>

                    <div className="mt-8 flex flex-wrap gap-4">
                      <Link
                        to={`/services/${service.id}`}
                        className="inline-flex items-center justify-center rounded-2xl bg-gradient-to-b from-slate-800 to-slate-900 px-6 py-3.5 text-sm font-semibold text-white shadow-md transition-all hover:from-slate-700 hover:to-slate-800 hover:shadow-lg hover:-translate-y-0.5"
                      >
                        View details
                      </Link>
                      <Link
                        to={`/services/${service.id}`}
                        className="inline-flex items-center justify-center rounded-2xl border border-slate-900/15 bg-white/40 px-6 py-3.5 text-sm font-semibold text-slate-900 shadow-sm backdrop-blur transition-all hover:bg-white/70 hover:shadow-md hover:-translate-y-0.5"
                      >
                        Get quote
                      </Link>
                    </div>
                  </div>

                  <div className={reverse ? "order-1 md:order-2" : "order-1"}>
                    <div className="relative h-[240px] w-full sm:h-[320px] md:h-[420px]">
                      <img
                        src={image}
                        alt={service.name}
                        className="absolute inset-0 h-full w-full object-cover"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-tr from-black/5 via-transparent to-white/20" />
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
