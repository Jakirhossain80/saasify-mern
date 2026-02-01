// FILE: client/src/components/guards/RoleGate.tsx
import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuthStore } from "../../store/auth.store";

type Props = {
  children: ReactNode;
  allowPlatformRoles?: Array<"platformAdmin" | "user">;
};

export default function RoleGate({ children, allowPlatformRoles }: Props) {
  const user = useAuthStore((s) => s.user);
  const isBootstrapped = useAuthStore((s) => s.isBootstrapped);

  if (!isBootstrapped) {
    return <div className="p-6 text-sm text-slate-600">Checking permissions…</div>;
  }

  if (!user) return <Navigate to="/sign-in" replace />;

  if (allowPlatformRoles?.length) {
    if (!allowPlatformRoles.includes(user.platformRole)) {
      return <Navigate to="/" replace />;
    }
  }

  return <>{children}</>;
}
