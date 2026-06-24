import { Link, NavLink } from "react-router-dom";
import { PIXDOT_LOGO_URL } from "../lib/brand.js";

export default function Navbar() {
  const logoSrc = PIXDOT_LOGO_URL;

  const linkClass = ({ isActive }) =>
    [
      "rounded-full px-3 py-2 text-sm font-semibold transition",
      isActive ? "bg-slate-900 text-white" : "text-slate-700 hover:bg-slate-100",
    ].join(" ");

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/90 bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link
          to="/"
          className="flex items-center text-slate-900 transition hover:opacity-90"
        >
          <img src={logoSrc} alt="Logo" className="h-14 w-auto max-w-[200px] object-contain" />
          <span className="sr-only">Home</span>
        </Link>

        <div className="flex items-center gap-2">
          <nav className="flex items-center gap-1.5" aria-label="Primary">
            <NavLink to="/" className={linkClass}>
              Home
            </NavLink>
          </nav>

          <Link
            to="/login"
            className="rounded-full border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-100"
          >
            Log in
          </Link>
        </div>
      </div>
    </header>
  );
}
