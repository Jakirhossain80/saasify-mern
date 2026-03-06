// FILE: client/src/pages/tenant/Analytics.tsx
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { http } from "../../api/http";
import { API } from "../../api/endpoints";
import PageShell from "../../components/common/PageShell";

type TenantMeResponse = {
  tenant: { id: string; slug: string };
  role: "tenantAdmin" | "member";
};

type TenantAnalyticsResponse = {
  activeProjects: number;
  archivedProjects: number;
  membersCount: number;
};

export default function Analytics() {
  const { tenantSlug = "" } = useParams();

  // 1) Load tenant context (gives us tenantId)
  const tenantMeQ = useQuery({
    queryKey: ["tenantMe", tenantSlug],
    queryFn: async () => {
      const { data } = await http.get<TenantMeResponse>(API.tenant.me(tenantSlug));
      return data;
    },
    enabled: !!tenantSlug,
  });

  const tenantId = tenantMeQ.data?.tenant?.id ?? "";

  // 2) Load analytics (tenantId-based endpoint)
  const analyticsQ = useQuery({
    queryKey: ["tenantAnalytics", tenantId],
    queryFn: async () => {
      const { data } = await http.get<TenantAnalyticsResponse>(API.tenant.analytics(tenantId));
      return data;
    },
    enabled: !!tenantId, // only run after tenantId is resolved
  });

  const stats = analyticsQ.data;

  return (
    <PageShell title="Tenant Analytics" subtitle="Tenant-level summary metrics for dashboard cards.">
      <div className="space-y-6">
        {/* ================= Error Alerts (keep logic intact) ================= */}
        {tenantMeQ.isError || analyticsQ.isError ? (
          <div className="space-y-3">
            {tenantMeQ.isError ? (
              <div className="flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-rose-700 shadow-sm dark:border-rose-900/40 dark:bg-rose-900/20 dark:text-rose-200">
                <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-lg bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-300">
                  <span className="text-sm font-bold">!</span>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold">Failed to load tenant context.</p>
                  <p className="mt-1 text-xs opacity-80">
                    Check your connection or permissions and try again.
                  </p>
                </div>
              </div>
            ) : null}

            {analyticsQ.isError ? (
              <div className="flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-rose-700 shadow-sm dark:border-rose-900/40 dark:bg-rose-900/20 dark:text-rose-200">
                <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-lg bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-300">
                  <span className="text-sm font-bold">!</span>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold">Failed to load analytics stats.</p>
                  <p className="mt-1 text-xs opacity-80">
                    Summary metrics could not be synchronized with the central repository.
                  </p>
                </div>
              </div>
            ) : null}
          </div>
        ) : null}

        {/* ================= Summary Metrics Header ================= */}
        <div className="flex items-center gap-4 pt-2">
          <span className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
          <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
            Summary Metrics
          </h3>
          <span className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
        </div>

        {/* ================= KPI Cards Grid ================= */}
        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          {/* Card 1: Active Projects */}
          <div className="group relative rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold uppercase tracking-tight text-slate-500 dark:text-slate-400">
                  Active Projects
                </p>
                <div className="rounded-lg bg-blue-50 p-2 text-blue-600 transition-colors duration-300 group-hover:bg-blue-600 group-hover:text-white dark:bg-blue-500/10 dark:text-blue-300">
                  <span className="text-sm font-bold">📁</span>
                </div>
              </div>

              <div>
                <p className="text-4xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                  {analyticsQ.isLoading ? "…" : stats?.activeProjects ?? 0}
                </p>
              </div>

              <div className="border-t border-slate-100 pt-3 dark:border-slate-800">
                <p className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                  <span className="inline-flex h-5 w-5 items-center justify-center rounded-md bg-slate-50 text-slate-500 dark:bg-slate-950 dark:text-slate-400">
                    i
                  </span>
                  <span>status = active, deletedAt = null</span>
                </p>
              </div>
            </div>
          </div>

          {/* Card 2: Archived Projects */}
          <div className="group relative rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold uppercase tracking-tight text-slate-500 dark:text-slate-400">
                  Archived Projects
                </p>
                <div className="rounded-lg bg-amber-100 p-2 text-amber-700 transition-colors duration-300 group-hover:bg-amber-500 group-hover:text-white dark:bg-amber-900/30 dark:text-amber-300">
                  <span className="text-sm font-bold">🗄️</span>
                </div>
              </div>

              <div>
                <p className="text-4xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                  {analyticsQ.isLoading ? "…" : stats?.archivedProjects ?? 0}
                </p>
              </div>

              <div className="border-t border-slate-100 pt-3 dark:border-slate-800">
                <p className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                  <span className="inline-flex h-5 w-5 items-center justify-center rounded-md bg-slate-50 text-slate-500 dark:bg-slate-950 dark:text-slate-400">
                    i
                  </span>
                  <span>status = archived, deletedAt = null</span>
                </p>
              </div>
            </div>
          </div>

          {/* Card 3: Members Active */}
          <div className="group relative rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold uppercase tracking-tight text-slate-500 dark:text-slate-400">
                  Members (Active)
                </p>
                <div className="rounded-lg bg-emerald-100 p-2 text-emerald-700 transition-colors duration-300 group-hover:bg-emerald-500 group-hover:text-white dark:bg-emerald-900/30 dark:text-emerald-300">
                  <span className="text-sm font-bold">👥</span>
                </div>
              </div>

              <div>
                <p className="text-4xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                  {analyticsQ.isLoading ? "…" : stats?.membersCount ?? 0}
                </p>
              </div>

              <div className="border-t border-slate-100 pt-3 dark:border-slate-800">
                <p className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                  <span className="inline-flex h-5 w-5 items-center justify-center rounded-md bg-slate-50 text-slate-500 dark:bg-slate-950 dark:text-slate-400">
                    i
                  </span>
                  <span>membership status = active</span>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ================= Future Insights Placeholder (visual only) ================= */}
        <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-white p-8 text-center sm:p-12 dark:border-slate-800 dark:bg-slate-900">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500">
            <span className="text-lg">📊</span>
          </div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Waiting for more data</h3>
          <p className="mx-auto mt-2 max-w-sm text-sm text-slate-500 dark:text-slate-400">
            Once the tenant activity increases, detailed time-series charts and usage patterns will
            appear here.
          </p>
        </div>
      </div>
    </PageShell>
  );
}
