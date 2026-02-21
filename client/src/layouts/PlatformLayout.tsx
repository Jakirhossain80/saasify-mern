// FILE: client/src/layouts/PlatformLayout.tsx
import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

function linkClass({ isActive }: { isActive: boolean }) {
  return [
    "group flex items-center justify-between gap-3 rounded-lg px-3 py-2 text-sm font-medium transition",
    isActive
      ? "bg-slate-900 text-white shadow-sm"
      : "text-slate-700 hover:bg-slate-100 hover:text-slate-900",
  ].join(" ");
}

export default function PlatformLayout() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen w-full bg-slate-50 text-slate-900">
      {/* Skip link (a11y) */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-white focus:px-3 focus:py-2 focus:text-sm focus:shadow"
      >
        Skip to content
      </a>

      {/* ✅ Platform pages (PlatformDashboard/AuditLogs) render PageShell themselves.
          So PlatformLayout must NOT render another header/navbar. */}
      <main id="main-content" className="mx-auto max-w-6xl px-4 py-8">
        <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
          {/* Sidebar */}
          <aside className="lg:sticky lg:top-6 h-fit">
            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
              {/* Sidebar header */}
              <div className="border-b border-slate-200 px-4 py-4">
                <div className="text-xs font-semibold tracking-wider text-slate-500">
                  PLATFORM
                </div>
                <div className="mt-1 text-sm font-semibold text-slate-900">
                  Admin Workspace
                </div>
              </div>

              {/* Nav */}
              <nav className="p-2">
                <NavLink to="/platform" end className={linkClass}>
                  <span>Dashboard</span>
                  <span className="text-xs opacity-70 group-hover:opacity-100">
                    →
                  </span>
                </NavLink>

                <NavLink to="/platform/audit-logs" className={linkClass}>
                  <span>Audit Logs</span>
                  <span className="text-xs opacity-70 group-hover:opacity-100">
                    →
                  </span>
                </NavLink>
              </nav>

              {/* User card */}
              <div className="border-t border-slate-200 p-4">
                <div className="text-xs text-slate-500">Signed in as</div>
                <div className="mt-1 truncate text-sm font-medium text-slate-900">
                  {user?.email || "—"}
                </div>
              </div>
            </div>

            {/* Small helper note (optional UI only; no logic changes) */}
            <div className="mt-4 hidden lg:block rounded-2xl border border-slate-200 bg-white p-4 text-xs text-slate-600 shadow-sm">
              Tip: Use <span className="font-semibold">Audit Logs</span> to track
              platform actions like tenant creation, archiving, and role changes.
            </div>
          </aside>

          {/* Main content */}
          <section className="min-w-0">
            <Outlet />
          </section>
        </div>
      </main>
    </div>
  );
}
