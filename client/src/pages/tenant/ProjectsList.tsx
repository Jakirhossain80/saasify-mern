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
  const user = useAuthStore((s) => s.user);

  const isTenantAdminUi = user?.platformRole === "platformAdmin"; // placeholder UI gate
  // NOTE: true tenant role should come from a membership endpoint later (Phase 7+)
  // For now this is just to demonstrate UI gating mechanics.

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

          {/* UI-only gating example */}
          {isTenantAdminUi && <button className="border rounded px-3 py-1">Create Project</button>}
        </div>

        {projectsQ.isLoading && <div>Loading projects...</div>}
        {projectsQ.isError && <div>Failed to load projects.</div>}

        {projectsQ.data && (
          <ul className="space-y-2">
            {projectsQ.data.map((p) => (
              <li key={p.id} className="border rounded p-3">
                <div className="font-medium">{p.title}</div>
                <div className="text-xs text-muted-foreground">{p.status ?? "active"}</div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </PageShell>
  );
}
