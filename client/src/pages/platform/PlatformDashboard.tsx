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

  // ✅ Query (exact plan)
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

  const errorMessage =
    err?.response?.data?.message ||
    err?.message ||
    "Failed to load tenants";

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold">Platform Dashboard</h1>
        <p className="text-sm text-slate-600">
          Platform admin only — manage tenants.
        </p>
      </div>

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
              onClick={() => tenantsQuery.refetch()}
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
          <p className="text-sm text-slate-600">
            Name + slug (URL-friendly). Logo URL optional.
          </p>
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
          <div className="border rounded-lg p-4 text-sm text-slate-600">
            Loading…
          </div>
        )}

        {/* Error */}
        {tenantsQuery.isError && (
          <div className="border rounded-lg p-4 space-y-2">
            <p className="text-sm font-medium text-rose-600">
              Failed to load tenants.
            </p>
            <p className="text-sm text-slate-700">{errorMessage}</p>
          </div>
        )}

        {/* Empty */}
        {tenantsQuery.isSuccess && tenants.length === 0 && (
          <div className="border rounded-lg p-4 text-sm text-slate-600">
            No tenants found
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
                      <a className="underline" href={`/t/${t.slug}`}>
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
