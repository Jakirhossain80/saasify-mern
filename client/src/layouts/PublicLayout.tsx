// FILE: client/src/layouts/PublicLayout.tsx
import { Outlet, useNavigate, NavLink } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useAuthStore } from "../store/auth.store";
import Footer from "../components/Footer";

export default function PublicLayout() {
  const nav = useNavigate();

  const user = useAuthStore((s) => s.user);
  const isBootstrapped = useAuthStore((s) => s.isBootstrapped);
  const { logout } = useAuth({ bootstrap: false });

  const isLoggedIn = !!user;

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    [
      "text-sm font-medium transition-colors",
      isActive
        ? "text-blue-600"
        : "text-slate-600 hover:text-blue-600",
    ].join(" ");

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 selection:bg-blue-100 selection:text-blue-700">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-blue-600 focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white focus:shadow-lg"
      >
        Skip to content
      </a>

      <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/80 backdrop-blur-md">
        <nav
          aria-label="Main Navigation"
          className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8"
        >
          <div className="flex h-16 items-center justify-between">
            {/* Brand */}
            <NavLink
              to="/"
              className="group flex items-center gap-2"
              aria-label="SaaSify Home"
            >
              <span className="text-2xl font-bold tracking-tight text-blue-600">
                SaaSify
              </span>
              <span className="hidden items-center rounded-full border border-blue-100 bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700 sm:inline-flex">
                MERN SaaS
              </span>
            </NavLink>

            {/* Desktop Links */}
            <div className="hidden items-center gap-8 md:flex">
              <NavLink to="/features" className={navLinkClass}>
                Features
              </NavLink>
              <NavLink to="/pricing" className={navLinkClass}>
                Pricing
              </NavLink>
              <NavLink to="/docs" className={navLinkClass}>
                Docs
              </NavLink>
              <NavLink to="/security" className={navLinkClass}>
                Security
              </NavLink>
              <NavLink to="/contact" className={navLinkClass}>
                Contact
              </NavLink>
            </div>

            {/* Desktop CTAs */}
            <div className="hidden items-center gap-3 md:flex">
              {!isBootstrapped ? (
                <div className="h-9 w-28 animate-pulse rounded-xl bg-slate-100" />
              ) : isLoggedIn ? (
                <>
                  <button
                    type="button"
                    onClick={() => nav("/select-tenant")}
                    className="rounded-xl px-4 py-2 text-sm font-medium text-slate-600 transition-all hover:text-slate-900"
                  >
                    Dashboard
                  </button>

                  <button
                    type="button"
                    onClick={() => logout.mutate()}
                    disabled={logout.isPending}
                    className={[
                      "rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all active:scale-95",
                      logout.isPending
                        ? "opacity-70 cursor-not-allowed"
                        : "hover:bg-slate-800",
                    ].join(" ")}
                  >
                    {logout.isPending ? "Logging out..." : "Logout"}
                  </button>
                </>
              ) : (
                <>
                  <NavLink
                    to="/sign-in"
                    className="rounded-xl px-4 py-2 text-sm font-medium text-slate-600 transition-all hover:text-slate-900"
                  >
                    Sign in
                  </NavLink>
                  <NavLink
                    to="/sign-up"
                    className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-blue-200 transition-all hover:bg-blue-700 active:scale-95"
                  >
                    Start free
                  </NavLink>
                </>
              )}
            </div>

            {/* Mobile CTAs */}
            <div className="flex items-center gap-2 md:hidden">
              {!isBootstrapped ? (
                <div className="h-9 w-24 animate-pulse rounded-xl bg-slate-100" />
              ) : isLoggedIn ? (
                <>
                  <button
                    type="button"
                    onClick={() => nav("/select-tenant")}
                    className="rounded-xl px-3 py-2 text-sm font-medium text-slate-600 hover:text-slate-900"
                  >
                    Dashboard
                  </button>
                  <button
                    type="button"
                    onClick={() => logout.mutate()}
                    disabled={logout.isPending}
                    className={[
                      "rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm active:scale-95",
                      logout.isPending
                        ? "opacity-70 cursor-not-allowed"
                        : "hover:bg-slate-800",
                    ].join(" ")}
                  >
                    {logout.isPending ? "..." : "Logout"}
                  </button>
                </>
              ) : (
                <>
                  <NavLink
                    to="/sign-in"
                    className="rounded-xl px-3 py-2 text-sm font-medium text-slate-600 hover:text-slate-900"
                  >
                    Sign in
                  </NavLink>
                  <NavLink
                    to="/sign-up"
                    className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-blue-200 hover:bg-blue-700 active:scale-95"
                  >
                    Start free
                  </NavLink>
                </>
              )}
            </div>
          </div>
        </nav>
      </header>

      <main id="main-content" className="relative overflow-hidden bg-white">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute right-0 top-0 h-[520px] w-[520px] -translate-y-1/2 translate-x-1/2 rounded-full bg-blue-100/50 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute bottom-0 left-0 h-[620px] w-[620px] translate-y-1/2 -translate-x-1/2 rounded-full bg-sky-100/40 blur-3xl"
        />

        <div className="relative mx-auto w-full max-w-[2100px] px-4 sm:px-6 lg:px-8">
          <Outlet />
        </div>
      </main>

      {/* <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4 lg:grid-cols-5 xl:gap-12">
            <div className="col-span-2 lg:col-span-2">
              <div className="mb-4 flex items-center gap-2">
                <span className="text-xl font-bold tracking-tight text-slate-900">
                  SaaSify
                </span>
                <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
                  Public
                </span>
              </div>
              <p className="max-w-xs text-sm leading-relaxed text-slate-500">
                The flexible MERN foundation for building modern SaaS products —
                focused on clarity, security, and developer experience.
              </p>
            </div>
          </div>

          <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-slate-200 pt-8 md:flex-row">
            <p className="text-sm text-slate-500">
              © 2026 SaaSify-MERN. All rights reserved.
            </p>
            <p className="text-xs text-slate-400">
              Designed with precision for modern builders.
            </p>
          </div>
        </div>
      </footer> */}
    
    
    <footer>
      <Footer/>
    </footer>
    
    </div>
  );
}

