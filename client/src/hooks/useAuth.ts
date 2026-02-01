// FILE: client/src/hooks/useAuth.ts
import { useQuery, useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { http } from "../api/http";
import { API } from "../api/endpoints";
import { useAuthStore } from "../store/auth.store";
import type { LoginResponse, AuthUser } from "../types/auth.types";

type UseAuthOptions = {
  bootstrap?: boolean;
};

export function useAuth(options: UseAuthOptions = {}) {
  const shouldBootstrap = options.bootstrap ?? true;

  const accessToken = useAuthStore((s) => s.accessToken);
  const user = useAuthStore((s) => s.user);
  const isBootstrapped = useAuthStore((s) => s.isBootstrapped);

  const setAccessToken = useAuthStore((s) => s.setAccessToken);
  const setUser = useAuthStore((s) => s.setUser);
  const setBootstrapped = useAuthStore((s) => s.setBootstrapped);
  const clearAuth = useAuthStore((s) => s.clearAuth);

  const bootstrap = useQuery({
    queryKey: ["auth", "bootstrap"],
    enabled: shouldBootstrap && !isBootstrapped,
    queryFn: async () => {
      try {
        if (!useAuthStore.getState().accessToken) {
          try {
            const { data } = await http.post(API.auth.refresh, {});
            if (data?.accessToken) setAccessToken(data.accessToken);
          } catch {
            // ignore
          }
        }

        if (useAuthStore.getState().accessToken && !useAuthStore.getState().user) {
          try {
            const { data } = await http.get<{ user: AuthUser }>(API.auth.me);
            setUser(data.user);
          } catch {
            clearAuth();
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
    onSuccess: (data) => {
      setAccessToken(data.accessToken);
      setUser(data.user);
      setBootstrapped(true);
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
      // Still call server (revoke session + clear cookie)
      await http.post(API.auth.logout, {});
    },
    onMutate: async () => {
      // ✅ Immediately update UI (no waiting for server)
      clearAuth();
      setBootstrapped(true);
    },
    onSuccess: () => {
      toast.success("Signed out");
    },
    onError: () => {
      // We already cleared local state; still show success UX
      toast.success("Signed out");
    },
  });

  return {
    accessToken,
    user,
    isBootstrapped,
    bootstrap,
    login,
    logout,
  };
}
