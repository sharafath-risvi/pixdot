// cspell:ignore componets
import { useEffect } from "react";
import ServicesSection from "../components/ServicesSection.jsx";

export default function Home() {
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, []);

  return (
    <main className="premium-stage min-h-screen w-full overflow-x-hidden">
      <div className="premium-orb premium-orb-a" aria-hidden />
      <div className="premium-orb premium-orb-b" aria-hidden />
      <div className="premium-orb premium-orb-c" aria-hidden />
      <div className="relative z-[1]">
        <ServicesSection />
      </div>
    </main>
  );
}
