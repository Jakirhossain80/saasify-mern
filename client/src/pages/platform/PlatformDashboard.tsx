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
  const [includeArchived, setIncludeArchived] = useState(false);

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
      const { data } = await http.post<AssignAdminResponse>(API.platform.assignTenantAdmin(input.tenantId), payload);
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
        {/* Context Bar (Stitch-style) */}
        <div className="sticky top-0 z-30 -mx-4 sm:-mx-6 lg:-mx-8 mb-8 border-b border-slate-200/80 bg-white/75 backdrop-blur-md dark:bg-slate-900/75 dark:border-slate-800/80">
          <div className="px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="inline-flex h-2 w-2 rounded-full bg-blue-600 animate-pulse" />
              <span className="text-xs font-semibold text-slate-700 uppercase tracking-tight dark:text-slate-200">
                Platform Admin Only — Manage Tenants
              </span>
            </div>
            <span className="px-2.5 py-1 bg-slate-100 text-slate-600 text-[10px] font-bold uppercase tracking-widest rounded-lg border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700">
              Enterprise
            </span>
          </div>
        </div>

        <div className="mx-auto max-w-7xl space-y-8">
          {/* KPI Cards (Stitch-style) */}
          <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <p className="text-slate-500 dark:text-slate-400 text-xs font-medium uppercase tracking-wider mb-2">
                Total Tenants
              </p>
              <div className="flex items-end justify-between gap-3">
                <h3 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
                  {analyticsQuery.isSuccess && analytics ? analytics.totalTenants : "—"}
                </h3>
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-lg dark:text-emerald-300 dark:bg-emerald-500/10">
                  Live
                </span>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <p className="text-slate-500 dark:text-slate-400 text-xs font-medium uppercase tracking-wider mb-2">
                Active Tenants
              </p>
              <div className="flex items-end justify-between gap-3">
                <h3 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
                  {analyticsQuery.isSuccess && analytics ? analytics.activeTenants : "—"}
                </h3>
                <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2 py-1 rounded-lg dark:text-blue-300 dark:bg-blue-500/10">
                  LIVE
                </span>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <p className="text-slate-500 dark:text-slate-400 text-xs font-medium uppercase tracking-wider mb-2">
                Suspended Tenants
              </p>
              <div className="flex items-end justify-between gap-3">
                <h3 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
                  {analyticsQuery.isSuccess && analytics ? (suspendedTenants ?? "—") : "—"}
                </h3>
                <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2 py-1 rounded-lg dark:text-amber-300 dark:bg-amber-500/10">
                  REVIEW
                </span>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <p className="text-slate-500 dark:text-slate-400 text-xs font-medium uppercase tracking-wider mb-2">
                Total Users
              </p>
              <div className="flex items-end justify-between gap-3">
                <h3 className="text-3xl font-bold text-slate-400 dark:text-slate-500">—</h3>
                <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded-lg uppercase dark:bg-slate-800 dark:text-slate-400">
                  Soon
                </span>
              </div>
            </div>
          </section>

          {/* Analytics */}
          <section className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Analytics</h2>
                <p className="text-sm text-slate-600 dark:text-slate-400">Quick overview of platform usage.</p>
              </div>

              <button
                onClick={() => {
                  tenantsQuery.refetch();
                  analyticsQuery.refetch();
                }}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-200 dark:hover:bg-slate-800"
                type="button"
              >
                <svg className="h-4 w-4 text-slate-500 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
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
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
                <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                  <div className="h-5 w-40 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
                  <div className="mt-6 h-64 w-full bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" />
                </div>
                <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                  <div className="h-5 w-48 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
                  <div className="mt-6 space-y-3">
                    <div className="h-10 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" />
                    <div className="h-10 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" />
                    <div className="h-10 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" />
                    <div className="h-10 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" />
                  </div>
                </div>
              </div>
            )}

            {analyticsQuery.isError && (
              <div className="bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-900/40 rounded-2xl p-5 shadow-sm">
                <p className="text-sm font-medium text-rose-700 dark:text-rose-300">Failed to load analytics.</p>
                <p className="mt-1 text-sm text-slate-700 dark:text-slate-300">
                  {getErrorMessage(analyticsQuery.error, "Unknown error")}
                </p>
              </div>
            )}

            {analyticsQuery.isSuccess && analytics && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
                {/* Usage Breakdown (visual container only) */}
                <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                  <div className="flex items-center justify-between gap-3 mb-8">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Usage Breakdown</h3>
                    <div className="flex items-center gap-2">
                      <span className="inline-flex h-3 w-3 rounded-full bg-blue-600/20 border border-blue-600" />
                      <span className="text-xs text-slate-500 dark:text-slate-400">Last 30 days</span>
                    </div>
                  </div>

                  <div className="relative h-48 w-full px-4 pb-2 mb-6 border-b border-slate-100 dark:border-slate-800 flex items-end justify-between gap-4">
                    <div className="w-full bg-slate-50 dark:bg-slate-800 rounded-t-lg h-[40%] hover:bg-blue-600/20 transition-all cursor-pointer" />
                    <div className="w-full bg-slate-50 dark:bg-slate-800 rounded-t-lg h-[65%] hover:bg-blue-600/20 transition-all cursor-pointer" />
                    <div className="w-full bg-blue-600 rounded-t-lg h-[85%]" />
                    <div className="w-full bg-slate-50 dark:bg-slate-800 rounded-t-lg h-[50%] hover:bg-blue-600/20 transition-all cursor-pointer" />
                    <div className="w-full bg-slate-50 dark:bg-slate-800 rounded-t-lg h-[30%] hover:bg-blue-600/20 transition-all cursor-pointer" />
                    <div className="w-full bg-slate-50 dark:bg-slate-800 rounded-t-lg h-[45%] hover:bg-blue-600/20 transition-all cursor-pointer" />
                    <div className="w-full bg-slate-50 dark:bg-slate-800 rounded-t-lg h-[60%] hover:bg-blue-600/20 transition-all cursor-pointer" />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 p-4 text-center">
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold tracking-widest mb-1">
                        Total Tenants
                      </p>
                      <p className="text-lg font-bold text-slate-900 dark:text-slate-100">{analytics.totalTenants}</p>
                    </div>

                    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 p-4 text-center">
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold tracking-widest mb-1">
                        Active Tenants
                      </p>
                      <p className="text-lg font-bold text-slate-900 dark:text-slate-100">{analytics.activeTenants}</p>
                    </div>

                    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 p-4 text-center">
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold tracking-widest mb-1">
                        Total Projects
                      </p>
                      <p className="text-lg font-bold text-slate-900 dark:text-slate-100">{analytics.totalProjects}</p>
                    </div>
                  </div>
                </div>

                {/* Chart Data Breakdown (existing mapping preserved) */}
                <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                  <div className="flex items-center justify-between gap-3 mb-6">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Data Mapping</h3>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                      live
                    </span>
                  </div>

                  <div className="space-y-2">
                    {(analytics.chartData ?? []).map((item) => (
                      <div
                        key={item.name}
                        className="flex items-center justify-between gap-3 p-3 rounded-xl transition-colors hover:bg-slate-50 dark:hover:bg-slate-800"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="h-2.5 w-2.5 rounded-full bg-blue-600 shrink-0" />
                          <span className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate">{item.name}</span>
                        </div>
                        <span className="font-mono text-sm text-slate-500 dark:text-slate-400">{item.value}</span>
                      </div>
                    ))}
                  </div>

                  <button
                    type="button"
                    className="w-full mt-6 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                  >
                    Download Detailed Report
                  </button>
                </div>
              </div>
            )}
          </section>

          {/* Filters Toolbar (Stitch-style) */}
          <section className="flex flex-col md:flex-row items-center justify-between gap-4 p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="relative w-full md:w-96">
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 dark:text-slate-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>

              <input
                className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200/0 rounded-xl text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                value={q}
                onChange={(e) => {
                  setPage(1);
                  setQ(e.target.value);
                }}
                placeholder="Search tenants by name or slug"
              />
            </div>

            <div className="flex items-center gap-6">
              <label className="flex items-center cursor-pointer gap-3">
                <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                  {includeArchived ? "Including archived" : "Active only"}
                </span>
                <span className="relative inline-flex items-center">
                  <input
                    className="sr-only peer"
                    type="checkbox"
                    checked={includeArchived}
                    onChange={(e) => {
                      setPage(1);
                      setIncludeArchived(e.target.checked);
                    }}
                  />
                  <span className="w-11 h-6 bg-slate-200 dark:bg-slate-700 rounded-full peer peer-checked:bg-blue-600 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500/20 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:border-slate-300 dark:after:border-slate-600 after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full" />
                </span>
              </label>

              <button
                onClick={() => {
                  tenantsQuery.refetch();
                  analyticsQuery.refetch();
                }}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                type="button"
              >
                <svg className="h-5 w-5 text-slate-500 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
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

          {/* Create Tenant (Stitch-style) */}
          <section className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-end justify-between gap-4 mb-6">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Onboard New Tenant</h2>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                  Name + slug (URL-friendly). Logo URL optional.
                </p>
              </div>
              <span className="hidden sm:inline-flex text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                Provision
              </span>
            </div>

            <form
              className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end"
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
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                  Tenant Name
                </label>
                <input
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Acme Corp"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                  Tenant Slug
                </label>
                <div className="flex">
                  <span className="inline-flex items-center px-3 text-sm text-slate-500 bg-slate-100 dark:bg-slate-700 border border-r-0 border-slate-200 dark:border-slate-700 rounded-l-xl">
                    /t/
                  </span>
                  <input
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-r-xl text-sm font-mono text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    placeholder="acme-corp"
                  />
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Preview:{" "}
                  <span className="font-mono bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md text-slate-600 dark:text-slate-300">
                    /t/{slugPreview || "tenant-slug"}
                  </span>
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                  Logo URL
                </label>
                <input
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  value={logoUrl}
                  onChange={(e) => setLogoUrl(e.target.value)}
                  placeholder="https://..."
                />
              </div>

              <div className="md:col-span-3 flex justify-end">
                <button
                  className="inline-flex items-center justify-center gap-2 px-8 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-colors disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  type="submit"
                  disabled={createTenant.isPending}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  {createTenant.isPending ? "Creating..." : "Create Tenant"}
                </button>
              </div>
            </form>
          </section>

          {/* Tenants Table (Stitch-style actions) */}
          <section className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 leading-tight">Tenants</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  page={page}, q="{q}", includeArchived={String(includeArchived)}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="p-2 text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 disabled:opacity-30 focus:outline-none focus:ring-2 focus:ring-blue-500/20 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  title="Previous page"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                  </svg>
                </button>

                <span className="px-3 py-1.5 text-xs font-bold bg-slate-900 text-white rounded-lg dark:bg-slate-100 dark:text-slate-900">
                  Page {page}
                </span>

                <button
                  type="button"
                  className="p-2 text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                  onClick={() => setPage((p) => p + 1)}
                  title="Next page"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>

            {tenantsQuery.isLoading && (
              <div className="p-6">
                <div className="space-y-3">
                  <div className="h-10 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" />
                  <div className="h-10 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" />
                  <div className="h-10 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" />
                  <div className="h-10 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" />
                </div>
              </div>
            )}

            {tenantsQuery.isError && (
              <div className="p-6">
                <div className="rounded-2xl border border-rose-200 dark:border-rose-900/40 bg-rose-50/40 dark:bg-rose-900/10 p-4">
                  <p className="text-sm font-medium text-rose-700 dark:text-rose-300">Failed to load tenants.</p>
                  <p className="text-sm text-slate-700 dark:text-slate-300 mt-1">{errorMessage}</p>
                </div>
              </div>
            )}

            {tenantsQuery.isSuccess && tenants.length === 0 && (
              <div className="p-6">
                <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 p-6 text-sm text-slate-600 dark:text-slate-300">
                  No tenants found
                </div>
              </div>
            )}

            {tenantsQuery.isSuccess && tenants.length > 0 && (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-800/50">
                        <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800">
                          Tenant
                        </th>
                        <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800">
                          Slug
                        </th>
                        <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800">
                          Direct Link
                        </th>
                        <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800 text-right">
                          Actions
                        </th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {tenants.map((t) => (
                        <tr
                          key={t.id}
                          className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="size-8 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center font-bold text-xs text-slate-900 dark:text-slate-100">
                                {getInitials(t.name)}
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-2 min-w-0">
                                  <span className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                                    {t.name}
                                  </span>
                                  {t.isArchived ? (
                                    <span className="text-[10px] px-2 py-0.5 rounded-full border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold uppercase tracking-wider">
                                      Archived
                                    </span>
                                  ) : null}
                                </div>
                                <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                                  {t.logoUrl ? t.logoUrl : t.slug}
                                </div>
                              </div>
                            </div>
                          </td>

                          <td className="px-6 py-4">
                            <span className="text-xs font-mono bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded text-slate-600 dark:text-slate-300">
                              {t.slug}
                            </span>
                          </td>

                          <td className="px-6 py-4">
                            <a
                              className="text-sm text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1"
                              href={`/t/${t.slug}`}
                            >
                              /t/{t.slug}
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
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
                                className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-600/5 dark:hover:bg-blue-500/10 rounded-lg transition-all disabled:opacity-60"
                                onClick={() => openAssignAdminModal(t.id)}
                                disabled={assignTenantAdmin.isPending}
                                title="Assign Admin"
                                aria-label="Assign Admin"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 21v-2a4 4 0 00-4-4H7a4 4 0 00-4 4v2" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 7a4 4 0 110 8 4 4 0 010-8z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 8v6m3-3h-6" />
                                </svg>
                              </button>

                              {!t.isArchived ? (
                                <button
                                  type="button"
                                  className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-500/10 rounded-lg transition-all disabled:opacity-60"
                                  onClick={() => archiveTenant.mutate(t.id)}
                                  disabled={archiveTenant.isPending}
                                  title="Archive"
                                  aria-label="Archive"
                                >
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-1 14H5L4 7" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 11h6" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7h18l-1-3H4L3 7z" />
                                  </svg>
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-50 dark:hover:text-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all disabled:opacity-60"
                                  onClick={() => unarchiveTenant.mutate(t.id)}
                                  disabled={unarchiveTenant.isPending}
                                  title="Unarchive"
                                  aria-label="Unarchive"
                                >
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-1 14H5L4 7" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 11h6" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7h18l-1-3H4L3 7z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15V9m0 0l-2 2m2-2l2 2" />
                                  </svg>
                                </button>
                              )}

                              <button
                                type="button"
                                className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-all disabled:opacity-60"
                                onClick={() => {
                                  const ok = window.confirm("Delete tenant? This is permanent (safe delete may block).");
                                  if (ok) deleteTenant.mutate(t.id);
                                }}
                                disabled={deleteTenant.isPending}
                                title="Delete"
                                aria-label="Delete"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
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

                <div className="border-t border-slate-100 dark:border-slate-800 p-4 text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50">
                  Note: Delete uses “safe delete”. If the tenant has projects/memberships, the API may block deletion.
                  Archive is recommended.
                </div>
              </>
            )}
          </section>

          {/* Assign Admin Modal */}
          {isAssignOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
              <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border border-slate-200/70 dark:border-slate-800">
                <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Assign Tenant Admin</h2>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                      Enter a user email. Membership will be upserted as{" "}
                      <span className="font-mono">tenantAdmin</span> + <span className="font-mono">active</span>.
                    </p>
                  </div>

                  <button
                    type="button"
                    className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800 dark:hover:text-slate-200 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    onClick={closeAssignAdminModal}
                    disabled={assignTenantAdmin.isPending}
                    aria-label="Close"
                    title="Close"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="p-6 space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase">
                      User Email Address
                    </label>
                    <input
                      className="w-full py-2.5 px-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                      value={adminEmail}
                      onChange={(e) => setAdminEmail(e.target.value)}
                      placeholder="admin@tenant.com"
                      autoFocus
                      type="email"
                    />
                  </div>

                  <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-100 rounded-xl text-amber-800 text-xs leading-snug dark:bg-amber-500/10 dark:border-amber-500/20 dark:text-amber-200">
                    <svg
                      className="w-5 h-5 shrink-0 mt-0.5"
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

                <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/50 flex flex-row-reverse gap-3 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    className="px-5 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
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
                    className="px-5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-sm font-semibold rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
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
