// FILE: client/src/pages/tenant/TenantDashboard.tsx
import { Link, useParams } from "react-router-dom";
import PageShell from "../../components/common/PageShell";
import { useAuthStore } from "../../store/auth.store";

export default function TenantDashboard() {
  const { tenantSlug } = useParams();
  const user = useAuthStore((s) => s.user);

  return (
    <PageShell title={`Tenant Dashboard`}>
      <div className="space-y-3 text-sm">
        <div>
          <div>
            Tenant: <span className="font-medium">{tenantSlug}</span>
          </div>
          <div className="text-muted-foreground">User: {user?.email}</div>
        </div>

        <div className="flex gap-2">
          <Link className="border rounded px-3 py-1" to={`/t/${tenantSlug}/projects`}>
            Projects
          </Link>
        </div>

        <div className="text-xs text-muted-foreground">
          Note: tenant membership enforcement is server-side. This page is just a placeholder.
        </div>
      </div>
    </PageShell>
  );
}
