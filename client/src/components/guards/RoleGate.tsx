// FILE: client/src/components/guards/RoleGate.tsx
import { Navigate } from "react-router-dom";
import type { PlatformRole } from "../../types/auth.types";
import { useAuthStore } from "../../store/auth.store";

export default function RoleGate({
  allowPlatformRoles,
  children,
}: {
  allowPlatformRoles: PlatformRole[];
  children: React.ReactNode;
}) {
  const user = useAuthStore((s) => s.user);

  if (!user) return <Navigate to="/sign-in" replace />;

  const ok = allowPlatformRoles.includes(user.platformRole);
  if (!ok) return <Navigate to="/" replace />;

  return <>{children}</>;
}
