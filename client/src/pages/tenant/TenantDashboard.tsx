// FILE: client/src/pages/tenant/TenantDashboard.tsx
import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "../../store/auth.store";
import RoleGate from "../../components/guards/RoleGate";
import { http } from "../../api/http";
import { API } from "../../api/endpoints";

type TenantMeResponse = {
  tenant: { id: string; slug: string };
  role: "tenantAdmin" | "member";
};

type TenantAnalyticsResponse = {
  activeProjects: number;
  archivedProjects: number;
  membersCount: number;
};

type MemberItem = {
  id?: string;
  _id?: string;
  tenantId?: string;
  userId: string;
  role: "tenantAdmin" | "member";
  status: "active" | "removed";
  createdAt?: string;
};

function Icon({
  name,
  className = "h-5 w-5",
}: {
  name:
    | "tag"
    | "mail"
    | "account_circle"
    | "add"
    | "folder"
    | "group"
    | "verified_user"
    | "inventory_2"
    | "person_add"
    | "groups"
    | "analytics"
    | "security"
    | "info"
    | "history";
  className?: string;
}) {
  const common = {
    className,
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    viewBox: "0 0 24 24",
    "aria-hidden": true,
  };

  switch (name) {
    case "tag":
      return (
        <svg {...common}>
          <path d="M20.59 13.41 12 22 2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82Z" />
          <path d="M7 7h.01" />
        </svg>
      );

    case "mail":
      return (
        <svg {...common}>
          <path d="M4 4h16v16H4z" opacity="0" />
          <path d="M4 6h16v12H4z" />
          <path d="m22 6-10 7L2 6" />
        </svg>
      );

    case "account_circle":
      return (
        <svg {...common}>
          <path d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4Z" />
          <path d="M4 20a8 8 0 0 1 16 0" />
        </svg>
      );

    case "add":
      return (
        <svg {...common}>
          <path d="M12 5v14" />
          <path d="M5 12h14" />
        </svg>
      );

    case "folder":
      return (
        <svg {...common}>
          <path d="M3 7a2 2 0 0 1 2-2h5l2 2h7a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z" />
        </svg>
      );

    case "group":
      return (
        <svg {...common}>
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <path d="M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      );

    case "verified_user":
      return (
        <svg {...common}>
          <path d="M12 2l7 4v6c0 5-3 9-7 10-4-1-7-5-7-10V6l7-4Z" />
          <path d="M9 12l2 2 4-4" />
        </svg>
      );

    case "inventory_2":
      return (
        <svg {...common}>
          <path d="M21 8v13H3V8" />
          <path d="M1 3h22v5H1z" />
          <path d="M10 12h4" />
        </svg>
      );

    case "person_add":
      return (
        <svg {...common}>
          <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <path d="M8.5 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" />
          <path d="M20 8v6" />
          <path d="M23 11h-6" />
        </svg>
      );

    case "groups":
      return (
        <svg {...common}>
          <path d="M17 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M7 21v-2a4 4 0 0 1 4-4h1" />
          <path d="M9 7a4 4 0 1 0 0 8" />
          <path d="M17 7a4 4 0 0 1 0 8" />
        </svg>
      );

    case "analytics":
      return (
        <svg {...common}>
          <path d="M3 3v18h18" />
          <path d="M7 14v4" />
          <path d="M11 10v8" />
          <path d="M15 12v6" />
          <path d="M19 7v11" />
        </svg>
      );

    case "security":
      return (
        <svg {...common}>
          <path d="M12 2l7 4v6c0 5-3 9-7 10-4-1-7-5-7-10V6l7-4Z" />
        </svg>
      );

    case "info":
      return (
        <svg {...common}>
          <path d="M12 16v-4" />
          <path d="M12 8h.01" />
          <path d="M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
        </svg>
      );

    case "history":
      return (
        <svg {...common}>
          <path d="M3 12a9 9 0 1 0 3-6.7" />
          <path d="M3 3v5h5" />
          <path d="M12 7v5l3 3" />
        </svg>
      );

    default:
      return null;
  }
}

export default function TenantDashboard() {
  const { tenantSlug = "" } = useParams();
  const user = useAuthStore((s) => s.user);
  const activeTenantRole = useAuthStore((s) => s.activeTenantRole);

  const isTenantAdmin = activeTenantRole === "tenantAdmin";

  // 1) Resolve tenant context (slug -> id) using existing backend route
  const tenantMeQ = useQuery({
    queryKey: ["tenantMe", tenantSlug],
    queryFn: async () => {
      const { data } = await http.get<TenantMeResponse>(API.tenant.me(tenantSlug));
      return data;
    },
    enabled: !!tenantSlug,
  });

  const tenantId = tenantMeQ.data?.tenant?.id ?? "";

  // ✅ Phase 8 (3): Tenant analytics stats (Projects card)
  const analyticsQ = useQuery({
    queryKey: ["tenantAnalytics", tenantId],
    queryFn: async () => {
      const { data } = await http.get<TenantAnalyticsResponse>(API.tenant.analytics(tenantId));
      return data;
    },
    enabled: !!tenantId && isTenantAdmin,
  });

  // 2) Fetch members list only for tenantAdmin (members module)
  const membersQ = useQuery({
    queryKey: ["tenantMembers", tenantId],
    queryFn: async () => {
      const { data } = await http.get<{ items: MemberItem[] }>(API.tenant.members(tenantId));
      return data.items ?? [];
    },
    enabled: !!tenantId && isTenantAdmin,
  });

  const membersCount = (membersQ.data ?? []).filter((m) => m.status === "active").length;

  const activeProjects = analyticsQ.data?.activeProjects;
  const archivedProjects = analyticsQ.data?.archivedProjects;

  return (
    <div className="-mx-4 bg-slate-50 dark:bg-slate-950 sm:mx-0">
      {/* 1) Sticky Tenant Context Bar */}
      <div className="sticky top-0 z-30 w-full border-b border-slate-200 bg-white/80 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/80">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-2 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <span className="relative flex h-2 w-2 items-center justify-center">
              <span className="absolute inline-flex h-2 w-2 animate-ping rounded-full bg-blue-600 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-blue-600" />
            </span>
            <span className="text-sm font-semibold tracking-tight text-slate-700 dark:text-slate-200">Tenant Workspace</span>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden items-center gap-2 rounded-full border border-slate-200 bg-slate-100 px-3 py-1 sm:flex dark:border-slate-800 dark:bg-slate-900">
              <span className="text-slate-500 dark:text-slate-400" aria-hidden="true">
                <Icon name="tag" className="h-[18px] w-[18px]" />
              </span>
              <span className="text-xs font-medium text-slate-600 dark:text-slate-300">{tenantSlug}</span>
              <span className="mx-1 h-3 w-px bg-slate-300 dark:bg-slate-700" />
              <span className="text-slate-500 dark:text-slate-400" aria-hidden="true">
                <Icon name="mail" className="h-[18px] w-[18px]" />
              </span>
              <span className="text-xs font-medium text-slate-600 dark:text-slate-300">{user?.email}</span>
            </div>

            <div className="flex h-8 w-8 items-center justify-center rounded-full border border-blue-600/20 bg-blue-600/10 text-blue-600 dark:text-blue-400">
              <Icon name="account_circle" className="h-5 w-5" />
            </div>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-7xl space-y-8 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        {/* 2) Main Header Card */}
        <section className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8 dark:border-slate-800 dark:bg-slate-900">
          <div className="absolute left-0 top-0 h-1 w-full bg-blue-600/20">
            <div className="h-full w-24 bg-blue-600" />
          </div>

          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div className="space-y-2">
              <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl dark:text-slate-100">
                Tenant Dashboard
              </h2>
              <p className="flex flex-wrap items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                <span>
                  Tenant: <span className="font-medium text-slate-700 dark:text-slate-200">{tenantSlug}</span>
                </span>
                <span className="text-slate-300 dark:text-slate-700">•</span>
                <span>
                  Signed in as: <span className="font-medium text-slate-700 dark:text-slate-200">{user?.email}</span>
                </span>
              </p>

              {/* Keep tenantMeQ wiring (no functional changes) but show a subtle hint only on error */}
              {tenantMeQ.isError ? (
                <p className="text-xs text-rose-600 dark:text-rose-300">Failed to resolve tenant context.</p>
              ) : null}
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link
                className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition-colors hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-950"
                to={`/t/${tenantSlug}/projects`}
              >
                View Projects
              </Link>

              {/* ✅ Tenant Admin only */}
              <RoleGate allowTenantRoles={["tenantAdmin"]} tenantDenyTo={`/t/${tenantSlug}/dashboard`}>
                <Link
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition-all hover:bg-blue-600/90 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  to={`/t/${tenantSlug}/projects?new=1`}
                  title="Tenant Admin only"
                >
                  <Icon name="add" className="h-[18px] w-[18px]" />
                  Create Project
                  <span className="inline-flex items-center gap-1 rounded bg-white/20 px-1.5 py-0.5 text-[10px] font-bold uppercase">
                    <Icon name="security" className="h-3 w-3" />
                    Admin
                  </span>
                </Link>
              </RoleGate>
            </div>
          </div>
        </section>

        {/* 3) Summary Stat Cards Row */}
        <section className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {/* Projects */}
          <div className="group cursor-default rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:border-blue-600/40 hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-4 flex items-start justify-between">
              <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                Projects
              </span>
              <div className="rounded-lg bg-blue-50 p-2 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
                <Icon name="folder" className="h-5 w-5" />
              </div>
            </div>

            <div className="text-3xl font-bold text-slate-900 dark:text-slate-100">
              {isTenantAdmin ? (analyticsQ.isLoading ? "…" : activeProjects ?? 0) : "—"}
            </div>

            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
              {isTenantAdmin ? (
                analyticsQ.isError ? (
                  "Failed to load stats"
                ) : (
                  `Connected to stats API${
                    typeof archivedProjects === "number" ? ` • Archived: ${archivedProjects}` : ""
                  }`
                )
              ) : (
                "Tenant admin only"
              )}
            </p>
          </div>

          {/* Members */}
          <div className="group cursor-default rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:border-blue-600/40 hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-4 flex items-start justify-between">
              <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                Members
              </span>
              <div className="rounded-lg bg-indigo-50 p-2 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400">
                <Icon name="group" className="h-5 w-5" />
              </div>
            </div>

            <div className="text-3xl font-bold text-slate-900 dark:text-slate-100">
              {isTenantAdmin ? (membersQ.isLoading ? "…" : membersCount) : "—"}
            </div>

            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
              {isTenantAdmin ? (membersQ.isError ? "Failed to load members" : "Connected to members API") : "Tenant admin only"}
            </p>
          </div>

          {/* Role */}
          <div className="group cursor-default rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:border-blue-600/40 hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-4 flex items-start justify-between">
              <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                Your Role
              </span>
              <div className="rounded-lg bg-emerald-50 p-2 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
                <Icon name="verified_user" className="h-5 w-5" />
              </div>
            </div>

            <div className="text-3xl font-bold text-slate-900 dark:text-slate-100">{activeTenantRole ?? "—"}</div>
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">Tenant-scoped role</p>
          </div>
        </section>

        {/* 4) Workspace Overview Section */}
        <section className="space-y-6">
          <div className="flex flex-col gap-1 border-l-4 border-blue-600 pl-4">
            <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">Workspace Overview</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">Manage your tenant resources and configuration.</p>
          </div>

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            {/* Left: Role-based panels */}
            <div className="lg:col-span-2 space-y-4">
              {/* ================= Tenant Admin Panels ================= */}
              {isTenantAdmin ? (
                <>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {/* Projects Management */}
                    <div className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-5 transition-shadow hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="rounded-lg bg-slate-50 p-2 text-slate-600 dark:bg-slate-950 dark:text-slate-300">
                            <Icon name="inventory_2" className="h-5 w-5" />
                          </div>
                          <span className="inline-flex items-center gap-1 rounded-full bg-blue-600/10 px-2 py-0.5 text-[10px] font-bold text-blue-600 dark:text-blue-400">
                            <Icon name="security" className="h-3 w-3" /> ADMIN
                          </span>
                        </div>
                        <h4 className="font-bold text-slate-900 dark:text-slate-100">Projects Management</h4>
                        <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                          Create, update, and delete tenant projects.
                        </p>
                      </div>

                      <div className="mt-4">
                        <Link
                          className="inline-flex w-full items-center justify-center rounded-lg border border-slate-200 bg-white py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-950"
                          to={`/t/${tenantSlug}/projects`}
                        >
                          Manage Projects
                        </Link>
                      </div>
                    </div>

                    {/* Members / Team */}
                    <div className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-5 transition-shadow hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="rounded-lg bg-slate-50 p-2 text-slate-600 dark:bg-slate-950 dark:text-slate-300">
                            <Icon name="groups" className="h-5 w-5" />
                          </div>
                          <span className="inline-flex items-center gap-1 rounded-full bg-blue-600/10 px-2 py-0.5 text-[10px] font-bold text-blue-600 dark:text-blue-400">
                            <Icon name="security" className="h-3 w-3" /> ADMIN
                          </span>
                        </div>
                        <h4 className="font-bold text-slate-900 dark:text-slate-100">Members / Team</h4>
                        <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                          View members, promote/remove members.
                        </p>
                      </div>

                      <div className="mt-4">
                        <Link
                          className="inline-flex w-full items-center justify-center rounded-lg border border-slate-200 bg-white py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-950"
                          to={`/t/${tenantSlug}/members`}
                        >
                          Open Members
                        </Link>
                      </div>
                    </div>

                    {/* Invite Users */}
                    <div className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-5 transition-shadow hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="rounded-lg bg-slate-50 p-2 text-slate-600 dark:bg-slate-950 dark:text-slate-300">
                            <Icon name="person_add" className="h-5 w-5" />
                          </div>
                          <span className="inline-flex items-center gap-1 rounded-full bg-blue-600/10 px-2 py-0.5 text-[10px] font-bold text-blue-600 dark:text-blue-400">
                            <Icon name="security" className="h-3 w-3" /> ADMIN
                          </span>
                        </div>
                        <h4 className="font-bold text-slate-900 dark:text-slate-100">Invite Users</h4>
                        <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                          Invite new users to this tenant.
                        </p>
                      </div>

                      <div className="mt-4">
                        <Link
                          className="inline-flex w-full items-center justify-center rounded-lg border border-slate-200 bg-white py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-950"
                          to={`/t/${tenantSlug}/invites`}
                        >
                          Invite Users
                        </Link>
                      </div>
                    </div>

                    {/* Tenant Analytics */}
                    <div className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-5 transition-shadow hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="rounded-lg bg-slate-50 p-2 text-slate-600 dark:bg-slate-950 dark:text-slate-300">
                            <Icon name="analytics" className="h-5 w-5" />
                          </div>
                          <span className="inline-flex items-center gap-1 rounded-full bg-blue-600/10 px-2 py-0.5 text-[10px] font-bold text-blue-600 dark:text-blue-400">
                            <Icon name="security" className="h-3 w-3" /> ADMIN
                          </span>
                        </div>
                        <h4 className="font-bold text-slate-900 dark:text-slate-100">Tenant Analytics</h4>
                        <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                          View tenant-level metrics.
                        </p>
                      </div>

                      <div className="mt-4">
                        <Link
                          className="inline-flex w-full items-center justify-center rounded-lg border border-slate-200 bg-white py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-950"
                          to={`/t/${tenantSlug}/analytics`}
                        >
                          View Analytics
                        </Link>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                /* ================= Member View ================= */
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                  <div className="flex items-start gap-3">
                    <span className="mt-0.5 text-blue-600 dark:text-blue-400" aria-hidden="true">
                      <Icon name="info" className="h-5 w-5" />
                    </span>
                    <div>
                      <h4 className="font-semibold text-slate-900 dark:text-slate-100">Member View</h4>
                      <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                        You are a tenant member. Admin panels (Members, Invites, Analytics, Settings) are hidden.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Access notice (design-only; keep message present without changing role logic) */}
              <div className="flex items-start gap-3 rounded-xl border border-blue-100 bg-blue-50/60 p-4 dark:border-blue-900/40 dark:bg-blue-900/10">
                <span className="mt-0.5 text-blue-600 dark:text-blue-400" aria-hidden="true">
                  <Icon name="info" className="h-5 w-5" />
                </span>
                <div>
                  <h5 className="text-sm font-bold text-blue-900 dark:text-blue-200">Access Notice</h5>
                  <p className="mt-1 text-xs leading-relaxed text-blue-700 dark:text-blue-300">
                    Some management panels are restricted to tenant administrators. Contact your workspace owner to request elevated permissions if needed.
                  </p>
                </div>
              </div>
            </div>

            {/* Right: Recent Activity Placeholder (pure UI) */}
            <aside className="space-y-4">
              <div className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="mb-6 flex items-center justify-between">
                  <h4 className="font-bold text-slate-900 dark:text-slate-100">Recent Activity</h4>
                  <span className="text-slate-400 dark:text-slate-500" aria-hidden="true">
                    <Icon name="history" className="h-5 w-5" />
                  </span>
                </div>

                <div className="flex flex-1 flex-col justify-center space-y-4">
                  {Array.from({ length: 3 }).map((_, idx) => (
                    <div key={idx} className="flex items-center gap-3">
                      <div className="h-10 w-10 animate-pulse rounded-full bg-slate-100 dark:bg-slate-800" />
                      <div className="flex-1 space-y-2">
                        <div className="h-3 w-3/4 animate-pulse rounded bg-slate-100 dark:bg-slate-800" />
                        <div className="h-2 w-1/2 animate-pulse rounded bg-slate-50 dark:bg-slate-950" />
                      </div>
                    </div>
                  ))}
                  <div className="pt-4 text-center">
                    <p className="text-xs font-medium text-slate-400 dark:text-slate-500">No recent activity available</p>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </section>

        {/* 7) Footnote / Note */}
        <footer className="border-t border-slate-200 pt-6 dark:border-slate-800">
          <div className="flex flex-col items-start justify-between gap-4 text-xs text-slate-500 dark:text-slate-400 sm:flex-row sm:items-center">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Note: server enforces tenant membership and role. UI only hides/shows sections for better UX.
            </p>

            <div className="hidden items-center gap-2 sm:flex">
              <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 font-medium text-slate-600 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300">
                {tenantSlug}
              </span>
              <span className="text-slate-300 dark:text-slate-700">•</span>
              <span className="font-medium text-slate-600 dark:text-slate-300">{user?.email}</span>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}

