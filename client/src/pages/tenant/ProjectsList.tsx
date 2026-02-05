// FILE: client/src/pages/tenant/ProjectsList.tsx
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import PageShell from "../../components/common/PageShell";
import { http } from "../../api/http";
import { API } from "../../api/endpoints";
import { useAuthStore } from "../../store/auth.store";

type ProjectItem = {
  id: string;
  title: string;
  status?: string;
};

export default function ProjectsList() {
  const { tenantSlug = "" } = useParams();

  // ✅ Use the REAL tenant role (set by SelectTenant via /t/:tenantSlug/me)
  const activeTenantRole = useAuthStore((s) => s.activeTenantRole);
  const isTenantAdminUi = activeTenantRole === "tenantAdmin";

  const projectsQ = useQuery({
    queryKey: ["tenant", tenantSlug, "projects"],
    queryFn: async () => {
      const { data } = await http.get<{ items: ProjectItem[] }>(API.tenant.projects(tenantSlug));
      return data.items;
    },
  });

  return (
    <PageShell title="Projects">
      <div className="space-y-3 text-sm">
        <div className="flex items-center justify-between">
          <div className="text-muted-foreground">Tenant: {tenantSlug}</div>

          {/* ✅ Tenant admin only (UI gating) */}
          {isTenantAdminUi && <button className="border rounded px-3 py-1">Create Project</button>}
        </div>

        {projectsQ.isLoading && <div>Loading projects...</div>}
        {projectsQ.isError && <div className="text-rose-600">Failed to load projects.</div>}

        {projectsQ.data && projectsQ.data.length > 0 && (
          <ul className="space-y-2">
            {projectsQ.data.map((p) => (
              <li key={p.id} className="border rounded p-3">
                <div className="font-medium">{p.title}</div>
                <div className="text-xs text-muted-foreground">{p.status ?? "active"}</div>
              </li>
            ))}
          </ul>
        )}

        {projectsQ.data && projectsQ.data.length === 0 && (
          <div className="text-sm text-slate-600">No projects found.</div>
        )}

        {/* Helpful hint if role not loaded yet */}
        {!activeTenantRole && (
          <div className="text-xs text-slate-500">
            Note: Tenant role is not loaded yet. Go to <span className="font-medium">/select-tenant</span> and open a
            tenant again to load permissions.
          </div>
        )}
      </div>
    </PageShell>
  );
}
