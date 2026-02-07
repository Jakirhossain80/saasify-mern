// FILE: client/src/layouts/TenantLayout.tsx
import { useEffect } from "react";
import { Link, NavLink, Outlet, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import PageShell from "../components/common/PageShell";
import { useAuthStore, type TenantRole } from "../store/auth.store";
import { http } from "../api/http";
import { API } from "../api/endpoints";

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

type TenantMeResponse = {
  tenant: { id: string; slug: string };
  role: TenantRole; // "tenantAdmin" | "member"
};

export default function TenantLayout() {
  const { tenantSlug = "" } = useParams();

  const user = useAuthStore((s) => s.user);
  const isBootstrapped = useAuthStore((s) => s.isBootstrapped);

  // ✅ keep store tenantSlug synced with URL
  const setActiveTenantSlug = useAuthStore((s) => s.setActiveTenantSlug);
  useEffect(() => {
    if (tenantSlug) setActiveTenantSlug(tenantSlug);
  }, [tenantSlug, setActiveTenantSlug]);

  // ✅ tenant role in store (used for sidebar UI gating)
  const activeTenantRole = useAuthStore((s) => s.activeTenantRole);
  const setActiveTenantRole = useAuthStore((s) => s.setActiveTenantRole);

  /**
   * ✅ Critical fix:
   * Auto-load tenant role when user lands directly on /t/:tenantSlug/... (refresh / direct URL)
   * This prevents the sidebar from being stuck on "Loading tenant permissions…"
   *
   * Backend requires Authorization Bearer token (requireAuth).
   * Your http.ts interceptor already attaches the accessToken (and can refresh once if needed).
   */
  const tenantMeQ = useQuery({
    queryKey: ["tenantMe", tenantSlug],
    enabled: Boolean(isBootstrapped && user && tenantSlug && !activeTenantRole),
    queryFn: async () => {
      const res = await http.get<TenantMeResponse>(API.tenant.me(tenantSlug));
      return res.data;
    },
    retry: 1,
    staleTime: 60_000,
  });

  // ✅ store role when fetched
  useEffect(() => {
    if (tenantMeQ.data?.role) {
      setActiveTenantRole(tenantMeQ.data.role);
    }
  }, [tenantMeQ.data?.role, setActiveTenantRole]);

  // Sidebar styles (keep your existing polished variant)
  const linkBase = "block rounded-lg px-3 py-2 text-sm transition border";
  const linkActive = "bg-slate-900 text-white border-slate-900";
  const linkIdle = "bg-white hover:bg-slate-50 border-slate-200 text-slate-700";

  const isLoadingTenantPerms = tenantMeQ.isLoading && !activeTenantRole;
  const tenantPermsError = tenantMeQ.isError;

  const isTenantAdmin = activeTenantRole === "tenantAdmin";

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
              Role:{" "}
              <span className="ml-1 font-medium">
                {activeTenantRole ?? (isLoadingTenantPerms ? "loading..." : "unknown")}
              </span>
            </div>

            {/* Loading / error helpers */}
            {isLoadingTenantPerms && (
              <div className="mt-3 text-xs text-slate-500">Loading tenant permissions…</div>
            )}

            {tenantPermsError && (
              <div className="mt-3 rounded-lg border bg-rose-50 p-3 text-xs text-rose-700">
                Failed to load tenant permissions.
                <div className="mt-1 text-rose-700/90">
                  Check: <span className="font-medium">GET /api/t/:tenantSlug/me</span>
                </div>
                <div className="mt-1 text-rose-700/90">
                  Confirm you are an <span className="font-medium">active member</span> of this tenant.
                </div>
              </div>
            )}
          </div>

          <nav className="space-y-2">
            {/* Dashboard */}
            <NavLink
              to={`/t/${tenantSlug}`}
              className={({ isActive }) => cx(linkBase, isActive ? linkActive : linkIdle)}
              end
            >
              Dashboard
            </NavLink>

            {/* Projects */}
            <NavLink
              to={`/t/${tenantSlug}/projects`}
              className={({ isActive }) => cx(linkBase, isActive ? linkActive : linkIdle)}
            >
              Projects
            </NavLink>

            {/* ✅ Tenant Admin only links
                IMPORTANT: do NOT wrap these links with RoleGate,
                otherwise RoleGate can “trap” the sidebar in a loading screen.
            */}
            {isTenantAdmin && (
              <>
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
              </>
            )}

            {/* Hint box (role not loaded) */}
            {!activeTenantRole && !isLoadingTenantPerms && !tenantPermsError && (
              <div className="mt-4 rounded-lg border bg-slate-50 p-3 text-xs text-slate-600">
                Tenant role is not loaded yet. Ensure{" "}
                <span className="font-medium">/api/t/:tenantSlug/me</span> returns your membership role, and your client
                restores a valid session after refresh.
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
