// FILE: client/src/layouts/PlatformLayout.tsx
import { Outlet, Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useState } from "react";
import { useAuthStore } from "../store/auth.store";
import { http } from "../api/http";
import { API } from "../api/endpoints";

export default function PlatformLayout() {
  const nav = useNavigate();
  const user = useAuthStore((s) => s.user);
  const clearAuth = useAuthStore((s) => s.clearAuth);

  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);

    // ✅ Optimistic logout: clear UI immediately
    clearAuth();
    nav("/sign-in", { replace: true });

    try {
      await http.post(API.auth.logout, {}); // keep cookie revoke on server
      toast.success("Logged out");
    } catch (e: any) {
      // Even if server fails, user is logged out locally (correct UX)
      toast.success("Logged out");
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-white text-slate-900">
      {/* Top bar */}
      <header className="border-b">
        <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
          <Link to="/" className="font-semibold">
            SaaSify
          </Link>

          <div className="flex items-center gap-3 text-sm">
            <span className="text-slate-600">{user?.email}</span>

            <button
              type="button"
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="border rounded px-3 py-1.5 hover:bg-slate-50 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isLoggingOut ? "Logging out..." : "Logout"}
            </button>
          </div>
        </div>
      </header>

      {/* Page content */}
      <main className="mx-auto max-w-6xl px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
}
