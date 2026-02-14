// FILE: client/src/components/common/PageShell.tsx
import React, { createContext, useContext } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

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
            <h1 className="text-xl font-semibold">{title}</h1>
            {subtitle ? <p className="mt-1 text-sm text-slate-600">{subtitle}</p> : null}
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
      <div className="min-h-screen">
        <header className="border-b">
          <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
            <Link to="/" className="font-semibold">
              SaaSify
            </Link>

            <div className="flex items-center gap-3 text-sm">
              {user ? (
                <>
                  <span className="text-slate-600">{user.email}</span>
                  <button
                    className="border rounded px-3 py-1 hover:bg-slate-50 disabled:opacity-60"
                    onClick={() => logout.mutate()}
                    disabled={logout.isPending}
                    type="button"
                  >
                    {logout.isPending ? "Logging out..." : "Logout"}
                  </button>
                </>
              ) : (
                <Link className="border rounded px-3 py-1 hover:bg-slate-50" to="/sign-in">
                  Sign in
                </Link>
              )}
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-6xl px-4 py-6">
          <div className="mb-4 flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h1 className="text-xl font-semibold">{title}</h1>
              {subtitle ? <p className="mt-1 text-sm text-slate-600">{subtitle}</p> : null}
            </div>
            {right ? <div className="shrink-0">{right}</div> : null}
          </div>

          {children}
        </main>
      </div>
    </PageShellContext.Provider>
  );
}
