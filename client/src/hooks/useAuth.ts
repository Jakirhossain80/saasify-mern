// FILE: client/src/hooks/useAuth.ts
import { useQuery, useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { http } from "../api/http";
import { API } from "../api/endpoints";
import { useAuthStore, type TenantRole } from "../store/auth.store";
import type { LoginResponse, AuthUser } from "../types/auth.types";

type UseAuthOptions = {
  bootstrap?: boolean;
};

/**
 * This hook bootstraps:
 * - refresh -> accessToken
 * - /auth/me -> user
 *
 * ✅ NEW (safe + minimal):
 * - restore activeTenantSlug from localStorage if missing
 * - if we have user + tenantSlug, fetch tenant role and store activeTenantRole
 *
 * Backend expectation (recommended):
 * GET /api/tenant/me with header: x-tenant-slug
 * returns: { role: "tenantAdmin" | "member" }
 *
 * If your backend endpoint differs, change ONLY the URL in fetchMyTenantRole().
 */
export function useAuth(options: UseAuthOptions = {}) {
  const shouldBootstrap = options.bootstrap ?? true;

  const accessToken = useAuthStore((s) => s.accessToken);
  const user = useAuthStore((s) => s.user);
  const isBootstrapped = useAuthStore((s) => s.isBootstrapped);

  const activeTenantSlug = useAuthStore((s) => s.activeTenantSlug);

  const setAccessToken = useAuthStore((s) => s.setAccessToken);
  const setUser = useAuthStore((s) => s.setUser);
  const setBootstrapped = useAuthStore((s) => s.setBootstrapped);
  const clearAuth = useAuthStore((s) => s.clearAuth);

  const setActiveTenantSlug = useAuthStore((s) => s.setActiveTenantSlug);
  const setActiveTenantRole = useAuthStore((s) => s.setActiveTenantRole);

  async function fetchMyTenantRole(tenantSlug: string): Promise<TenantRole> {
    const url = "/api/tenant/me";

    const { data } = await http.get<{ role?: TenantRole; membership?: { role?: TenantRole } }>(url, {
      headers: { "x-tenant-slug": tenantSlug },
    });

    const role = (data?.role ?? data?.membership?.role ?? null) as TenantRole | null;
    if (role !== "tenantAdmin" && role !== "member") throw new Error("Tenant role not found");
    return role;
  }

  const bootstrap = useQuery({
    queryKey: ["auth", "bootstrap"],
    enabled: shouldBootstrap && !isBootstrapped,
    queryFn: async () => {
      try {
        // 1) refresh -> accessToken
        if (!useAuthStore.getState().accessToken) {
          try {
            const { data } = await http.post(API.auth.refresh, {});
            if (data?.accessToken) setAccessToken(data.accessToken);
          } catch {
            // ignore
          }
        }

        // 2) accessToken -> /me -> user
        if (useAuthStore.getState().accessToken && !useAuthStore.getState().user) {
          try {
            const { data } = await http.get<{ user: AuthUser }>(API.auth.me);
            setUser(data.user);
          } catch {
            clearAuth();
          }
        }

        // ✅ 3) restore tenant slug from localStorage (if not in store)
        const storedSlug = localStorage.getItem("activeTenantSlug")?.trim() || null;
        if (!useAuthStore.getState().activeTenantSlug && storedSlug) {
          setActiveTenantSlug(storedSlug);
        }

        // ✅ 4) if we have user + tenantSlug, fetch tenant role (for RoleGate)
        const u = useAuthStore.getState().user;
        const slug = useAuthStore.getState().activeTenantSlug;

        if (u && slug) {
          try {
            const role = await fetchMyTenantRole(slug);
            setActiveTenantRole(role);
          } catch {
            // If tenant no longer valid or membership removed:
            // keep user logged in, but force tenant re-selection
            setActiveTenantRole(null);
          }
        }

        return true;
      } finally {
        setBootstrapped(true);
      }
    },
    staleTime: 0,
  });

  const login = useMutation({
    mutationFn: async (input: { email: string; password: string }) => {
      const { data } = await http.post<LoginResponse>(API.auth.login, input);
      return data;
    },
    onSuccess: async (data) => {
      setAccessToken(data.accessToken);
      setUser(data.user);
      setBootstrapped(true);

      // ✅ after login, try to rehydrate tenant role if slug already stored
      const storedSlug = localStorage.getItem("activeTenantSlug")?.trim() || null;
      if (storedSlug) {
        setActiveTenantSlug(storedSlug);
        try {
          const role = await fetchMyTenantRole(storedSlug);
          setActiveTenantRole(role);
        } catch {
          setActiveTenantRole(null);
        }
      } else {
        setActiveTenantRole(null);
      }

      toast.success("Signed in");
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Login failed");
    },
  });

  /**
   * ✅ PRODUCTION FIX:
   * Clear client auth state immediately on click (optimistic logout),
   * then call server to revoke refresh session + clear cookie.
   */
  const logout = useMutation({
    mutationFn: async () => {
      await http.post(API.auth.logout, {});
    },
    onMutate: async () => {
      clearAuth();
      localStorage.removeItem("activeTenantSlug");
      setBootstrapped(true);
    },
    onSuccess: () => toast.success("Signed out"),
    onError: () => toast.success("Signed out"),
  });

  return {
    accessToken,
    user,
    isBootstrapped,
    activeTenantSlug,
    bootstrap,
    login,
    logout,
  };
}
