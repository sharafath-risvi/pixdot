import { Link } from "react-router-dom";
import services from "../data/servicesData.json";

export default function ServicesSection() {
  return (
    <section className="w-full bg-transparent">
      <div className="mx-auto w-full max-w-7xl px-4 py-24 sm:px-6 lg:px-8 sm:py-32">
        <header className="fade-up mb-16 flex flex-col gap-6 sm:mb-24 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-3xl">
            <p className="text-[0.7rem] font-semibold uppercase tracking-[0.28em] text-brand-500">
              Digital solutions services
            </p>
            <h2 className="mt-5 text-pretty font-sans text-4xl font-medium tracking-tightest text-ink sm:text-6xl sm:leading-[1.05]">
              Elevate your digital presence.
            </h2>
            <p className="mt-6 max-w-2xl text-base leading-relaxed text-ink-muted sm:text-lg sm:leading-8">
              Explore our premium services below. Each offering is crafted to accelerate your growth and deliver measurable results.
            </p>
          </div>
        </header>

        <div className="space-y-14 sm:space-y-20">
          {services.map((service, idx) => {
            const reverse = idx % 2 === 1;
            const image = service.image ?? "/vite.svg";
            const delayClass = `fade-up fade-up-delay-${Math.min(idx + 1, 5)}`;

            return (
              <article key={service.id} className={`service-card group ${delayClass}`}>
                <div className="service-card-glow" aria-hidden />
                <div className="service-card-shape service-card-shape-a" aria-hidden />
                <div className="service-card-shape service-card-shape-b" aria-hidden />
                <div className="service-card-glass" aria-hidden />

                <div className="relative z-[1] grid grid-cols-1 items-stretch gap-0 md:grid-cols-2">
                  <div
                    className={
                      reverse
                        ? "order-2 flex flex-col justify-center px-7 py-12 sm:px-12 sm:py-16"
                        : "order-2 flex flex-col justify-center px-7 py-12 sm:px-12 sm:py-16 md:order-1"
                    }
                  >
                    <p className="text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-ink-muted">
                      {service.options?.[0]?.label ?? "Service"}
                    </p>
                    <h3 className="mt-4 text-pretty font-sans text-3xl font-medium tracking-tightest text-ink sm:text-4xl sm:leading-[1.1]">
                      {service.name}
                    </h3>
                    <p className="mt-5 max-w-md text-sm leading-7 text-ink-muted sm:text-base sm:leading-8">
                      {service.tagline}
                    </p>

                    <div className="mt-11 flex flex-wrap gap-4">
                      <Link to={`/services/${service.id}`} className="btn-primary">
                        View details
                      </Link>
                    </div>
                  </div>

                  <div className={reverse ? "order-1 md:order-2" : "order-1"}>
                    <div className="service-media">
                      <div className="service-media-frame">
                        <img src={image} alt={service.name} loading="lazy" />
                        <div className="service-media-shine" aria-hidden />
                      </div>
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
