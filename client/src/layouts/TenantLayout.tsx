// FILE: client/src/layouts/TenantLayout.tsx
import { Outlet, useParams } from "react-router-dom";
import PageShell from "../components/common/PageShell";

export default function TenantLayout() {
  const { tenantSlug } = useParams();

  return (
    <PageShell title={`Tenant: ${tenantSlug ?? ""}`}>
      <Outlet />
    </PageShell>
  );
}
