// FILE: client/src/components/guards/RoleGate.tsx
import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuthStore, type TenantRole } from "../../store/auth.store";

type Props = {
  children: ReactNode;

  // ✅ existing platform role gating necessary items
  allowPlatformRoles?: Array<"platformAdmin" | "user">;

  // ✅ NEW: tenant roles gating
  allowTenantRoles?: TenantRole[];

  // ✅ optional: where to redirect if tenant role fails
  tenantDenyTo?: string;
};

export default function RoleGate({
  children,
  allowPlatformRoles,
  allowTenantRoles,
  tenantDenyTo = "/select-tenant",
}: Props) {
  const user = useAuthStore((s) => s.user);
  const isBootstrapped = useAuthStore((s) => s.isBootstrapped);

  const activeTenantSlug = useAuthStore((s) => s.activeTenantSlug);
  const activeTenantRole = useAuthStore((s) => s.activeTenantRole);

  if (!isBootstrapped) {
    return <div className="p-6 text-sm text-slate-600">Checking permissions…</div>;
  }

  if (!user) return <Navigate to="/sign-in" replace />;

  // ✅ Platform role check
  if (allowPlatformRoles?.length) {
    if (!allowPlatformRoles.includes(user.platformRole)) {
      return <Navigate to="/" replace />;
    }
  }

  // ✅ Tenant role check (only if requested)
  if (allowTenantRoles?.length) {
    // If tenant isn't selected yet, push to select-tenant
    if (!activeTenantSlug) return <Navigate to="/select-tenant" replace />;

    // If role isn't known yet, show loading message (prevents flicker)
    if (!activeTenantRole) {
      return <div className="p-6 text-sm text-slate-600">Loading tenant permissions…</div>;
    }

    if (!allowTenantRoles.includes(activeTenantRole)) {
      return <Navigate to={tenantDenyTo} replace />;
    }
  }

  return <>{children}</>;
}
