// FILE: client/src/layouts/TenantLayout.tsx
import { useEffect } from "react";
import { Link, NavLink, Outlet, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAuthStore, type TenantRole } from "../store/auth.store";
import { http } from "../api/http";
import { API } from "../api/endpoints";
import { useAuth } from "../hooks/useAuth";
import ThemeToggle from "../components/common/ThemeToggle";

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

  // ✅ use existing logout functionality (do NOT rewrite logic)
  const { logout } = useAuth({ bootstrap: false });

  // ✅ keep store tenantSlug synced with URL
  const setActiveTenantSlug = useAuthStore((s) => s.setActiveTenantSlug);
  useEffect(() => {
    if (tenantSlug) setActiveTenantSlug(tenantSlug);
  }, [tenantSlug, setActiveTenantSlug]);

  // ✅ tenant role in store (used for sidebar UI gating)
  const activeTenantRole = useAuthStore((s) => s.activeTenantRole);
  const setActiveTenantRole = useAuthStore((s) => s.setActiveTenantRole);

  /**
   * ✅ Auto-load tenant role on direct visit / refresh
   * NOTE: We intentionally do NOT wrap layout with PageShell,
   * because tenant pages already use PageShell (to avoid double header).
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

  // Sidebar styles (Stitch-inspired)
  const linkBase =
    "group flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors border";
  const linkActive =
    "bg-slate-900 text-white border-slate-900 shadow-sm dark:bg-slate-100 dark:text-slate-900 dark:border-slate-100";
  const linkIdle =
    "bg-white text-slate-600 border-transparent hover:bg-slate-50 hover:text-slate-900 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800/70 dark:hover:text-slate-100";

  const isLoadingTenantPerms = tenantMeQ.isLoading && !activeTenantRole;
  const tenantPermsError = tenantMeQ.isError;

  const isTenantAdmin = activeTenantRole === "tenantAdmin";

  const tenantInitial = (tenantSlug?.trim()?.[0] || "T").toUpperCase();

  return (
    <div className="min-h-screen w-full bg-slate-50 text-slate-900 antialiased dark:bg-slate-950 dark:text-slate-100">
      {/* Skip link (a11y) */}
      <a
        href="#tenant-main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-slate-900 focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white focus:shadow-lg"
      >
        Skip to content
      </a>

      {/* Mobile Header (UI only; no toggle logic changes) */}
      <header className="lg:hidden sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-slate-200 shadow-sm dark:bg-slate-900/80 dark:border-slate-800">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 bg-slate-900 rounded-lg flex items-center justify-center text-white font-bold dark:bg-slate-100 dark:text-slate-900">
              {tenantInitial}
            </div>
            <div className="min-w-0">
              <div className="text-[10px] uppercase font-bold tracking-widest text-slate-400 dark:text-slate-400">
                Tenant
              </div>
              <div className="font-bold text-slate-900 truncate dark:text-slate-100">{tenantSlug}</div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <ThemeToggle />

            {/* Home (mobile) */}
            <Link
              to="/"
              className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm transition-colors hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-900/10 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800/70"
            >
              Home
            </Link>

            {/* Logout (mobile) */}
            <button
              type="button"
              onClick={() => logout.mutate()}
              disabled={logout.isPending}
              className={cx(
                "inline-flex items-center justify-center rounded-lg px-3 py-2 text-xs font-semibold shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-slate-900/10",
                logout.isPending
                  ? "bg-slate-900/70 text-white/80 cursor-not-allowed dark:bg-slate-100/70 dark:text-slate-900/80"
                  : "bg-slate-900 text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
              )}
            >
              {logout.isPending ? "Logging out..." : "Logout"}
            </button>

            {/* Visual-only button (no behavior change) */}
            <button
              type="button"
              aria-label="Open Menu"
              className="p-2 rounded-lg hover:bg-slate-100 text-slate-700 dark:hover:bg-slate-800 dark:text-slate-200"
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  d="M4 6h16M4 12h16m-7 6h7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                />
              </svg>
            </button>
          </div>
        </div>
      </header>

      <main id="tenant-main-content" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[280px_1fr]">
          {/* Sidebar */}
          <aside className="hidden lg:block">
            <nav
              aria-label="Tenant Sidebar"
              className="sticky top-8 flex flex-col h-[calc(100vh-4rem)] bg-white border border-slate-200 rounded-2xl shadow-sm p-5 overflow-y-auto dark:bg-slate-900 dark:border-slate-800"
            >
              {/* Tenant Identity */}
              <div className="mb-8">
                <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 mb-1 block dark:text-slate-400">
                  Tenant
                </span>

                <div className="flex items-start justify-between gap-3 mb-2">
                  <h2 className="text-xl font-extrabold tracking-tight text-slate-900 truncate dark:text-slate-100">
                    {tenantSlug}
                  </h2>

                  <span className="inline-flex shrink-0 items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200 dark:bg-slate-800/60 dark:text-slate-200 dark:border-slate-700">
                    {activeTenantRole ?? (isLoadingTenantPerms ? "Loading" : "Unknown")}
                  </span>
                </div>

                <p className="text-sm text-slate-500 truncate dark:text-slate-400">{user?.email || "—"}</p>

                {/* Loading / error helpers */}
                {isLoadingTenantPerms && (
                  <div className="mt-4 text-xs text-slate-500 dark:text-slate-400">Loading tenant permissions…</div>
                )}

                {tenantPermsError && (
                  <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-800 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200">
                    <p className="font-bold">Failed to load tenant permissions.</p>
                    <div className="mt-2 text-rose-800/90 dark:text-rose-200/90">
                      Check: <span className="font-medium">GET /api/t/:tenantSlug/me</span>
                    </div>
                    <div className="mt-1 text-rose-800/90 dark:text-rose-200/90">
                      Confirm you are an <span className="font-medium">active member</span> of this tenant.
                    </div>
                  </div>
                )}
              </div>

              {/* Nav Links */}
              <div className="flex-1 space-y-1">
                <NavLink
                  to={`/t/${tenantSlug}`}
                  className={({ isActive }) => cx(linkBase, isActive ? linkActive : linkIdle)}
                  end
                >
                  <span className="w-5 h-5 flex items-center justify-center opacity-70">
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                    </svg>
                  </span>
                  <span className="flex-1">Dashboard</span>
                </NavLink>

                <NavLink
                  to={`/t/${tenantSlug}/projects`}
                  className={({ isActive }) => cx(linkBase, isActive ? linkActive : linkIdle)}
                >
                  <span className="w-5 h-5 flex items-center justify-center opacity-70">
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z" />
                    </svg>
                  </span>
                  <span className="flex-1">Projects</span>
                </NavLink>

                {/* Tenant Admin only links */}
                {isTenantAdmin && (
                  <>
                    <NavLink
                      to={`/t/${tenantSlug}/members`}
                      className={({ isActive }) => cx(linkBase, isActive ? linkActive : linkIdle)}
                    >
                      <span className="w-5 h-5 flex items-center justify-center opacity-70">
                        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a7 7 0 00-7 7v1h12v-1a7 7 0 00-7-7z" />
                        </svg>
                      </span>
                      <span className="flex-1">Members / Team</span>
                    </NavLink>

                    <NavLink
                      to={`/t/${tenantSlug}/invites`}
                      className={({ isActive }) => cx(linkBase, isActive ? linkActive : linkIdle)}
                    >
                      <span className="w-5 h-5 flex items-center justify-center opacity-70">
                        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                          <path
                            fillRule="evenodd"
                            d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </span>
                      <span className="flex-1">Invite Users</span>
                    </NavLink>

                    <NavLink
                      to={`/t/${tenantSlug}/analytics`}
                      className={({ isActive }) => cx(linkBase, isActive ? linkActive : linkIdle)}
                    >
                      <span className="w-5 h-5 flex items-center justify-center opacity-70">
                        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
                        </svg>
                      </span>
                      <span className="flex-1">Tenant Analytics</span>
                    </NavLink>

                    <NavLink
                      to={`/t/${tenantSlug}/settings`}
                      className={({ isActive }) => cx(linkBase, isActive ? linkActive : linkIdle)}
                    >
                      <span className="w-5 h-5 flex items-center justify-center opacity-70">
                        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                          <path
                            fillRule="evenodd"
                            d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </span>
                      <span className="flex-1">Tenant Settings</span>
                    </NavLink>
                  </>
                )}

                {!activeTenantRole && !isLoadingTenantPerms && !tenantPermsError && (
                  <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
                    Tenant role is not loaded yet. Ensure{" "}
                    <span className="font-medium">/api/t/:tenantSlug/me</span> returns your membership role, and your
                    client restores a valid session after refresh.
                  </div>
                )}
              </div>

              {/* Bottom */}
              <div className="mt-8 pt-6 border-t border-slate-100 space-y-2 dark:border-slate-800">
                <Link
                  to="/"
                  className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-medium transition-colors text-sm group dark:text-slate-300 dark:hover:bg-slate-800/70 dark:hover:text-slate-100"
                >
                  <span className="w-5 h-5 flex items-center justify-center opacity-60 group-hover:opacity-90">
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                    </svg>
                  </span>
                  <span className="flex-1">Home</span>
                </Link>

                <Link
                  to="/select-tenant"
                  className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-medium transition-colors text-sm group dark:text-slate-300 dark:hover:bg-slate-800/70 dark:hover:text-slate-100"
                >
                  <span className="w-5 h-5 flex items-center justify-center opacity-60 group-hover:opacity-90">
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M5 3a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2V5a2 2 0 00-2-2H5zm4 10a1 1 0 100-2H6a1 1 0 100 2h3zm4-5a1 1 0 11-2 0 1 1 0 012 0zm-8 1a1 1 0 110-2h3a1 1 0 110 2H5z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </span>
                  <span className="flex-1">Switch tenant</span>
                </Link>

                <button
                  type="button"
                  onClick={() => logout.mutate()}
                  disabled={logout.isPending}
                  className={cx(
                    "w-full flex items-center gap-3 px-4 py-2.5 rounded-xl font-medium transition-colors text-sm group border",
                    logout.isPending
                      ? "bg-slate-900/70 text-white/80 border-slate-900/40 cursor-not-allowed dark:bg-slate-100/70 dark:text-slate-900/80 dark:border-slate-100/40"
                      : "bg-slate-900 text-white border-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:border-slate-100 dark:hover:bg-white"
                  )}
                >
                  <span className="w-5 h-5 flex items-center justify-center opacity-80">
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M10 16l-4-4m0 0l4-4m-4 4h12m-6 4v1a2 2 0 01-2 2H7a2 2 0 01-2-2V7a2 2 0 012-2h3a2 2 0 012 2v1"
                      />
                    </svg>
                  </span>
                  <span className="flex-1 text-left">{logout.isPending ? "Logging out..." : "Logout"}</span>
                </button>
              </div>
            </nav>
          </aside>

          {/* Main content */}
          <section className="min-w-0">
            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <nav aria-label="Breadcrumb">
                <ol className="flex items-center space-x-2 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400">
                  <li>Tenant</li>
                  <li className="flex items-center space-x-2">
                    <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span className="truncate max-w-[240px]">{tenantSlug}</span>
                  </li>
                  <li className="flex items-center space-x-2 text-slate-900 dark:text-slate-100">
                    <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span>Workspace</span>
                  </li>
                </ol>
              </nav>

              <div className="hidden sm:flex items-center gap-2">
                <ThemeToggle />

                <Link
                  to="/"
                  className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition-colors hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800/70"
                >
                  Home
                </Link>

                <button
                  type="button"
                  onClick={() => logout.mutate()}
                  disabled={logout.isPending}
                  className={cx(
                    "inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/20",
                    logout.isPending
                      ? "bg-slate-900/70 text-white/80 cursor-not-allowed dark:bg-slate-100/70 dark:text-slate-900/80"
                      : "bg-slate-900 text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
                  )}
                >
                  {logout.isPending ? "Logging out..." : "Logout"}
                </button>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-6 lg:p-8 dark:bg-slate-900 dark:border-slate-800">
              <Outlet />
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}