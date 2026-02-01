// FILE: client/src/pages/platform/PlatformDashboard.tsx
import { useQuery } from "@tanstack/react-query";
import { http } from "../../api/http";
import { API } from "../../api/endpoints";

type Tenant = {
  id: string;
  name: string;
  slug: string;
  createdAt?: string;
};

export default function PlatformDashboard() {
  const tenantsQuery = useQuery({
    queryKey: ["platform", "tenants"],
    queryFn: async () => {
      // ✅ Expected endpoint: GET platform tenants (platformAdmin only)
      const { data } = await http.get<{ tenants: Tenant[] }>(API.platform.tenants);
      return data.tenants ?? [];
    },
  });

  const tenants = tenantsQuery.data ?? [];
  const err = tenantsQuery.error as any;

  const errorMessage =
    err?.response?.data?.message ||
    err?.message ||
    "Failed to load tenants";

  const errorCode = err?.response?.status;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold">Platform Dashboard</h1>
        <p className="text-sm text-slate-600">
          Platform admin only — manage tenants and monitor platform activity.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="border rounded-lg p-4">
          <p className="text-sm text-slate-600">Total Tenants</p>
          <p className="text-2xl font-semibold">{tenantsQuery.isLoading ? "…" : tenants.length}</p>
        </div>

        <div className="border rounded-lg p-4">
          <p className="text-sm text-slate-600">Status</p>
          <p className="text-sm">
            {tenantsQuery.isLoading && "Loading…"}
            {tenantsQuery.isError && "Error"}
            {tenantsQuery.isSuccess && "OK"}
          </p>
        </div>

        <div className="border rounded-lg p-4">
          <p className="text-sm text-slate-600">Quick Tip</p>
          <p className="text-sm">
            Create a tenant, then assign a <b>tenantAdmin</b> via membership.
          </p>
        </div>
      </div>

      {/* Tenants */}
      <section className="space-y-3">
        <div className="flex items-end justify-between">
          <div>
            <h2 className="text-lg font-semibold">Tenants</h2>
            <p className="text-sm text-slate-600">List of all tenants in the platform.</p>
          </div>

          <button
            onClick={() => tenantsQuery.refetch()}
            className="border rounded px-3 py-2 text-sm hover:bg-slate-50"
            type="button"
          >
            Refresh
          </button>
        </div>

        {/* Loading */}
        {tenantsQuery.isLoading && (
          <div className="border rounded-lg p-4 text-sm text-slate-600">
            Loading tenants…
          </div>
        )}

        {/* Error */}
        {tenantsQuery.isError && (
          <div className="border rounded-lg p-4 space-y-2">
            <p className="text-sm font-medium text-rose-600">
              Failed to load tenants{errorCode ? ` (HTTP ${errorCode})` : ""}.
            </p>
            <p className="text-sm text-slate-700">{errorMessage}</p>

            <div className="text-xs text-slate-500">
              Most common causes: missing cookie, CORS credentials, or you are not really platformAdmin.
            </div>

            <button
              onClick={() => tenantsQuery.refetch()}
              className="border rounded px-3 py-2 text-sm hover:bg-slate-50"
              type="button"
            >
              Try again
            </button>
          </div>
        )}

        {/* Empty */}
        {tenantsQuery.isSuccess && tenants.length === 0 && (
          <div className="border rounded-lg p-4 text-sm text-slate-600">
            No tenants found yet.
          </div>
        )}

        {/* Table */}
        {tenantsQuery.isSuccess && tenants.length > 0 && (
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50">
                <tr className="text-left">
                  <th className="p-3 border-b">Name</th>
                  <th className="p-3 border-b">Slug</th>
                  <th className="p-3 border-b">Open</th>
                </tr>
              </thead>
              <tbody>
                {tenants.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50">
                    <td className="p-3 border-b">{t.name}</td>
                    <td className="p-3 border-b text-slate-600">{t.slug}</td>
                    <td className="p-3 border-b">
                      <a
                        className="underline"
                        href={`/t/${t.slug}`}
                      >
                        Go to tenant
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
