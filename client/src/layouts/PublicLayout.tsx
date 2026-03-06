// FILE: client/src/layouts/PublicLayout.tsx
import { Outlet, useNavigate, NavLink } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useAuthStore } from "../store/auth.store";
import Footer from "../components/Footer";
import ThemeToggle from "../components/common/ThemeToggle";

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
        ? "text-blue-600 dark:text-blue-400"
        : "text-slate-600 hover:text-blue-600 dark:text-slate-300 dark:hover:text-blue-400",
    ].join(" ");

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 selection:bg-blue-100 selection:text-blue-700 dark:bg-slate-950 dark:text-slate-100 dark:selection:bg-blue-500/20 dark:selection:text-blue-200">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-blue-600 focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white focus:shadow-lg"
      >
        Skip to content
      </a>

      <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/80 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/70">
        <nav aria-label="Main Navigation" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* Brand */}
            <NavLink to="/" className="group flex items-center gap-2" aria-label="SaaSify Home">
              <span className="text-2xl font-bold tracking-tight text-blue-600 dark:text-blue-400">SaaSify</span>
              <span className="hidden items-center rounded-full border border-blue-100 bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700 sm:inline-flex dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-200">
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
              <ThemeToggle />

              {!isBootstrapped ? (
                <div className="h-9 w-28 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800" />
              ) : isLoggedIn ? (
                <>
                  <button
                    type="button"
                    onClick={() => nav("/select-tenant")}
                    className="rounded-xl px-4 py-2 text-sm font-medium text-slate-600 transition-all hover:text-slate-900 dark:text-slate-300 dark:hover:text-slate-100"
                  >
                    Dashboard
                  </button>

                  <button
                    type="button"
                    onClick={() => logout.mutate()}
                    disabled={logout.isPending}
                    className={[
                      "rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all active:scale-95 dark:bg-slate-100 dark:text-slate-900",
                      logout.isPending ? "opacity-70 cursor-not-allowed" : "hover:bg-slate-800 dark:hover:bg-white",
                    ].join(" ")}
                  >
                    {logout.isPending ? "Logging out..." : "Logout"}
                  </button>
                </>
              ) : (
                <>
                  <NavLink
                    to="/sign-in"
                    className="rounded-xl px-4 py-2 text-sm font-medium text-slate-600 transition-all hover:text-slate-900 dark:text-slate-300 dark:hover:text-slate-100"
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
              <ThemeToggle />

              {!isBootstrapped ? (
                <div className="h-9 w-24 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800" />
              ) : isLoggedIn ? (
                <>
                  <button
                    type="button"
                    onClick={() => nav("/select-tenant")}
                    className="rounded-xl px-3 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-slate-100"
                  >
                    Dashboard
                  </button>
                  <button
                    type="button"
                    onClick={() => logout.mutate()}
                    disabled={logout.isPending}
                    className={[
                      "rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm active:scale-95 dark:bg-slate-100 dark:text-slate-900",
                      logout.isPending ? "opacity-70 cursor-not-allowed" : "hover:bg-slate-800 dark:hover:bg-white",
                    ].join(" ")}
                  >
                    {logout.isPending ? "..." : "Logout"}
                  </button>
                </>
              ) : (
                <>
                  <NavLink
                    to="/sign-in"
                    className="rounded-xl px-3 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-slate-100"
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

      <main id="main-content" className="relative overflow-hidden bg-white dark:bg-slate-950 dark:text-slate-100">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute right-0 top-0 h-[520px] w-[520px] -translate-y-1/2 translate-x-1/2 rounded-full bg-blue-100/50 blur-3xl dark:bg-blue-500/10"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute bottom-0 left-0 h-[620px] w-[620px] translate-y-1/2 -translate-x-1/2 rounded-full bg-sky-100/40 blur-3xl dark:bg-sky-500/10"
        />

        <div className="relative mx-auto w-full max-w-[2100px] px-4 sm:px-6 lg:px-8">
          <Outlet />
        </div>
      </main>

      <footer>
        <Footer />
      </footer>
    </div>
  );
}