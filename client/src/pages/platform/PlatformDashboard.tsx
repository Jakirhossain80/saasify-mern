// FILE: client/src/pages/platform/PlatformDashboard.tsx
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { http } from "../../api/http";
import { API } from "../../api/endpoints";
import PageShell from "../../components/common/PageShell";

type Tenant = {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string;
  isArchived?: boolean;
  createdAt?: string;
};

type TenantsResponse = {
  items: Tenant[];
  total?: number;
  page?: number;
  limit?: number;
};

type AssignAdminPayload = { email: string };
type AssignAdminResponse = {
  membership: {
    id: string;
    tenantId: string;
    userId: string;
    role: "tenantAdmin" | "member";
    status: "active" | "removed";
  };
};

type PlatformAnalyticsResponse = {
  totalTenants: number;
  activeTenants: number;
  totalProjects: number;
  chartData: Array<{ name: string; value: number }>;
};

type ApiError = {
  message?: string;
  response?: {
    data?: {
      message?: string;
      code?: string;
    };
  };
};

function asApiError(e: unknown): ApiError {
  return (e ?? {}) as ApiError;
}

function getErrorMessage(e: unknown, fallback: string) {
  const err = asApiError(e);
  return err?.response?.data?.message || err?.message || fallback;
}

function getErrorCode(e: unknown) {
  const err = asApiError(e);
  return err?.response?.data?.code;
}

function normalizeSlug(input: string) {
  return input
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function getInitials(name: string) {
  const cleaned = name.trim();
  if (!cleaned) return "T";
  const parts = cleaned.split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] ?? "";
  const second = (parts[1]?.[0] ?? parts[0]?.[1] ?? "") || "";
  return (first + second).toUpperCase();
}

export default function PlatformDashboard() {
  const qc = useQueryClient();

  const [page, setPage] = useState(1);
  const [q, setQ] = useState("");

  // ✅ FIX:
  // show archived tenants by default so unarchive is always easy
  const [includeArchived, setIncludeArchived] = useState(true);

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [logoUrl, setLogoUrl] = useState("");

  const slugPreview = useMemo(() => normalizeSlug(slug || name), [slug, name]);

  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [selectedTenantId, setSelectedTenantId] = useState<string | null>(null);
  const [adminEmail, setAdminEmail] = useState("");

  function openAssignAdminModal(tenantId: string) {
    setSelectedTenantId(tenantId);
    setAdminEmail("");
    setIsAssignOpen(true);
  }

  function closeAssignAdminModal() {
    setIsAssignOpen(false);
    setSelectedTenantId(null);
    setAdminEmail("");
  }

  const analyticsQuery = useQuery({
    queryKey: ["platformAnalytics"],
    queryFn: async () => {
      const { data } = await http.get<PlatformAnalyticsResponse>(API.platform.analytics);
      return data;
    },
    staleTime: 0,
  });

  const tenantsQuery = useQuery({
    queryKey: ["platformTenants", page, q, includeArchived],
    queryFn: async () => {
      const { data } = await http.get<TenantsResponse>(API.platform.tenants, {
        params: {
          page,
          q: q.trim() || undefined,
          includeArchived,
        },
      });

      return data?.items ?? [];
    },
    staleTime: 0,
  });

  const tenants = tenantsQuery.data ?? [];
  const errorMessage = getErrorMessage(tenantsQuery.error, "Failed to load tenants");

  const createTenant = useMutation({
    mutationFn: async (input: { name: string; slug: string; logoUrl?: string }) => {
      const { data } = await http.post(API.platform.tenants, input);
      return data;
    },
    onSuccess: () => {
      toast.success("Tenant created");
      setName("");
      setSlug("");
      setLogoUrl("");

      qc.invalidateQueries({ queryKey: ["platformTenants"] });
      qc.invalidateQueries({ queryKey: ["platformAnalytics"] });
    },
    onError: (e: unknown) => {
      const code = getErrorCode(e);
      const msg = getErrorMessage(e, "Failed to create tenant");

      if (code === "SLUG_TAKEN") {
        toast.error("Slug already exists. Choose a different slug.");
        return;
      }
      toast.error(msg);
    },
  });

  const archiveTenant = useMutation({
    mutationFn: async (tenantId: string) => {
      const { data } = await http.patch(API.platform.archiveTenant(tenantId), {});
      return data;
    },
    onSuccess: () => {
      // ✅ keep archived rows visible immediately after archive
      setIncludeArchived(true);

      toast.success("Tenant archived");
      qc.invalidateQueries({ queryKey: ["platformTenants"] });
      qc.invalidateQueries({ queryKey: ["platformAnalytics"] });
    },
    onError: (e: unknown) => {
      toast.error(getErrorMessage(e, "Failed to archive tenant"));
    },
  });

  const unarchiveTenant = useMutation({
    mutationFn: async (tenantId: string) => {
      const { data } = await http.patch(API.platform.unarchiveTenant(tenantId), {});
      return data;
    },
    onSuccess: () => {
      // ✅ keep same view stable after unarchive
      setIncludeArchived(true);

      toast.success("Tenant unarchived");
      qc.invalidateQueries({ queryKey: ["platformTenants"] });
      qc.invalidateQueries({ queryKey: ["platformAnalytics"] });
    },
    onError: (e: unknown) => {
      toast.error(getErrorMessage(e, "Failed to unarchive tenant"));
    },
  });

  const deleteTenant = useMutation({
    mutationFn: async (tenantId: string) => {
      const { data } = await http.delete(API.platform.deleteTenant(tenantId));
      return data;
    },
    onSuccess: () => {
      toast.success("Tenant deleted");
      qc.invalidateQueries({ queryKey: ["platformTenants"] });
      qc.invalidateQueries({ queryKey: ["platformAnalytics"] });
    },
    onError: (e: unknown) => {
      toast.error(getErrorMessage(e, "Failed to delete tenant"));
    },
  });

  const assignTenantAdmin = useMutation({
    mutationFn: async (input: { tenantId: string; email: string }) => {
      const payload: AssignAdminPayload = { email: input.email.trim().toLowerCase() };
      const { data } = await http.post<AssignAdminResponse>(
        API.platform.assignTenantAdmin(input.tenantId),
        payload
      );
      return data;
    },
    onSuccess: () => {
      toast.success("Tenant Admin assigned");

      if (selectedTenantId) {
        qc.invalidateQueries({ queryKey: ["tenantMembers", selectedTenantId] });
      }
      qc.invalidateQueries({ queryKey: ["platformTenants"] });
      qc.invalidateQueries({ queryKey: ["platformAnalytics"] });

      closeAssignAdminModal();
    },
    onError: (e: unknown) => {
      toast.error(getErrorMessage(e, "Failed to assign tenant admin"));
    },
  });

  const analytics = analyticsQuery.data;
  const suspendedTenants =
    analytics && Number.isFinite(analytics.totalTenants - analytics.activeTenants)
      ? Math.max(0, analytics.totalTenants - analytics.activeTenants)
      : null;

  return (
    <PageShell title="Platform Dashboard">
      <div className="min-h-full">
        <div className="sticky top-0 z-30 -mx-4 mb-8 border-b border-slate-200/80 bg-white/75 backdrop-blur-md dark:border-slate-800/80 dark:bg-slate-900/75 sm:-mx-6 lg:-mx-8">
          <div className="flex items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3">
              <span className="inline-flex h-2 w-2 animate-pulse rounded-full bg-blue-600" />
              <span className="text-xs font-semibold uppercase tracking-tight text-slate-700 dark:text-slate-200">
                Platform Admin Only — Manage Tenants
              </span>
            </div>
            <span className="hidden rounded-lg border border-slate-200 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 sm:inline-flex">
              Including Archived: {includeArchived ? "ON" : "OFF"}
            </span>
          </div>
        </div>

        <div className="mx-auto max-w-7xl space-y-8">
          <section className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <p className="mb-2 text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Total Tenants
              </p>
              <div className="flex items-end justify-between gap-3">
                <h3 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
                  {analyticsQuery.isSuccess && analytics ? analytics.totalTenants : "—"}
                </h3>
                <span className="rounded-lg bg-emerald-50 px-2 py-1 text-xs font-bold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
                  Live
                </span>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <p className="mb-2 text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Active Tenants
              </p>
              <div className="flex items-end justify-between gap-3">
                <h3 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
                  {analyticsQuery.isSuccess && analytics ? analytics.activeTenants : "—"}
                </h3>
                <span className="rounded-lg bg-blue-50 px-2 py-1 text-xs font-bold text-blue-700 dark:bg-blue-500/10 dark:text-blue-300">
                  LIVE
                </span>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <p className="mb-2 text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Suspended Tenants
              </p>
              <div className="flex items-end justify-between gap-3">
                <h3 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
                  {analyticsQuery.isSuccess && analytics ? (suspendedTenants ?? "—") : "—"}
                </h3>
                <span className="rounded-lg bg-amber-50 px-2 py-1 text-xs font-bold text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">
                  REVIEW
                </span>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <p className="mb-2 text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Total Users
              </p>
              <div className="flex items-end justify-between gap-3">
                <h3 className="text-3xl font-bold text-slate-400 dark:text-slate-500">—</h3>
                <span className="rounded-lg bg-slate-100 px-2 py-1 text-xs font-bold uppercase text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                  Soon
                </span>
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Analytics</h2>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Quick overview of platform usage.
                </p>
              </div>

              <button
                onClick={() => {
                  tenantsQuery.refetch();
                  analyticsQuery.refetch();
                }}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                type="button"
              >
                <svg
                  className="h-4 w-4 text-slate-500 dark:text-slate-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                Refresh
              </button>
            </div>

            {analyticsQuery.isLoading && (
              <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-3">
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 lg:col-span-2">
                  <div className="h-5 w-40 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
                  <div className="mt-6 h-64 w-full animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800" />
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                  <div className="h-5 w-48 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
                  <div className="mt-6 space-y-3">
                    <div className="h-10 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800" />
                    <div className="h-10 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800" />
                    <div className="h-10 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800" />
                    <div className="h-10 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800" />
                  </div>
                </div>
              </div>
            )}

            {analyticsQuery.isError && (
              <div className="rounded-2xl border border-rose-200 bg-white p-5 shadow-sm dark:border-rose-900/40 dark:bg-slate-900">
                <p className="text-sm font-medium text-rose-700 dark:text-rose-300">
                  Failed to load analytics.
                </p>
                <p className="mt-1 text-sm text-slate-700 dark:text-slate-300">
                  {getErrorMessage(analyticsQuery.error, "Unknown error")}
                </p>
              </div>
            )}

            {analyticsQuery.isSuccess && analytics && (
              <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-3">
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 lg:col-span-2">
                  <div className="mb-8 flex items-center justify-between gap-3">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                      Usage Breakdown
                    </h3>
                    <div className="flex items-center gap-2">
                      <span className="inline-flex h-3 w-3 rounded-full border border-blue-600 bg-blue-600/20" />
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        Last 30 days
                      </span>
                    </div>
                  </div>

                  <div className="relative mb-6 flex h-48 w-full items-end justify-between gap-4 border-b border-slate-100 px-4 pb-2 dark:border-slate-800">
                    <div className="h-[40%] w-full cursor-pointer rounded-t-lg bg-slate-50 transition-all hover:bg-blue-600/20 dark:bg-slate-800" />
                    <div className="h-[65%] w-full cursor-pointer rounded-t-lg bg-slate-50 transition-all hover:bg-blue-600/20 dark:bg-slate-800" />
                    <div className="h-[85%] w-full rounded-t-lg bg-blue-600" />
                    <div className="h-[50%] w-full cursor-pointer rounded-t-lg bg-slate-50 transition-all hover:bg-blue-600/20 dark:bg-slate-800" />
                    <div className="h-[30%] w-full cursor-pointer rounded-t-lg bg-slate-50 transition-all hover:bg-blue-600/20 dark:bg-slate-800" />
                    <div className="h-[45%] w-full cursor-pointer rounded-t-lg bg-slate-50 transition-all hover:bg-blue-600/20 dark:bg-slate-800" />
                    <div className="h-[60%] w-full cursor-pointer rounded-t-lg bg-slate-50 transition-all hover:bg-blue-600/20 dark:bg-slate-800" />
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4 text-center dark:border-slate-800 dark:bg-slate-800/40">
                      <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                        Total Tenants
                      </p>
                      <p className="text-lg font-bold text-slate-900 dark:text-slate-100">
                        {analytics.totalTenants}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4 text-center dark:border-slate-800 dark:bg-slate-800/40">
                      <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                        Active Tenants
                      </p>
                      <p className="text-lg font-bold text-slate-900 dark:text-slate-100">
                        {analytics.activeTenants}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4 text-center dark:border-slate-800 dark:bg-slate-800/40">
                      <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                        Total Projects
                      </p>
                      <p className="text-lg font-bold text-slate-900 dark:text-slate-100">
                        {analytics.totalProjects}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                  <div className="mb-6 flex items-center justify-between gap-3">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                      Data Mapping
                    </h3>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                      live
                    </span>
                  </div>

                  <div className="space-y-2">
                    {(analytics.chartData ?? []).map((item) => (
                      <div
                        key={item.name}
                        className="flex items-center justify-between gap-3 rounded-xl p-3 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800"
                      >
                        <div className="min-w-0 flex items-center gap-3">
                          <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-blue-600" />
                          <span className="truncate text-sm font-medium text-slate-700 dark:text-slate-200">
                            {item.name}
                          </span>
                        </div>
                        <span className="font-mono text-sm text-slate-500 dark:text-slate-400">
                          {item.value}
                        </span>
                      </div>
                    ))}
                  </div>

                  <button
                    type="button"
                    className="mt-6 w-full rounded-xl border border-slate-200 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-800 dark:text-slate-200 dark:hover:bg-slate-800"
                  >
                    Download Detailed Report
                  </button>
                </div>
              </div>
            )}
          </section>

          <section className="flex flex-col items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 md:flex-row">
            <div className="relative w-full md:w-96">
              <svg
                className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400 dark:text-slate-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>

              <input
                className="w-full rounded-xl border border-slate-200/0 bg-slate-50 py-2 pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500"
                value={q}
                onChange={(e) => {
                  setPage(1);
                  setQ(e.target.value);
                }}
                placeholder="Search tenants by name or slug"
              />
            </div>

            <div className="flex items-center gap-6">
              <label className="flex cursor-pointer items-center gap-3">
                <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                  {includeArchived ? "Showing archived + active" : "Showing active only"}
                </span>
                <span className="relative inline-flex items-center">
                  <input
                    className="peer sr-only"
                    type="checkbox"
                    checked={includeArchived}
                    onChange={(e) => {
                      setPage(1);
                      setIncludeArchived(e.target.checked);
                    }}
                  />
                  <span className="peer h-6 w-11 rounded-full bg-slate-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-slate-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-blue-600 peer-checked:after:translate-x-full peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500/20 dark:bg-slate-700 dark:after:border-slate-600" />
                </span>
              </label>

              <button
                onClick={() => {
                  tenantsQuery.refetch();
                  analyticsQuery.refetch();
                }}
                className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:text-slate-300 dark:hover:bg-slate-800"
                type="button"
              >
                <svg
                  className="h-5 w-5 text-slate-500 dark:text-slate-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                Refresh
              </button>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-6 flex items-end justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                  Onboard New Tenant
                </h2>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                  Name + slug (URL-friendly). Logo URL optional.
                </p>
              </div>
              <span className="hidden text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 sm:inline-flex">
                Provision
              </span>
            </div>

            <form
              className="grid grid-cols-1 items-end gap-6 md:grid-cols-3"
              onSubmit={(e) => {
                e.preventDefault();

                const finalName = name.trim();
                const finalSlug = normalizeSlug(slug || name);
                const finalLogo = logoUrl.trim();

                if (finalName.length < 2) return toast.error("Name must be at least 2 characters.");
                if (finalSlug.length < 2) return toast.error("Slug must be at least 2 characters.");

                createTenant.mutate({
                  name: finalName,
                  slug: finalSlug,
                  logoUrl: finalLogo,
                });
              }}
            >
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                  Tenant Name
                </label>
                <input
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Acme Corp"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                  Tenant Slug
                </label>
                <div className="flex">
                  <span className="inline-flex items-center rounded-l-xl border border-r-0 border-slate-200 bg-slate-100 px-3 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-700">
                    /t/
                  </span>
                  <input
                    className="w-full rounded-r-xl border border-slate-200 bg-slate-50 px-4 py-2.5 font-mono text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    placeholder="acme-corp"
                  />
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Preview:{" "}
                  <span className="rounded-md bg-slate-100 px-2 py-0.5 font-mono text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                    /t/{slugPreview || "tenant-slug"}
                  </span>
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                  Logo URL
                </label>
                <input
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500"
                  value={logoUrl}
                  onChange={(e) => setLogoUrl(e.target.value)}
                  placeholder="https://..."
                />
              </div>

              <div className="flex justify-end md:col-span-3">
                <button
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-8 py-2.5 text-sm font-bold text-white shadow-lg shadow-blue-600/20 transition-colors hover:bg-blue-700 disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  type="submit"
                  disabled={createTenant.isPending}
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  {createTenant.isPending ? "Creating..." : "Create Tenant"}
                </button>
              </div>
            </form>
          </section>

          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex flex-col gap-4 border-b border-slate-100 px-6 py-5 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="leading-tighttext-slate-900 text-xl font-bold dark:text-slate-100">
                  Tenants
                </h2>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  page={page}, q="{q}", includeArchived={String(includeArchived)}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-50 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:opacity-30 dark:hover:bg-slate-800 dark:hover:text-slate-100"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  title="Previous page"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                  </svg>
                </button>

                <span className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-bold text-white dark:bg-slate-100 dark:text-slate-900">
                  Page {page}
                </span>

                <button
                  type="button"
                  className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-50 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:hover:bg-slate-800 dark:hover:text-slate-100"
                  onClick={() => setPage((p) => p + 1)}
                  title="Next page"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>

            {tenantsQuery.isLoading && (
              <div className="p-6">
                <div className="space-y-3">
                  <div className="h-10 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800" />
                  <div className="h-10 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800" />
                  <div className="h-10 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800" />
                  <div className="h-10 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800" />
                </div>
              </div>
            )}

            {tenantsQuery.isError && (
              <div className="p-6">
                <div className="rounded-2xl border border-rose-200 bg-rose-50/40 p-4 dark:border-rose-900/40 dark:bg-rose-900/10">
                  <p className="text-sm font-medium text-rose-700 dark:text-rose-300">
                    Failed to load tenants.
                  </p>
                  <p className="mt-1 text-sm text-slate-700 dark:text-slate-300">{errorMessage}</p>
                </div>
              </div>
            )}

            {tenantsQuery.isSuccess && tenants.length === 0 && (
              <div className="p-6">
                <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-6 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-800/40 dark:text-slate-300">
                  No tenants found
                </div>
              </div>
            )}

            {tenantsQuery.isSuccess && tenants.length > 0 && (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-left">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-800/50">
                        <th className="border-b border-slate-100 px-6 py-4 text-xs font-bold uppercase tracking-widest text-slate-500 dark:border-slate-800 dark:text-slate-400">
                          Tenant
                        </th>
                        <th className="border-b border-slate-100 px-6 py-4 text-xs font-bold uppercase tracking-widest text-slate-500 dark:border-slate-800 dark:text-slate-400">
                          Slug
                        </th>
                        <th className="border-b border-slate-100 px-6 py-4 text-xs font-bold uppercase tracking-widest text-slate-500 dark:border-slate-800 dark:text-slate-400">
                          Direct Link
                        </th>
                        <th className="border-b border-slate-100 px-6 py-4 text-right text-xs font-bold uppercase tracking-widest text-slate-500 dark:border-slate-800 dark:text-slate-400">
                          Actions
                        </th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {tenants.map((t) => (
                        <tr
                          key={t.id}
                          className={[
                            "transition-colors",
                            t.isArchived
                              ? "bg-amber-50/50 hover:bg-amber-50 dark:bg-amber-500/5 dark:hover:bg-amber-500/10"
                              : "hover:bg-slate-50/50 dark:hover:bg-slate-800/30",
                          ].join(" ")}
                        >
                          <td className="px-6 py-4">
                            <div className="flex min-w-0 items-center gap-3">
                              <div className="flex size-8 items-center justify-center rounded-lg bg-slate-100 text-xs font-bold text-slate-900 dark:bg-slate-700 dark:text-slate-100">
                                {getInitials(t.name)}
                              </div>
                              <div className="min-w-0">
                                <div className="flex min-w-0 items-center gap-2">
                                  <span className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
                                    {t.name}
                                  </span>
                                  {t.isArchived ? (
                                    <span className="rounded-full border border-amber-200 bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-amber-800 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300">
                                      Archived
                                    </span>
                                  ) : (
                                    <span className="rounded-full border border-emerald-200 bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-800 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300">
                                      Active
                                    </span>
                                  )}
                                </div>
                                <div className="truncate text-[11px] text-slate-500 dark:text-slate-400">
                                  {t.logoUrl ? t.logoUrl : t.slug}
                                </div>
                              </div>
                            </div>
                          </td>

                          <td className="px-6 py-4">
                            <span className="rounded bg-slate-100 px-2 py-1 font-mono text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                              {t.slug}
                            </span>
                          </td>

                          <td className="px-6 py-4">
                            <a
                              className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline dark:text-blue-400"
                              href={`/t/${t.slug}`}
                            >
                              /t/{t.slug}
                              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth="2"
                                  d="M14 3h7v7m0-7L10 14M5 7v12h12"
                                />
                              </svg>
                            </a>
                          </td>

                          <td className="px-6 py-4">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                type="button"
                                className="rounded-lg p-2 text-slate-400 transition-all hover:bg-blue-600/5 hover:text-blue-600 disabled:opacity-60 dark:hover:bg-blue-500/10"
                                onClick={() => openAssignAdminModal(t.id)}
                                disabled={assignTenantAdmin.isPending}
                                title="Assign Admin"
                                aria-label="Assign Admin"
                              >
                                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 21v-2a4 4 0 00-4-4H7a4 4 0 00-4 4v2" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 7a4 4 0 110 8 4 4 0 010-8z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 8v6m3-3h-6" />
                                </svg>
                              </button>

                              {!t.isArchived ? (
                                <button
                                  type="button"
                                  className="rounded-lg p-2 text-slate-400 transition-all hover:bg-amber-50 hover:text-amber-600 disabled:opacity-60 dark:hover:bg-amber-500/10"
                                  onClick={() => {
                                    const ok = window.confirm(
                                      `Archive tenant "${t.name}"?\n\nYou can unarchive it later.`
                                    );
                                    if (ok) archiveTenant.mutate(t.id);
                                  }}
                                  disabled={archiveTenant.isPending}
                                  title="Archive"
                                  aria-label="Archive"
                                >
                                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-1 14H5L4 7" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 11h6" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7h18l-1-3H4L3 7z" />
                                  </svg>
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  className="rounded-lg p-2 text-slate-400 transition-all hover:bg-emerald-50 hover:text-emerald-600 disabled:opacity-60 dark:hover:bg-emerald-500/10"
                                  onClick={() => {
                                    const ok = window.confirm(
                                      `Unarchive tenant "${t.name}"?\n\nThis will make it active again.`
                                    );
                                    if (ok) unarchiveTenant.mutate(t.id);
                                  }}
                                  disabled={unarchiveTenant.isPending}
                                  title="Unarchive"
                                  aria-label="Unarchive"
                                >
                                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-1 14H5L4 7" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 11h6" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7h18l-1-3H4L3 7z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15V9m0 0l-2 2m2-2l2 2" />
                                  </svg>
                                </button>
                              )}

                              <button
                                type="button"
                                className="rounded-lg p-2 text-slate-400 transition-all hover:bg-rose-50 hover:text-rose-600 disabled:opacity-60 dark:hover:bg-rose-500/10"
                                onClick={() => {
                                  const ok = window.confirm(
                                    `Delete tenant "${t.name}"?\n\nThis is permanent. Safe delete may block if the tenant still has projects or memberships.`
                                  );
                                  if (ok) deleteTenant.mutate(t.id);
                                }}
                                disabled={deleteTenant.isPending}
                                title="Delete"
                                aria-label="Delete"
                              >
                                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 11v6m4-6v6" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 7h6m2 0H7m3-3h4a1 1 0 011 1v2H9V5a1 1 0 011-1z" />
                                </svg>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="border-t border-slate-100 bg-slate-50 p-4 text-xs text-slate-600 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-400">
                  Archive is reversible. Archived tenants stay visible here when{" "}
                  <span className="font-semibold">Showing archived + active</span> is enabled, and can be restored with the{" "}
                  <span className="font-semibold">Unarchive</span> action.
                </div>
              </>
            )}
          </section>

          {isAssignOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
              <div className="w-full max-w-md overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900">
                <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-6 py-5 dark:border-slate-800">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                      Assign Tenant Admin
                    </h2>
                    <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                      Enter a user email. Membership will be upserted as{" "}
                      <span className="font-mono">tenantAdmin</span> +{" "}
                      <span className="font-mono">active</span>.
                    </p>
                  </div>

                  <button
                    type="button"
                    className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-50 hover:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                    onClick={closeAssignAdminModal}
                    disabled={assignTenantAdmin.isPending}
                    aria-label="Close"
                    title="Close"
                  >
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="space-y-4 p-6">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase text-slate-700 dark:text-slate-200">
                      User Email Address
                    </label>
                    <input
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500"
                      value={adminEmail}
                      onChange={(e) => setAdminEmail(e.target.value)}
                      placeholder="admin@tenant.com"
                      autoFocus
                      type="email"
                    />
                  </div>

                  <div className="flex items-start gap-2 rounded-xl border border-amber-100 bg-amber-50 p-3 text-xs leading-snug text-amber-800 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-200">
                    <svg
                      className="mt-0.5 h-5 w-5 shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    This user must already exist in the global platform database.
                  </div>
                </div>

                <div className="flex flex-row-reverse gap-3 border-t border-slate-100 bg-slate-50 px-6 py-4 dark:border-slate-800 dark:bg-slate-800/50">
                  <button
                    type="button"
                    className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    disabled={assignTenantAdmin.isPending || !selectedTenantId || !adminEmail.trim()}
                    onClick={() => {
                      if (!selectedTenantId) return;
                      assignTenantAdmin.mutate({
                        tenantId: selectedTenantId,
                        email: adminEmail,
                      });
                    }}
                  >
                    {assignTenantAdmin.isPending ? "Assigning..." : "Assign Privileges"}
                  </button>

                  <button
                    type="button"
                    className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-100 disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                    onClick={closeAssignAdminModal}
                    disabled={assignTenantAdmin.isPending}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </PageShell>
  );
}

