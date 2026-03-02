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
    <div className="relative min-h-screen w-full bg-slate-50 text-slate-900">
      {/* Subtle background accents (visual only) */}
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-24 -right-24 h-80 w-80 rounded-full bg-blue-600/5 blur-3xl" />
        <div className="absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-sky-400/5 blur-3xl" />
      </div>

      {/* Skip link (a11y) */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-slate-900 focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white focus:shadow-lg"
      >
        Skip to content
      </a>

      {/* ✅ Platform pages (PlatformDashboard/AuditLogs) render PageShell themselves.
          So PlatformLayout must NOT render another header/navbar. */}
      <main id="main-content" className="relative mx-auto max-w-6xl px-4 py-6 lg:px-8 lg:py-10">
        <div className="grid gap-8 lg:grid-cols-[260px_1fr]">
          {/* Sidebar */}
          <aside className="lg:sticky lg:top-10 h-fit">
            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
              {/* Sidebar header */}
              <div className="px-5 py-5 border-b border-slate-100">
                <div className="text-[10px] font-semibold tracking-widest text-slate-500 uppercase">PLATFORM</div>
                <div className="mt-1 text-sm font-semibold text-slate-900">Admin Workspace</div>
              </div>

              {/* Nav */}
              <nav className="p-3">
                <NavLink to="/platform" end className={linkClass}>
                  <span className="inline-flex items-center gap-2">
                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900/5 text-slate-700 group-[.active]:bg-white/10">
                      {/* icon placeholder */}
                      <span className="text-base leading-none">▦</span>
                    </span>
                    <span>Dashboard</span>
                  </span>
                  <span className="text-xs opacity-60 group-hover:opacity-100">→</span>
                </NavLink>

                <NavLink to="/platform/audit-logs" className={linkClass}>
                  <span className="inline-flex items-center gap-2">
                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900/5 text-slate-700">
                      {/* icon placeholder */}
                      <span className="text-base leading-none">≡</span>
                    </span>
                    <span>Audit Logs</span>
                  </span>
                  <span className="text-xs opacity-60 group-hover:opacity-100">→</span>
                </NavLink>
              </nav>

              {/* User card */}
              <div className="border-t border-slate-100 p-4">
                <div className="flex items-center gap-3">
                  <div className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-blue-600/10 text-blue-700 text-xs font-bold">
                    {user?.email?.slice(0, 1)?.toUpperCase() || "—"}
                  </div>
                  <div className="min-w-0">
                    <div className="text-[10px] font-medium text-slate-500 leading-none">Signed in as</div>
                    <div className="mt-1 truncate text-sm font-semibold text-slate-900">{user?.email || "—"}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Tip card (visual only; no logic changes) */}
            <div className="mt-6 hidden lg:block rounded-xl border border-blue-600/10 bg-blue-600/5 p-4 text-xs text-slate-700 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 inline-flex h-7 w-7 items-center justify-center rounded-lg bg-white border border-blue-600/10 text-blue-700">
                  💡
                </div>
                <div className="space-y-1">
                  <div className="text-xs font-semibold text-blue-800">Audit Logs Tip</div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Use <span className="font-semibold">Audit Logs</span> to track platform actions like tenant creation,
                    archiving, and role changes.
                  </p>
                </div>
              </div>
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