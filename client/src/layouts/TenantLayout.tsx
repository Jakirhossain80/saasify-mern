// FILE: client/src/layouts/TenantLayout.tsx
import { useEffect } from "react";
import { Link, NavLink, Outlet, useParams } from "react-router-dom";
import PageShell from "../components/common/PageShell";
import { useAuthStore } from "../store/auth.store";
import RoleGate from "../components/guards/RoleGate";

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export default function TenantLayout() {
  const { tenantSlug = "" } = useParams();

  const user = useAuthStore((s) => s.user);

  // ✅ Keep store tenantSlug synced with URL (SAFE: useEffect, not render)
  const setActiveTenantSlug = useAuthStore((s) => s.setActiveTenantSlug);
  useEffect(() => {
    if (tenantSlug) setActiveTenantSlug(tenantSlug);
  }, [tenantSlug, setActiveTenantSlug]);

  // ✅ Tenant role from store (set by SelectTenant via /api/t/:tenantSlug/me)
  const activeTenantRole = useAuthStore((s) => s.activeTenantRole);
  const isTenantAdmin = activeTenantRole === "tenantAdmin";

  // Sidebar styles (keeps your existing layout but upgraded to the newer polished variant)
  const linkBase = "block rounded-lg px-3 py-2 text-sm transition border";
  const linkActive = "bg-slate-900 text-white border-slate-900";
  const linkIdle = "bg-white hover:bg-slate-50 border-slate-200 text-slate-700";

  return (
    <PageShell title={`Tenant: ${tenantSlug}`}>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-[260px_1fr]">
        {/* Sidebar */}
        <aside className="h-fit rounded-2xl border bg-white p-4 shadow-sm">
          {/* Tenant header */}
          <div className="mb-4">
            <div className="text-xs text-slate-500">Tenant</div>
            <div className="text-base font-semibold text-slate-900">{tenantSlug}</div>

            {/* User */}
            <div className="mt-1 text-xs text-slate-500 truncate">{user?.email}</div>

            {/* Role badge */}
            <div className="mt-2 inline-flex items-center rounded-full border px-2.5 py-1 text-xs">
              Role: <span className="ml-1 font-medium">{activeTenantRole ?? "unknown"}</span>
            </div>
          </div>

          <nav className="space-y-2">
            <NavLink
              to={`/t/${tenantSlug}/dashboard`}
              className={({ isActive }) => cx(linkBase, isActive ? linkActive : linkIdle)}
              end
            >
              Dashboard
            </NavLink>

            <NavLink
              to={`/t/${tenantSlug}/projects`}
              className={({ isActive }) => cx(linkBase, isActive ? linkActive : linkIdle)}
            >
              Projects
            </NavLink>

            {/* ✅ Tenant Admin only sections (server still enforces; this is UI gating) */}
            <RoleGate allowTenantRoles={["tenantAdmin"]} tenantDenyTo={`/t/${tenantSlug}/dashboard`}>
              <NavLink
                to={`/t/${tenantSlug}/members`}
                className={({ isActive }) => cx(linkBase, isActive ? linkActive : linkIdle)}
              >
                Members / Team
              </NavLink>

              <NavLink
                to={`/t/${tenantSlug}/invites`}
                className={({ isActive }) => cx(linkBase, isActive ? linkActive : linkIdle)}
              >
                Invite Users
              </NavLink>

              <NavLink
                to={`/t/${tenantSlug}/analytics`}
                className={({ isActive }) => cx(linkBase, isActive ? linkActive : linkIdle)}
              >
                Tenant Analytics
              </NavLink>

              <NavLink
                to={`/t/${tenantSlug}/settings`}
                className={({ isActive }) => cx(linkBase, isActive ? linkActive : linkIdle)}
              >
                Tenant Settings
              </NavLink>
            </RoleGate>

            {/* Hint box (helps when role not loaded yet) */}
            {!activeTenantRole && (
              <div className="mt-4 rounded-lg border bg-slate-50 p-3 text-xs text-slate-600">
                Tenant role is not loaded yet. If you don’t see admin menus, make sure{" "}
                <span className="font-medium">Select Tenant</span> sets{" "}
                <span className="font-medium">activeTenantRole</span> after verifying membership.
              </div>
            )}

            {/* Switch tenant */}
            <div className="mt-4 border-t pt-4">
              <Link to="/select-tenant" className="text-xs text-slate-600 hover:text-slate-900">
                Switch tenant
              </Link>
            </div>
          </nav>
        </aside>

        {/* Main content */}
        <section className="min-w-0">
          <Outlet />
        </section>
      </div>
    </PageShell>
  );
}
