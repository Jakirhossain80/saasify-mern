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
 * ✅ Also restores:
 * - activeTenantSlug from localStorage (if missing)
 * - activeTenantRole by calling: GET /api/t/:tenantSlug/me
 *
 * Backend expectation:
 * GET /api/t/:tenantSlug/me
 * returns: { tenant: {...}, role: "tenantAdmin" | "member" }
 */
export function useAuth(options: UseAuthOptions = {}) {
  const shouldBootstrap = options.bootstrap ?? true;

  const accessToken = useAuthStore((s) => s.accessToken);
  const user = useAuthStore((s) => s.user);
  const isBootstrapped = useAuthStore((s) => s.isBootstrapped);

  const activeTenantSlug = useAuthStore((s) => s.activeTenantSlug);
  const activeTenantRole = useAuthStore((s) => s.activeTenantRole);

  const setAccessToken = useAuthStore((s) => s.setAccessToken);
  const setUser = useAuthStore((s) => s.setUser);
  const setBootstrapped = useAuthStore((s) => s.setBootstrapped);
  const clearAuth = useAuthStore((s) => s.clearAuth);

  const setActiveTenantSlug = useAuthStore((s) => s.setActiveTenantSlug);
  const setActiveTenantRole = useAuthStore((s) => s.setActiveTenantRole);

  async function fetchMyTenantRole(tenantSlug: string): Promise<TenantRole> {
    // ✅ Correct endpoint in your project:
    // GET /api/t/:tenantSlug/me
    const { data } = await http.get<{ role?: TenantRole; membership?: { role?: TenantRole } }>(
      API.tenant.me(tenantSlug)
    );

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
            // ignore refresh errors (user not logged in)
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

        // 3) restore tenant slug from localStorage (if not in store)
        const storedSlug = localStorage.getItem("activeTenantSlug")?.trim() || null;
        if (!useAuthStore.getState().activeTenantSlug && storedSlug) {
          setActiveTenantSlug(storedSlug);
        }

        // 4) if we have user + tenantSlug and role not loaded, fetch tenant role
        const u = useAuthStore.getState().user;
        const slug = useAuthStore.getState().activeTenantSlug;
        const roleInStore = useAuthStore.getState().activeTenantRole;

        if (u && slug && !roleInStore) {
          try {
            const role = await fetchMyTenantRole(slug);
            setActiveTenantRole(role);
          } catch {
            // keep user logged in, but tenant context invalid / removed
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

      // after login, try to rehydrate tenant role if slug already stored
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
   * Clear client auth state immediately (optimistic logout),
   * then call server to clear cookie / revoke refresh.
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
    activeTenantRole,
    bootstrap,
    login,
    logout,
  };
}
