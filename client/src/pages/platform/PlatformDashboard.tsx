// FILE: client/src/pages/platform/PlatformDashboard.tsx
import { useQuery } from "@tanstack/react-query";
import PageShell from "../../components/common/PageShell";
import { http } from "../../api/http";
import { API } from "../../api/endpoints";

type TenantItem = {
  id: string;
  name: string;
  slug: string;
  isArchived?: boolean;
};

export default function PlatformDashboard() {
  const tenantsQ = useQuery({
    queryKey: ["platform", "tenants"],
    queryFn: async () => {
      const { data } = await http.get<{ items: TenantItem[] }>(API.platform.tenants);
      return data.items;
    },
  });

  return (
    <PageShell title="Platform Dashboard">
      <div className="space-y-3 text-sm">
        <p>Lists tenants (platformAdmin only).</p>

        {tenantsQ.isLoading && <div>Loading tenants...</div>}
        {tenantsQ.isError && <div>Failed to load tenants.</div>}

        {tenantsQ.data && (
          <ul className="space-y-2">
            {tenantsQ.data.map((t) => (
              <li key={t.id} className="border rounded p-3 flex items-center justify-between">
                <div>
                  <div className="font-medium">{t.name}</div>
                  <div className="text-xs text-muted-foreground">{t.slug}</div>
                </div>
                <div className="text-xs">{t.isArchived ? "Archived" : "Active"}</div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </PageShell>
  );
}
