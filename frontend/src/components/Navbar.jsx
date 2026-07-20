import { Link, NavLink, useLocation } from "react-router-dom";
import { PIXDOT_LOGO_URL } from "../lib/brand.js";

export default function Navbar() {
  const logoSrc = PIXDOT_LOGO_URL;
  const { pathname } = useLocation();
  const isHome = pathname === "/" || pathname === "/services";

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-white/60 bg-white/90 backdrop-blur-xl supports-[backdrop-filter]:bg-white/75">
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-brand-300/40 to-transparent" />
      <div className="mx-auto flex h-[4.25rem] max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link
          to="/"
          className="flex items-center text-ink transition duration-300 hover:opacity-90"
        >
          <img src={logoSrc} alt="Logo" className="h-14 w-auto max-w-[200px] object-contain" />
          <span className="sr-only">Home</span>
        </Link>

        <div className="flex items-center gap-2.5">
          {!isHome ? (
            <nav className="flex items-center gap-1.5" aria-label="Primary">
              <NavLink
                to="/"
                className="rounded-2xl px-4 py-2.5 text-sm font-semibold tracking-tight text-[#3a3a45] transition-all duration-300 hover:bg-white/80 hover:text-[#0e0e14] hover:shadow-soft"
              >
                Home
              </NavLink>
            </nav>
          ) : null}

          <Link
            to="/login"
            className="navbar-login-btn rounded-2xl border px-4 py-2.5 text-sm font-semibold tracking-tight shadow-soft transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_10px_28px_-10px_rgba(10,65,116,0.45)]"
          >
            Log in
          </Link>
        </div>
      </div>
    </header>
  );
}
