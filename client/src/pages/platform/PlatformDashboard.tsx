// FILE: client/src/pages/platform/PlatformDashboard.tsx
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { http } from "../../api/http";
import { API } from "../../api/endpoints";

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
  // optional if your backend supports it (safe optional chaining)
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

// ✅ Feature #4 response type
type PlatformAnalyticsResponse = {
  totalTenants: number;
  activeTenants: number;
  totalProjects: number;
  chartData: Array<{ name: string; value: number }>;
};

function normalizeSlug(input: string) {
  return input
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export default function PlatformDashboard() {
  const qc = useQueryClient();

  // ✅ React Query Plan inputs
  const [page, setPage] = useState(1);
  const [q, setQ] = useState("");
  const [includeArchived, setIncludeArchived] = useState(false);

  // Create form state
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [logoUrl, setLogoUrl] = useState("");

  const slugPreview = useMemo(() => normalizeSlug(slug || name), [slug, name]);

  // ✅ Feature #3 (UI state): Assign Tenant Admin modal
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

  // ✅ Feature #4: Platform Analytics query
  const analyticsQuery = useQuery({
    queryKey: ["platformAnalytics"],
    queryFn: async () => {
      const { data } = await http.get<PlatformAnalyticsResponse>(API.platform.analytics);
      return data;
    },
    // optional
    // refetchInterval: 30000,
    staleTime: 0,
  });

  // ✅ Tenants query (exact plan)
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
  const err = tenantsQuery.error as any;
  const errorMessage = err?.response?.data?.message || err?.message || "Failed to load tenants";

  // ✅ Mutation: create tenant
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

      // ✅ IMPORTANT: refresh the tenants list cache
      qc.invalidateQueries({ queryKey: ["platformTenants"] });
      // ✅ Feature #4: refresh analytics too
      qc.invalidateQueries({ queryKey: ["platformAnalytics"] });
    },
    onError: (e: any) => {
      const code = e?.response?.data?.code;
      const msg = e?.response?.data?.message;

      if (code === "SLUG_TAKEN") {
        toast.error("Slug already exists. Choose a different slug.");
        return;
      }
      toast.error(msg || "Failed to create tenant");
    },
  });

  // ✅ Feature #2: Archive / Unarchive / Delete
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
    onError: (e: any) => {
      toast.error(e?.response?.data?.message || "Failed to archive tenant");
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
    onError: (e: any) => {
      toast.error(e?.response?.data?.message || "Failed to unarchive tenant");
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
    onError: (e: any) => {
      toast.error(e?.response?.data?.message || "Failed to delete tenant");
    },
  });

  // ✅ Feature #3: Assign Tenant Admin (POST /platform/tenants/:tenantId/admins)
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

      // Optional query invalidations (if you later add members list in platform UI)
      if (selectedTenantId) {
        qc.invalidateQueries({ queryKey: ["tenantMembers", selectedTenantId] });
      }

      // Refresh tenants list (safe)
      qc.invalidateQueries({ queryKey: ["platformTenants"] });

      // Optional: refresh analytics
      qc.invalidateQueries({ queryKey: ["platformAnalytics"] });

      closeAssignAdminModal();
    },
    onError: (e: any) => {
      const msg = e?.response?.data?.message || e?.message || "Failed to assign tenant admin";
      toast.error(msg);
    },
  });

  const analytics = analyticsQuery.data;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold">Platform Dashboard</h1>
        <p className="text-sm text-slate-600">Platform admin only — manage tenants.</p>
      </div>

      {/* ✅ Feature #4: Analytics Section */}
      <section className="space-y-3">
        <div>
          <h2 className="text-lg font-semibold">Analytics</h2>
          <p className="text-sm text-slate-600">Quick overview of platform usage.</p>
        </div>

        {analyticsQuery.isLoading && (
          <div className="border rounded-lg p-4 text-sm text-slate-600">Loading analytics…</div>
        )}

        {analyticsQuery.isError && (
          <div className="border rounded-lg p-4 space-y-1">
            <p className="text-sm font-medium text-rose-600">Failed to load analytics.</p>
            <p className="text-sm text-slate-700">
              {(analyticsQuery.error as any)?.response?.data?.message ||
                (analyticsQuery.error as any)?.message ||
                "Unknown error"}
            </p>
          </div>
        )}

        {analyticsQuery.isSuccess && analytics && (
          <div className="space-y-3">
            {/* Summary cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="border rounded-lg p-4">
                <p className="text-xs text-slate-500">Total Tenants</p>
                <p className="text-2xl font-semibold">{analytics.totalTenants}</p>
              </div>

              <div className="border rounded-lg p-4">
                <p className="text-xs text-slate-500">Active Tenants</p>
                <p className="text-2xl font-semibold">{analytics.activeTenants}</p>
              </div>

              <div className="border rounded-lg p-4">
                <p className="text-xs text-slate-500">Total Projects</p>
                <p className="text-2xl font-semibold">{analytics.totalProjects}</p>
              </div>
            </div>

            {/* Simple “chart” (list version) */}
            <div className="border rounded-lg p-4">
              <p className="text-sm font-medium">Chart Data</p>
              <div className="mt-2 space-y-2">
                {(analytics.chartData ?? []).map((item) => (
                  <div key={item.name} className="flex items-center justify-between text-sm">
                    <span className="text-slate-700">{item.name}</span>
                    <span className="font-mono">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Controls: search + includeArchived */}
      <div className="border rounded-lg p-4 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="space-y-1">
            <label className="text-sm">Search (q)</label>
            <input
              className="w-full border rounded px-3 py-2 text-sm"
              value={q}
              onChange={(e) => {
                setPage(1); // reset to first page on new search
                setQ(e.target.value);
              }}
              placeholder="Search by name or slug"
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm">Include archived</label>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={includeArchived}
                onChange={(e) => {
                  setPage(1);
                  setIncludeArchived(e.target.checked);
                }}
              />
              <span className="text-sm text-slate-700">
                {includeArchived ? "Showing archived too" : "Active only"}
              </span>
            </div>
          </div>

          <div className="flex items-end justify-end gap-2">
            <button
              onClick={() => {
                tenantsQuery.refetch();
                analyticsQuery.refetch();
              }}
              className="border rounded px-3 py-2 text-sm hover:bg-slate-50"
              type="button"
            >
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Create Tenant */}
      <section className="space-y-3">
        <div>
          <h2 className="text-lg font-semibold">Create Tenant</h2>
          <p className="text-sm text-slate-600">Name + slug (URL-friendly). Logo URL optional.</p>
        </div>

        <form
          className="border rounded-lg p-4 space-y-3"
          onSubmit={(e) => {
            e.preventDefault();

            const finalName = name.trim();
            const finalSlug = normalizeSlug(slug || name);
            const finalLogo = logoUrl.trim();

            if (finalName.length < 2) {
              toast.error("Name must be at least 2 characters.");
              return;
            }
            if (finalSlug.length < 2) {
              toast.error("Slug must be at least 2 characters.");
              return;
            }

            createTenant.mutate({
              name: finalName,
              slug: finalSlug,
              logoUrl: finalLogo,
            });
          }}
        >
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="text-sm">Tenant Name</label>
              <input
                className="w-full border rounded px-3 py-2 text-sm"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Tenant Alpha"
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm">Slug</label>
              <input
                className="w-full border rounded px-3 py-2 text-sm"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="tenant-alpha"
              />
              <p className="text-xs text-slate-500">
                Preview: <span className="font-mono">/t/{slugPreview || "tenant-slug"}</span>
              </p>
            </div>

            <div className="space-y-1">
              <label className="text-sm">Logo URL (optional)</label>
              <input
                className="w-full border rounded px-3 py-2 text-sm"
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                placeholder="https://..."
              />
            </div>
          </div>

          <button
            className="border rounded px-3 py-2 text-sm hover:bg-slate-50 disabled:opacity-60"
            type="submit"
            disabled={createTenant.isPending}
          >
            {createTenant.isPending ? "Creating..." : "Create"}
          </button>
        </form>
      </section>

      {/* Tenants List */}
      <section className="space-y-3">
        <div className="flex items-end justify-between">
          <div>
            <h2 className="text-lg font-semibold">Tenants</h2>
            <p className="text-sm text-slate-600">
              page={page}, q="{q}", includeArchived={String(includeArchived)}
            </p>
          </div>

          {/* Basic pagination controls (simple) */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="border rounded px-3 py-2 text-sm hover:bg-slate-50 disabled:opacity-50"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Prev
            </button>
            <span className="text-sm text-slate-700">Page {page}</span>
            <button
              type="button"
              className="border rounded px-3 py-2 text-sm hover:bg-slate-50"
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </button>
          </div>
        </div>

        {/* Loading */}
        {tenantsQuery.isLoading && (
          <div className="border rounded-lg p-4 text-sm text-slate-600">Loading…</div>
        )}

        {/* Error */}
        {tenantsQuery.isError && (
          <div className="border rounded-lg p-4 space-y-2">
            <p className="text-sm font-medium text-rose-600">Failed to load tenants.</p>
            <p className="text-sm text-slate-700">{errorMessage}</p>
          </div>
        )}

        {/* Empty */}
        {tenantsQuery.isSuccess && tenants.length === 0 && (
          <div className="border rounded-lg p-4 text-sm text-slate-600">No tenants found</div>
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
                  <th className="p-3 border-b">Actions</th>
                </tr>
              </thead>

              <tbody>
                {tenants.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50">
                    <td className="p-3 border-b">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{t.name}</span>
                        {t.isArchived ? (
                          <span className="text-[11px] px-2 py-0.5 rounded border bg-slate-50 text-slate-600">
                            Archived
                          </span>
                        ) : null}
                      </div>
                    </td>

                    <td className="p-3 border-b text-slate-600">{t.slug}</td>

                    <td className="p-3 border-b">
                      <a className="underline" href={`/t/${t.slug}`}>
                        Go to tenant
                      </a>
                    </td>

                    <td className="p-3 border-b">
                      <div className="flex flex-wrap items-center gap-2">
                        {/* ✅ Feature #3: Assign Admin */}
                        <button
                          type="button"
                          className="border rounded px-2 py-1 text-xs hover:bg-slate-50 disabled:opacity-60"
                          onClick={() => openAssignAdminModal(t.id)}
                          disabled={assignTenantAdmin.isPending}
                        >
                          Assign Admin
                        </button>

                        {!t.isArchived ? (
                          <button
                            type="button"
                            className="border rounded px-2 py-1 text-xs hover:bg-slate-50 disabled:opacity-60"
                            onClick={() => archiveTenant.mutate(t.id)}
                            disabled={archiveTenant.isPending}
                          >
                            Archive
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="border rounded px-2 py-1 text-xs hover:bg-slate-50 disabled:opacity-60"
                            onClick={() => unarchiveTenant.mutate(t.id)}
                            disabled={unarchiveTenant.isPending}
                          >
                            Unarchive
                          </button>
                        )}

                        <button
                          type="button"
                          className="border border-rose-300 text-rose-700 rounded px-2 py-1 text-xs hover:bg-rose-50 disabled:opacity-60"
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

            {/* Small note helps beginners understand what "Delete" can do */}
            <div className="border-t p-3 text-xs text-slate-600">
              Note: Delete uses “safe delete”. If the tenant has projects/memberships, the API may
              block deletion. Archive is recommended.
            </div>
          </div>
        )}
      </section>

      {/* ✅ Feature #3: Assign Admin Modal */}
      {isAssignOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-lg bg-white p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold">Assign Tenant Admin</h2>
                <p className="text-sm text-slate-600">
                  Enter a user email. Membership will be upserted as{" "}
                  <span className="font-mono">tenantAdmin</span> +{" "}
                  <span className="font-mono">active</span>.
                </p>
              </div>

              <button
                type="button"
                className="border rounded px-2 py-1 text-xs hover:bg-slate-50"
                onClick={closeAssignAdminModal}
                disabled={assignTenantAdmin.isPending}
              >
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-2">
              <label className="text-sm">Admin Email</label>
              <input
                className="w-full border rounded px-3 py-2 text-sm"
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                placeholder="admin@tenant.com"
                autoFocus
              />
            </div>

            <div className="mt-4 flex items-center justify-end gap-2">
              <button
                type="button"
                className="border rounded px-3 py-2 text-sm hover:bg-slate-50 disabled:opacity-60"
                onClick={closeAssignAdminModal}
                disabled={assignTenantAdmin.isPending}
              >
                Cancel
              </button>

              <button
                type="button"
                className="rounded bg-black px-3 py-2 text-sm text-white disabled:opacity-60"
                disabled={assignTenantAdmin.isPending || !selectedTenantId || !adminEmail.trim()}
                onClick={() => {
                  if (!selectedTenantId) return;
                  assignTenantAdmin.mutate({
                    tenantId: selectedTenantId,
                    email: adminEmail,
                  });
                }}
              >
                {assignTenantAdmin.isPending ? "Assigning..." : "Assign Admin"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
