// FILE: client/src/hooks/useAuth.ts
import { useQuery, useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { http } from "../api/http";
import { API } from "../api/endpoints";
import { useAuthStore } from "../store/auth.store";
import type { LoginResponse, AuthUser } from "../types/auth.types";

export function useAuth() {
  const accessToken = useAuthStore((s) => s.accessToken);
  const user = useAuthStore((s) => s.user);
  const isBootstrapped = useAuthStore((s) => s.isBootstrapped);

  const setAccessToken = useAuthStore((s) => s.setAccessToken);
  const setUser = useAuthStore((s) => s.setUser);
  const setBootstrapped = useAuthStore((s) => s.setBootstrapped);
  const clearAuth = useAuthStore((s) => s.clearAuth);

  // Bootstrap auth on app load:
  // - If accessToken missing, try refresh (cookie-based)
  // - Then optionally call /me to get user
  const bootstrap = useQuery({
    queryKey: ["auth", "bootstrap"],
    enabled: !isBootstrapped,
    queryFn: async () => {
      // Try refresh if no access token
      if (!useAuthStore.getState().accessToken) {
        try {
          const { data } = await http.post(API.auth.refresh, {});
          if (data?.accessToken) setAccessToken(data.accessToken);
          if (data?.user) setUser(data.user);
        } catch {
          // ignore; user remains logged out
        }
      }

      // If still no user but we have a token, fetch /me
      if (useAuthStore.getState().accessToken && !useAuthStore.getState().user) {
        try {
          const { data } = await http.get<{ user: AuthUser }>(API.auth.me);
          setUser(data.user);
        } catch {
          clearAuth();
        }
      }

      setBootstrapped(true);
      return true;
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
      toast.success("Signed in");
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Login failed");
    },
  });

  const logout = useMutation({
    mutationFn: async () => {
      await http.post(API.auth.logout, {});
    },
    onSuccess: () => {
      clearAuth();
      toast.success("Signed out");
    },
    onError: () => {
      // still clear local state
      clearAuth();
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
