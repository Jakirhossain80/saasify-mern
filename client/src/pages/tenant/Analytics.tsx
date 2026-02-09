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
      const { data } = await http.get<TenantAnalyticsResponse>(
        API.tenant.analytics(tenantId)
      );
      return data;
    },
    enabled: !!tenantId, // only run after tenantId is resolved
  });

  const stats = analyticsQ.data;

  return (
    <PageShell
      title="Tenant Analytics"
      subtitle="Tenant-level summary metrics for dashboard cards."
    >
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-xl border bg-white p-5">
          <div className="text-sm text-slate-500">Active Projects</div>
          <div className="mt-2 text-3xl font-semibold">
            {analyticsQ.isLoading ? "…" : stats?.activeProjects ?? 0}
          </div>
          <div className="mt-1 text-xs text-slate-500">
            status = active, deletedAt = null
          </div>
        </div>

        <div className="rounded-xl border bg-white p-5">
          <div className="text-sm text-slate-500">Archived Projects</div>
          <div className="mt-2 text-3xl font-semibold">
            {analyticsQ.isLoading ? "…" : stats?.archivedProjects ?? 0}
          </div>
          <div className="mt-1 text-xs text-slate-500">
            status = archived, deletedAt = null
          </div>
        </div>

        <div className="rounded-xl border bg-white p-5">
          <div className="text-sm text-slate-500">Members (Active)</div>
          <div className="mt-2 text-3xl font-semibold">
            {analyticsQ.isLoading ? "…" : stats?.membersCount ?? 0}
          </div>
          <div className="mt-1 text-xs text-slate-500">
            membership status = active
          </div>
        </div>
      </div>

      {/* Loading / error states */}
      {tenantMeQ.isError ? (
        <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
          Failed to load tenant context.
        </div>
      ) : null}

      {analyticsQ.isError ? (
        <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
          Failed to load analytics stats.
        </div>
      ) : null}
    </PageShell>
  );
}
