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
        {/* Context Bar */}
        <div className="sticky top-0 z-30 -mx-4 sm:-mx-6 lg:-mx-8 mb-6 border-b border-slate-200 bg-slate-100/90 backdrop-blur">
          <div className="px-4 sm:px-6 lg:px-8 py-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="inline-flex h-2 w-2 rounded-full bg-blue-600" />
              <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                Platform Admin Only — Manage Tenants
              </span>
            </div>
            <div className="text-xs text-slate-500">enterprise</div>
          </div>
        </div>

        <div className="space-y-8">
          {/* Stat Cards */}
          <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
              <div className="flex items-start justify-between">
                <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                    />
                  </svg>
                </div>
                <div className="text-[11px] font-bold text-emerald-600 flex items-center gap-1">
                  Live
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                    <path
                      fillRule="evenodd"
                      clipRule="evenodd"
                      d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z"
                    />
                  </svg>
                </div>
              </div>
              <div className="mt-4">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Total Tenants</p>
                <p className="text-3xl font-bold text-slate-900 mt-1">
                  {analyticsQuery.isSuccess && analytics ? analytics.totalTenants : "—"}
                </p>
              </div>
            </div>

            <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
              <div className="flex items-start justify-between">
                <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <div className="text-[11px] font-bold text-emerald-600 flex items-center gap-1">
                  Healthy
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                    <path
                      fillRule="evenodd"
                      clipRule="evenodd"
                      d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z"
                    />
                  </svg>
                </div>
              </div>
              <div className="mt-4">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Active Tenants</p>
                <p className="text-3xl font-bold text-slate-900 mt-1">
                  {analyticsQuery.isSuccess && analytics ? analytics.activeTenants : "—"}
                </p>
              </div>
            </div>

            <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
              <div className="flex items-start justify-between">
                <div className="p-3 bg-rose-50 text-rose-600 rounded-xl">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                </div>
                <div className="text-[11px] font-bold text-rose-600 flex items-center gap-1">Review</div>
              </div>
              <div className="mt-4">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Suspended Tenants</p>
                <p className="text-3xl font-bold text-slate-900 mt-1">
                  {analyticsQuery.isSuccess && analytics ? (suspendedTenants ?? "—") : "—"}
                </p>
              </div>
            </div>

            <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
              <div className="flex items-start justify-between">
                <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                    />
                  </svg>
                </div>
                <div className="text-[11px] font-bold text-emerald-600 flex items-center gap-1">Soon</div>
              </div>
              <div className="mt-4">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Total Users</p>
                <p className="text-3xl font-bold text-slate-900 mt-1">—</p>
              </div>
            </div>
          </section>

          {/* Analytics */}
          <section className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Analytics</h2>
                <p className="text-sm text-slate-600">Quick overview of platform usage.</p>
              </div>

              <button
                onClick={() => {
                  tenantsQuery.refetch();
                  analyticsQuery.refetch();
                }}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                type="button"
              >
                <svg className="h-4 w-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
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
                <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                  <div className="h-5 w-40 bg-slate-200 rounded animate-pulse" />
                  <div className="mt-6 h-64 w-full bg-slate-100 rounded-xl animate-pulse" />
                </div>
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                  <div className="h-5 w-48 bg-slate-200 rounded animate-pulse" />
                  <div className="mt-6 space-y-3">
                    <div className="h-10 bg-slate-100 rounded-xl animate-pulse" />
                    <div className="h-10 bg-slate-100 rounded-xl animate-pulse" />
                    <div className="h-10 bg-slate-100 rounded-xl animate-pulse" />
                    <div className="h-10 bg-slate-100 rounded-xl animate-pulse" />
                  </div>
                </div>
              </div>
            )}

            {analyticsQuery.isError && (
              <div className="bg-white border border-rose-200 rounded-2xl p-5 shadow-sm">
                <p className="text-sm font-medium text-rose-700">Failed to load analytics.</p>
                <p className="mt-1 text-sm text-slate-700">{getErrorMessage(analyticsQuery.error, "Unknown error")}</p>
              </div>
            )}

            {analyticsQuery.isSuccess && analytics && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
                {/* Usage Breakdown (visual container only) */}
                <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                  <div className="flex items-center justify-between gap-3 mb-6">
                    <h3 className="text-lg font-bold text-slate-900">Usage Breakdown</h3>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        className="px-3 py-1.5 text-xs font-semibold bg-slate-900 text-white rounded-lg"
                      >
                        Last 30 Days
                      </button>
                      <button
                        type="button"
                        className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 rounded-lg"
                      >
                        90 Days
                      </button>
                    </div>
                  </div>

                  <div className="relative h-64 w-full rounded-xl bg-slate-50 border border-slate-200 overflow-hidden">
                    <div className="absolute inset-0 flex flex-col justify-between py-4 pointer-events-none">
                      <div className="border-t border-slate-100 w-full" />
                      <div className="border-t border-slate-100 w-full" />
                      <div className="border-t border-slate-100 w-full" />
                      <div className="border-t border-slate-100 w-full" />
                    </div>

                    <div className="absolute inset-0 flex items-end justify-between gap-3 px-4 pb-4">
                      <div className="relative flex-1 group">
                        <div className="bg-indigo-500/20 w-full rounded-t-lg absolute bottom-0 transition-all duration-300 group-hover:bg-indigo-500/40 h-[60%]" />
                        <div className="bg-indigo-500 w-full rounded-t-lg absolute bottom-0 h-[40%]" />
                      </div>
                      <div className="relative flex-1 group">
                        <div className="bg-indigo-500/20 w-full rounded-t-lg absolute bottom-0 h-[80%]" />
                        <div className="bg-indigo-500 w-full rounded-t-lg absolute bottom-0 h-[55%]" />
                      </div>
                      <div className="relative flex-1 group">
                        <div className="bg-indigo-500/20 w-full rounded-t-lg absolute bottom-0 h-[45%]" />
                        <div className="bg-indigo-500 w-full rounded-t-lg absolute bottom-0 h-[30%]" />
                      </div>
                      <div className="relative flex-1 group">
                        <div className="bg-indigo-500/20 w-full rounded-t-lg absolute bottom-0 h-[90%]" />
                        <div className="bg-indigo-500 w-full rounded-t-lg absolute bottom-0 h-[70%]" />
                      </div>
                      <div className="relative flex-1 group">
                        <div className="bg-indigo-500/20 w-full rounded-t-lg absolute bottom-0 h-[75%]" />
                        <div className="bg-indigo-500 w-full rounded-t-lg absolute bottom-0 h-[50%]" />
                      </div>
                      <div className="relative flex-1 group">
                        <div className="bg-indigo-500/20 w-full rounded-t-lg absolute bottom-0 h-[65%]" />
                        <div className="bg-indigo-500 w-full rounded-t-lg absolute bottom-0 h-[45%]" />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between mt-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    <span>Week 1</span>
                    <span>Week 2</span>
                    <span>Week 3</span>
                    <span>Week 4</span>
                  </div>

                  <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4">
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Total Tenants</p>
                      <p className="text-2xl font-semibold text-slate-900 mt-1">{analytics.totalTenants}</p>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4">
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Active Tenants</p>
                      <p className="text-2xl font-semibold text-slate-900 mt-1">{analytics.activeTenants}</p>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4">
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Total Projects</p>
                      <p className="text-2xl font-semibold text-slate-900 mt-1">{analytics.totalProjects}</p>
                    </div>
                  </div>
                </div>

                {/* Chart Data Breakdown (existing mapping preserved) */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                  <h3 className="text-lg font-bold text-slate-900 mb-6">Chart Data Breakdown</h3>
                  <div className="space-y-2">
                    {(analytics.chartData ?? []).map((item) => (
                      <div
                        key={item.name}
                        className="flex items-center justify-between gap-3 p-3 rounded-xl transition-colors hover:bg-slate-50"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="h-2.5 w-2.5 rounded-full bg-indigo-500 shrink-0" />
                          <span className="text-sm font-medium text-slate-700 truncate">{item.name}</span>
                        </div>
                        <span className="font-mono text-sm text-slate-500">{item.value}</span>
                      </div>
                    ))}
                  </div>

                  <button
                    type="button"
                    className="w-full mt-6 py-2.5 text-sm font-semibold text-slate-900 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
                  >
                    Download Detailed Report
                  </button>
                </div>
              </div>
            )}
          </section>

          {/* Controls (Filters Toolbar) */}
          <section className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex flex-col md:flex-row items-center gap-4">
              <div className="relative w-full md:flex-1">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </div>

                <input
                  className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm"
                  value={q}
                  onChange={(e) => {
                    setPage(1);
                    setQ(e.target.value);
                  }}
                  placeholder="Search tenants by name or slug"
                />
              </div>

              <div className="flex items-center gap-6 w-full md:w-auto shrink-0 border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-6">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    className="sr-only peer"
                    type="checkbox"
                    checked={includeArchived}
                    onChange={(e) => {
                      setPage(1);
                      setIncludeArchived(e.target.checked);
                    }}
                  />
                  <div className="w-11 h-6 bg-slate-200 rounded-full peer peer-checked:bg-slate-900 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500/20 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:border-slate-300 after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full" />
                  <span className="ml-3 text-sm font-medium text-slate-600">
                    {includeArchived ? "Including archived" : "Active only"}
                  </span>
                </label>

                <button
                  onClick={() => {
                    tenantsQuery.refetch();
                    analyticsQuery.refetch();
                  }}
                  className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  type="button"
                  title="Refresh data"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </section>

          {/* Create Tenant */}
          <section className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2 mb-6">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Create Tenant</h2>
                <p className="text-sm text-slate-600">Name + slug (URL-friendly). Logo URL optional.</p>
              </div>
              <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">Provision New Tenant</div>
            </div>

            <form
              className="space-y-4"
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
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 items-end">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Tenant Name</label>
                  <input
                    className="w-full py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Acme Corp"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Slug</label>
                  <input
                    className="w-full py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm font-mono"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    placeholder="acme-corp"
                  />
                  <p className="text-xs text-slate-500">
                    Preview:{" "}
                    <span className="font-mono bg-slate-100 px-2 py-0.5 rounded-md text-slate-600">
                      /t/{slugPreview || "tenant-slug"}
                    </span>
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Logo URL (optional)</label>
                  <input
                    className="w-full py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm"
                    value={logoUrl}
                    onChange={(e) => setLogoUrl(e.target.value)}
                    placeholder="https://..."
                  />
                </div>
              </div>

              <div className="flex items-center justify-end">
                <button
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 transition-colors disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  type="submit"
                  disabled={createTenant.isPending}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                    />
                  </svg>
                  {createTenant.isPending ? "Creating..." : "Create Tenant"}
                </button>
              </div>
            </form>
          </section>

          {/* Tenants List */}
          <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900 leading-tight">Tenants</h2>
                <p className="text-sm text-slate-500 mt-1">
                  page={page}, q="{q}", includeArchived={String(includeArchived)}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="p-2 text-slate-400 hover:text-slate-900 disabled:opacity-30 focus:outline-none focus:ring-2 focus:ring-blue-500/20 rounded-lg"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  title="Previous page"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                  </svg>
                </button>

                <span className="px-3 py-1.5 text-xs font-bold bg-slate-900 text-white rounded-lg">Page {page}</span>

                <button
                  type="button"
                  className="p-2 text-slate-400 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 rounded-lg"
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
                  <div className="h-10 bg-slate-100 rounded-xl animate-pulse" />
                  <div className="h-10 bg-slate-100 rounded-xl animate-pulse" />
                  <div className="h-10 bg-slate-100 rounded-xl animate-pulse" />
                  <div className="h-10 bg-slate-100 rounded-xl animate-pulse" />
                </div>
              </div>
            )}

            {tenantsQuery.isError && (
              <div className="p-6">
                <div className="rounded-2xl border border-rose-200 bg-rose-50/40 p-4">
                  <p className="text-sm font-medium text-rose-700">Failed to load tenants.</p>
                  <p className="text-sm text-slate-700 mt-1">{errorMessage}</p>
                </div>
              </div>
            )}

            {tenantsQuery.isSuccess && tenants.length === 0 && (
              <div className="p-6">
                <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-6 text-sm text-slate-600">
                  No tenants found
                </div>
              </div>
            )}

            {tenantsQuery.isSuccess && tenants.length > 0 && (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold tracking-widest">
                      <tr>
                        <th className="px-6 py-4 border-b border-slate-100">Tenant Info</th>
                        <th className="px-6 py-4 border-b border-slate-100">Slug</th>
                        <th className="px-6 py-4 border-b border-slate-100">Direct Link</th>
                        <th className="px-6 py-4 border-b border-slate-100 text-right">Actions</th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-100">
                      {tenants.map((t) => (
                        <tr key={t.id} className="group hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-slate-900 flex items-center justify-center text-white font-bold text-sm shadow-sm">
                                {getInitials(t.name)}
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                  <div className="text-sm font-bold text-slate-900 truncate">{t.name}</div>
                                  {t.isArchived ? (
                                    <span className="text-[10px] px-2 py-0.5 rounded-full border border-slate-200 bg-slate-100 text-slate-700 font-semibold uppercase tracking-wider">
                                      Archived
                                    </span>
                                  ) : null}
                                </div>
                                <div className="text-xs text-slate-500 truncate">{t.logoUrl ? t.logoUrl : t.slug}</div>
                              </div>
                            </div>
                          </td>

                          <td className="px-6 py-4">
                            <span className="font-mono text-xs bg-slate-100 px-2 py-1 rounded-md text-slate-600">
                              {t.slug}
                            </span>
                          </td>

                          <td className="px-6 py-4">
                            <a
                              className="text-xs font-semibold text-blue-600 hover:underline inline-flex items-center gap-1 group/link"
                              href={`/t/${t.slug}`}
                            >
                              Visit Workspace
                              <svg
                                className="w-3 h-3 transform transition-transform group-hover/link:translate-x-0.5"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                                aria-hidden="true"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth="2"
                                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                                />
                              </svg>
                            </a>
                          </td>

                          <td className="px-6 py-4 text-right">
                            <div className="inline-flex items-center justify-end gap-3 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                              <button
                                type="button"
                                className="text-xs font-bold text-slate-600 hover:text-slate-900 disabled:opacity-60"
                                onClick={() => openAssignAdminModal(t.id)}
                                disabled={assignTenantAdmin.isPending}
                              >
                                Assign Admin
                              </button>

                              {!t.isArchived ? (
                                <button
                                  type="button"
                                  className="text-xs font-bold text-slate-600 hover:text-slate-900 disabled:opacity-60"
                                  onClick={() => archiveTenant.mutate(t.id)}
                                  disabled={archiveTenant.isPending}
                                >
                                  Archive
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  className="text-xs font-bold text-slate-600 hover:text-slate-900 disabled:opacity-60"
                                  onClick={() => unarchiveTenant.mutate(t.id)}
                                  disabled={unarchiveTenant.isPending}
                                >
                                  Unarchive
                                </button>
                              )}

                              <button
                                type="button"
                                className="text-xs font-bold text-rose-700 hover:text-rose-900 disabled:opacity-60"
                                onClick={() => {
                                  const ok = window.confirm(
                                    "Delete tenant? This is permanent (safe delete may block)."
                                  );
                                  if (ok) deleteTenant.mutate(t.id);
                                }}
                                disabled={deleteTenant.isPending}
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="border-t border-slate-100 p-4 text-xs text-slate-600 bg-slate-50/40">
                  Note: Delete uses “safe delete”. If the tenant has projects/memberships, the API may block deletion.
                  Archive is recommended.
                </div>
              </>
            )}
          </section>

          {/* Assign Admin Modal */}
          {isAssignOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
              <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden">
                <div className="px-6 py-5 border-b border-slate-100 flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">Assign Tenant Admin</h2>
                    <p className="text-sm text-slate-600 mt-1">
                      Enter a user email. Membership will be upserted as{" "}
                      <span className="font-mono">tenantAdmin</span> + <span className="font-mono">active</span>.
                    </p>
                  </div>

                  <button
                    type="button"
                    className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/20"
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
                    <label className="text-xs font-bold text-slate-700 uppercase">User Email Address</label>
                    <input
                      className="w-full py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm"
                      value={adminEmail}
                      onChange={(e) => setAdminEmail(e.target.value)}
                      placeholder="admin@tenant.com"
                      autoFocus
                      type="email"
                    />
                  </div>

                  <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-100 rounded-xl text-amber-800 text-xs leading-snug">
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

                <div className="px-6 py-4 bg-slate-50 flex flex-row-reverse gap-3">
                  <button
                    type="button"
                    className="px-5 py-2.5 bg-slate-900 text-white text-sm font-semibold rounded-xl hover:bg-slate-800 transition-colors disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
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
                    className="px-5 py-2.5 bg-white border border-slate-200 text-slate-700 text-sm font-semibold rounded-xl hover:bg-slate-100 transition-colors disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
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
