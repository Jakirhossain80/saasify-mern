// FILE: client/src/components/common/PageShell.tsx
import React, { createContext, useContext } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import ThemeToggle from "./ThemeToggle";

type PageShellProps = {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  children: React.ReactNode;
};

/**
 * ✅ Prevent double navbar:
 * - Outer PageShell renders the global header/navbar.
 * - Inner/nested PageShell renders ONLY the page header (title/subtitle/right), no navbar.
 */
const PageShellContext = createContext(false);

export default function PageShell({ title, subtitle, right, children }: PageShellProps) {
  const isInsideAnotherShell = useContext(PageShellContext);

  // ✅ If nested, DO NOT render navbar/header again
  if (isInsideAnotherShell) {
    return (
      <div className="min-w-0">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">{title}</h1>
            {subtitle ? <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{subtitle}</p> : null}
          </div>
          {right ? <div className="shrink-0">{right}</div> : null}
        </div>

        {children}
      </div>
    );
  }

  // ✅ Top-level shell: renders navbar + main container
  // IMPORTANT: don't bootstrap here (App.tsx already does it once)
  const { user, logout } = useAuth({ bootstrap: false } as any);

  return (
    <PageShellContext.Provider value={true}>
      <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
        {/* Context Bar (Stitch-aligned, UI only) */}
        <header className="sticky top-0 z-40 -mx-4 sm:-mx-6 lg:-mx-8 border-b border-slate-200/80 bg-white/80 backdrop-blur-md dark:border-slate-800/80 dark:bg-slate-900/60">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <Link
                to="/"
                className="inline-flex items-center gap-2 rounded-xl px-2 py-1 font-semibold text-slate-900 hover:bg-slate-100 dark:text-slate-100 dark:hover:bg-slate-800/60"
              >
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm">
                  ▦
                </span>
                <span className="truncate">SaaSify</span>
              </Link>

              <span className="hidden sm:inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
                <span className="inline-flex h-2 w-2 rounded-full bg-blue-600" />
                Enterprise
              </span>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              <ThemeToggle />

              {user ? (
                <>
                  <div className="hidden sm:flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-800 dark:bg-slate-900">
                    <div className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 text-white text-xs font-bold shadow-sm dark:bg-slate-800">
                      {user?.email?.slice(0, 1)?.toUpperCase() || "—"}
                    </div>
                    <div className="min-w-0">
                      <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-400">
                        Signed in
                      </div>
                      <div className="truncate text-sm font-semibold text-slate-700 dark:text-slate-200">{user.email}</div>
                    </div>
                  </div>

                  <button
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800/70"
                    onClick={() => logout.mutate()}
                    disabled={logout.isPending}
                    type="button"
                  >
                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900/5 text-slate-700 dark:bg-white/10 dark:text-slate-200">
                      ⎋
                    </span>
                    {logout.isPending ? "Logging out..." : "Logout"}
                  </button>
                </>
              ) : (
                <Link
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800/70"
                  to="/sign-in"
                >
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900/5 text-slate-700 dark:bg-white/10 dark:text-slate-200">
                    ⇥
                  </span>
                  Sign in
                </Link>
              )}
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-6xl px-4 py-6">
          <div className="mb-6 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
            <div className="min-w-0">
              <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">{title}</h1>
              {subtitle ? <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{subtitle}</p> : null}
            </div>
            {right ? <div className="shrink-0">{right}</div> : null}
          </div>

          {children}
        </main>
      </div>
    </PageShellContext.Provider>
  );
}