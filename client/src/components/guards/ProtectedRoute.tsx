// FILE: client/src/components/guards/ProtectedRoute.tsx
import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuthStore } from "../../store/auth.store";

export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const loc = useLocation();
  const user = useAuthStore((s) => s.user);
  const isBootstrapped = useAuthStore((s) => s.isBootstrapped);

  // ✅ Wait for bootstrap to finish before deciding
  if (!isBootstrapped) {
    return <div className="p-6 text-sm text-slate-600">Loading session…</div>;
  }

  if (!user) {
    return <Navigate to="/sign-in" replace state={{ from: loc.pathname }} />;
  }

  return <>{children}</>;
}
